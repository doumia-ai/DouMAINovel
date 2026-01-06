"""HTTP Tool Client - 普通 HTTP API 的工具客户端（非 MCP 协议）

此客户端用于连接普通的 HTTP API（如 FastAPI、Flask 等），
通过 OpenAPI schema 发现工具，并将工具调用转换为 HTTP 请求。

与 HTTPMCPClient 的区别：
- HTTPMCPClient: 使用 MCP 协议（JSON-RPC），需要 initialize 握手
- HTTPToolClient: 使用普通 HTTP，通过 OpenAPI 发现工具，无需握手
"""

import asyncio
import time
import re
from typing import Dict, Any, List, Optional
import httpx

from app.mcp.openapi_converter import OpenAPIConverter
from app.logger import get_logger

logger = get_logger(__name__)


class HTTPToolError(Exception):
    """HTTP Tool 错误"""
    pass


class HTTPToolClient:
    """
    HTTP Tool Client - 普通 HTTP API 的工具客户端
    
    功能：
    1. 通过 OpenAPI schema 发现工具
    2. 将工具调用转换为 HTTP 请求
    3. 不进行 MCP 协议握手
    
    接口设计与 HTTPMCPClient 保持一致，便于 Registry 统一管理。
    """
    
    def __init__(
        self,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        env: Optional[Dict[str, str]] = None,
        timeout: float = 60.0,
        openapi_path: str = "/openapi.json",
        tool_endpoint_template: Optional[str] = None
    ):
        """
        初始化 HTTP Tool Client
        
        Args:
            url: API 基础 URL
            headers: HTTP 请求头
            env: 环境变量（用于 API Key 等）
            timeout: 超时时间（秒）
            openapi_path: OpenAPI schema 路径，默认 /openapi.json
            tool_endpoint_template: 工具调用 URL 模板，如 /tools/{tool_name}/invoke
                                   如果为 None，则使用 OpenAPI 中定义的路径
        """
        self.url = url.rstrip('/')
        self.headers = headers or {}
        self.env = env or {}
        self.timeout = timeout
        self.openapi_path = openapi_path
        self.tool_endpoint_template = tool_endpoint_template
        
        # 如果 env 中有 API Key，添加到 headers
        if 'API_KEY' in self.env:
            self.headers['Authorization'] = f'Bearer {self.env["API_KEY"]}'
        
        # 缓存
        self._openapi_schema: Optional[Dict[str, Any]] = None
        self._tools: Optional[List[Dict[str, Any]]] = None
        self._initialized = False
        self._lock = asyncio.Lock()
        
        # HTTP 客户端
        self._client: Optional[httpx.AsyncClient] = None
    
    async def _ensure_client(self):
        """确保 HTTP 客户端已创建"""
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.url,
                headers=self.headers,
                timeout=self.timeout
            )
    
    async def _ensure_initialized(self):
        """确保已初始化（获取 OpenAPI schema）"""
        async with self._lock:
            if self._initialized:
                return
            
            await self._ensure_client()
            
            try:
                logger.info(f"🔗 连接到 HTTP API: {self.url}")
                
                # 获取 OpenAPI schema
                response = await self._client.get(self.openapi_path)
                response.raise_for_status()
                
                self._openapi_schema = response.json()
                
                # 转换为 MCP 工具格式
                self._tools = OpenAPIConverter.convert_to_mcp_tools(self._openapi_schema)
                
                self._initialized = True
                
                logger.info(f"✅ HTTP Tool Client 初始化成功，发现 {len(self._tools)} 个工具")
                
            except httpx.HTTPStatusError as e:
                logger.error(f"❌ 获取 OpenAPI schema 失败: HTTP {e.response.status_code}")
                raise HTTPToolError(f"获取 OpenAPI schema 失败: HTTP {e.response.status_code}")
            except Exception as e:
                logger.error(f"❌ HTTP Tool Client 初始化失败: {e}")
                raise HTTPToolError(f"初始化失败: {str(e)}")
    
    async def initialize(self) -> Dict[str, Any]:
        """
        初始化客户端（获取 OpenAPI schema）
        
        Returns:
            初始化响应
        """
        await self._ensure_initialized()
        return {
            "status": "initialized",
            "provider_type": "http",
            "tools_count": len(self._tools) if self._tools else 0
        }
    
    async def list_tools(self) -> List[Dict[str, Any]]:
        """
        列举可用工具
        
        Returns:
            工具列表（MCP 格式）
        """
        await self._ensure_initialized()
        
        # 返回不含 _http_meta 的工具列表（对外接口）
        tools = []
        for tool in self._tools:
            tool_copy = {
                "name": tool["name"],
                "description": tool.get("description", ""),
                "inputSchema": tool.get("inputSchema", {})
            }
            tools.append(tool_copy)
        
        logger.info(f"获取到 {len(tools)} 个工具")
        return tools
    
    async def call_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        max_retries: int = 2
    ) -> Any:
        """
        调用工具
        
        Args:
            tool_name: 工具名称
            arguments: 工具参数
            max_retries: 最大重试次数
            
        Returns:
            工具执行结果
        """
        await self._ensure_initialized()
        
        # 查找工具
        tool = None
        for t in self._tools:
            if t["name"] == tool_name:
                tool = t
                break
        
        if not tool:
            raise HTTPToolError(f"工具不存在: {tool_name}")
        
        # 获取 HTTP 元数据
        http_meta = tool.get("_http_meta", {})
        path = http_meta.get("path", f"/tools/{tool_name}")
        method = http_meta.get("method", "POST")
        
        # 如果有自定义模板，使用模板
        if self.tool_endpoint_template:
            path = self.tool_endpoint_template.replace("{tool_name}", tool_name)
            method = "POST"
        
        # 构建请求
        # 分离 path 参数和 body 参数
        path_params = {}
        query_params = {}
        body_params = {}
        
        # 从 inputSchema 中获取参数定义
        input_schema = tool.get("inputSchema", {})
        properties = input_schema.get("properties", {})
        
        for param_name, param_value in arguments.items():
            # 检查是否是 path 参数
            if "{" + param_name + "}" in path:
                path_params[param_name] = param_value
            else:
                # 其他参数作为 body
                body_params[param_name] = param_value
        
        # 替换 path 参数
        actual_path = path
        for param_name, param_value in path_params.items():
            actual_path = actual_path.replace("{" + param_name + "}", str(param_value))
        
        # 执行请求
        logger.info(f"调用工具: {tool_name}, {method} {actual_path}")
        logger.debug(f"  参数: {arguments}")
        
        for attempt in range(max_retries + 1):
            try:
                if method.upper() == "GET":
                    response = await self._client.get(actual_path, params=body_params)
                elif method.upper() == "POST":
                    response = await self._client.post(actual_path, json=body_params)
                elif method.upper() == "PUT":
                    response = await self._client.put(actual_path, json=body_params)
                elif method.upper() == "PATCH":
                    response = await self._client.patch(actual_path, json=body_params)
                elif method.upper() == "DELETE":
                    response = await self._client.delete(actual_path, params=body_params)
                else:
                    raise HTTPToolError(f"不支持的 HTTP 方法: {method}")
                
                response.raise_for_status()
                
                # 解析响应
                content_type = response.headers.get("content-type", "")
                if "application/json" in content_type:
                    result = response.json()
                else:
                    result = response.text
                
                logger.info(f"✅ 工具调用成功: {tool_name}")
                return result
                
            except httpx.HTTPStatusError as e:
                if attempt < max_retries:
                    logger.warning(f"⚠️ 工具调用失败，重试中 ({attempt + 1}/{max_retries}): {e}")
                    await asyncio.sleep(0.5 * (attempt + 1))
                    continue
                raise HTTPToolError(f"工具调用失败: HTTP {e.response.status_code}")
            except Exception as e:
                if attempt < max_retries:
                    logger.warning(f"⚠️ 工具调用失败，重试中 ({attempt + 1}/{max_retries}): {e}")
                    await asyncio.sleep(0.5 * (attempt + 1))
                    continue
                raise HTTPToolError(f"工具调用失败: {str(e)}")
        
        raise HTTPToolError(f"工具调用失败: 已达最大重试次数")
    
    async def list_resources(self) -> List[Dict[str, Any]]:
        """
        列举可用资源（HTTP Tool Provider 不支持资源）
        
        Returns:
            空列表
        """
        return []
    
    async def read_resource(self, uri: str) -> Any:
        """
        读取资源（HTTP Tool Provider 不支持资源）
        
        Raises:
            HTTPToolError: 不支持的操作
        """
        raise HTTPToolError("HTTP Tool Provider 不支持资源操作")
    
    async def test_connection(self) -> Dict[str, Any]:
        """
        测试连接
        
        Returns:
            测试结果
        """
        start_time = time.time()
        
        try:
            await self._ensure_client()
            
            # 尝试获取 OpenAPI schema
            response = await self._client.get(self.openapi_path)
            response.raise_for_status()
            
            openapi_schema = response.json()
            tools = OpenAPIConverter.convert_to_mcp_tools(openapi_schema)
            
            end_time = time.time()
            response_time = round((end_time - start_time) * 1000, 2)
            
            logger.info(f"✅ 连接测试成功，获取到 {len(tools)} 个工具")
            
            return {
                "success": True,
                "message": "连接测试成功",
                "provider_type": "http",
                "response_time_ms": response_time,
                "tools_count": len(tools),
                "tools": [
                    {
                        "name": t["name"],
                        "description": t.get("description", ""),
                        "inputSchema": t.get("inputSchema", {})
                    }
                    for t in tools
                ]
            }
            
        except httpx.HTTPStatusError as e:
            end_time = time.time()
            response_time = round((end_time - start_time) * 1000, 2)
            
            return {
                "success": False,
                "message": "连接测试失败",
                "provider_type": "http",
                "response_time_ms": response_time,
                "error": f"HTTP {e.response.status_code}",
                "error_type": "HTTPStatusError",
                "suggestions": [
                    f"请检查 OpenAPI schema 路径是否正确: {self.openapi_path}",
                    "请确认服务器已启动",
                    "请检查 API Key 是否有效"
                ]
            }
        except Exception as e:
            end_time = time.time()
            response_time = round((end_time - start_time) * 1000, 2)
            
            return {
                "success": False,
                "message": "连接测试失败",
                "provider_type": "http",
                "response_time_ms": response_time,
                "error": str(e),
                "error_type": type(e).__name__,
                "suggestions": [
                    "请检查服务器 URL 是否正确",
                    "请确认网络连接正常",
                    "请检查服务器是否在线"
                ]
            }
    
    async def close(self):
        """关闭客户端连接"""
        logger.info(f"关闭 HTTP Tool Client: {self.url}")
        if self._client:
            await self._client.aclose()
            self._client = None
        self._initialized = False
        self._openapi_schema = None
        self._tools = None