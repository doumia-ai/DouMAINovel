"""OpenAPI Schema 转换器 - 将 OpenAPI 规范转换为 MCP 工具格式"""

from typing import Dict, Any, List, Optional
from app.logger import get_logger

logger = get_logger(__name__)


class OpenAPIConverter:
    """
    OpenAPI Schema 转换器
    
    将 OpenAPI 3.0/3.1 规范转换为 MCP 工具格式，
    使 HTTP Tool Provider 的工具定义与 MCP Provider 保持一致。
    """
    
    @staticmethod
    def convert_to_mcp_tools(openapi_schema: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        将 OpenAPI schema 转换为 MCP 工具列表
        
        Args:
            openapi_schema: OpenAPI 3.0/3.1 规范的 JSON schema
            
        Returns:
            MCP 工具格式的列表，每个工具包含:
            - name: 工具名称
            - description: 工具描述
            - inputSchema: JSON Schema 格式的输入参数定义
        """
        tools = []
        
        paths = openapi_schema.get("paths", {})
        
        for path, path_item in paths.items():
            for method, operation in path_item.items():
                # 只处理 HTTP 方法
                if method.lower() not in ["get", "post", "put", "patch", "delete"]:
                    continue
                
                tool = OpenAPIConverter._convert_operation_to_tool(
                    path=path,
                    method=method,
                    operation=operation,
                    openapi_schema=openapi_schema
                )
                
                if tool:
                    tools.append(tool)
        
        logger.info(f"从 OpenAPI schema 转换了 {len(tools)} 个工具")
        return tools
    
    @staticmethod
    def _convert_operation_to_tool(
        path: str,
        method: str,
        operation: Dict[str, Any],
        openapi_schema: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        将单个 OpenAPI operation 转换为 MCP 工具
        
        Args:
            path: API 路径
            method: HTTP 方法
            operation: OpenAPI operation 对象
            openapi_schema: 完整的 OpenAPI schema（用于解析 $ref）
            
        Returns:
            MCP 工具定义，或 None（如果无法转换）
        """
        # 生成工具名称
        # 优先使用 operationId，否则从路径生成
        operation_id = operation.get("operationId")
        if operation_id:
            tool_name = operation_id
        else:
            # 从路径生成名称: /users/{id}/posts -> users_id_posts
            path_parts = path.strip("/").replace("{", "").replace("}", "").split("/")
            tool_name = f"{method.lower()}_{'_'.join(path_parts)}"
        
        # 获取描述
        description = operation.get("summary") or operation.get("description") or f"{method.upper()} {path}"
        
        # 构建输入参数 schema
        input_schema = OpenAPIConverter._build_input_schema(
            operation=operation,
            openapi_schema=openapi_schema
        )
        
        tool = {
            "name": tool_name,
            "description": description,
            "inputSchema": input_schema,
            # 额外元数据，用于调用时构建请求
            "_http_meta": {
                "path": path,
                "method": method.upper()
            }
        }
        
        return tool
    
    @staticmethod
    def _build_input_schema(
        operation: Dict[str, Any],
        openapi_schema: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        构建工具的输入参数 JSON Schema
        
        合并 path parameters、query parameters 和 request body
        """
        properties = {}
        required = []
        
        # 1. 处理 parameters (path, query, header)
        parameters = operation.get("parameters", [])
        for param in parameters:
            # 解析 $ref
            if "$ref" in param:
                param = OpenAPIConverter._resolve_ref(param["$ref"], openapi_schema)
            
            param_name = param.get("name")
            param_in = param.get("in")  # path, query, header, cookie
            param_required = param.get("required", False)
            param_schema = param.get("schema", {"type": "string"})
            param_description = param.get("description", "")
            
            # 只处理 path 和 query 参数
            if param_in in ["path", "query"]:
                properties[param_name] = {
                    **param_schema,
                    "description": param_description
                }
                
                if param_required or param_in == "path":
                    required.append(param_name)
        
        # 2. 处理 requestBody
        request_body = operation.get("requestBody", {})
        if request_body:
            # 解析 $ref
            if "$ref" in request_body:
                request_body = OpenAPIConverter._resolve_ref(request_body["$ref"], openapi_schema)
            
            content = request_body.get("content", {})
            
            # 优先处理 application/json
            json_content = content.get("application/json", {})
            if json_content:
                body_schema = json_content.get("schema", {})
                
                # 解析 $ref
                if "$ref" in body_schema:
                    body_schema = OpenAPIConverter._resolve_ref(body_schema["$ref"], openapi_schema)
                
                # 如果 body 是对象类型，合并其属性
                if body_schema.get("type") == "object":
                    body_properties = body_schema.get("properties", {})
                    body_required = body_schema.get("required", [])
                    
                    properties.update(body_properties)
                    required.extend(body_required)
                else:
                    # 非对象类型，作为 body 参数
                    properties["body"] = body_schema
                    if request_body.get("required", False):
                        required.append("body")
        
        return {
            "type": "object",
            "properties": properties,
            "required": list(set(required))  # 去重
        }
    
    @staticmethod
    def _resolve_ref(ref: str, openapi_schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        解析 $ref 引用
        
        Args:
            ref: $ref 字符串，如 "#/components/schemas/User"
            openapi_schema: 完整的 OpenAPI schema
            
        Returns:
            解析后的对象
        """
        if not ref.startswith("#/"):
            logger.warning(f"不支持的 $ref 格式: {ref}")
            return {}
        
        # 解析路径
        path_parts = ref[2:].split("/")
        
        result = openapi_schema
        for part in path_parts:
            if isinstance(result, dict) and part in result:
                result = result[part]
            else:
                logger.warning(f"无法解析 $ref: {ref}")
                return {}
        
        # 递归解析嵌套的 $ref
        if isinstance(result, dict) and "$ref" in result:
            return OpenAPIConverter._resolve_ref(result["$ref"], openapi_schema)
        
        return result
    
    @staticmethod
    def extract_tool_metadata(
        tool_name: str,
        tools: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        从工具列表中提取指定工具的 HTTP 元数据
        
        Args:
            tool_name: 工具名称
            tools: 工具列表
            
        Returns:
            HTTP 元数据（path, method），或 None
        """
        for tool in tools:
            if tool.get("name") == tool_name:
                return tool.get("_http_meta")
        return None