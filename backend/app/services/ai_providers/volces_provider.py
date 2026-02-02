"""Volcengine Ark Provider

用于将应用内部的统一 Provider 接口（prompt -> chat completion）对接到 Ark OpenAI-compatible 客户端。

关键点：
- Ark 的 OpenAI 兼容端点在 tools / stream 方面可能存在差异。
- 这里采取“尽量兼容”的策略：
  - 无 tools：直接走 client.chat_completion_stream() / chat_completion()
  - 有 tools：仍走 OpenAI 规范（由 client 传 tools），如遇不兼容可后续在此做降级。
"""

from __future__ import annotations

from typing import Any, AsyncGenerator, Dict, List, Optional

from app.logger import get_logger
from app.services.ai_clients.volces_client import VolcesClient
from .base_provider import BaseAIProvider

logger = get_logger(__name__)


class VolcesProvider(BaseAIProvider):
    """Volcengine Ark 提供商"""

    def __init__(self, client: VolcesClient):
        self.client = client

    async def generate(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str] = None,
        tools: Optional[List[Dict]] = None,
        tool_choice: Optional[str] = None,
    ) -> Dict[str, Any]:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        return await self.client.chat_completion(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            tools=tools,
            tool_choice=tool_choice,
        )

    async def generate_stream(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str] = None,
        tools: Optional[List[Dict]] = None,
        tool_choice: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        # 当前项目的“工具调用”逻辑集中在 OpenAIProvider 内（会在 done 时调用 MCP 工具并二次生成）。
        # VolcesProvider 先提供纯文本流式输出能力；后续如需 Ark + MCP，可参照 OpenAIProvider 做同样的封装。
        async for chunk in self.client.chat_completion_stream(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            tools=tools,
            tool_choice=tool_choice if tool_choice else ("auto" if tools else None),
        ):
            if isinstance(chunk, dict):
                if chunk.get("content"):
                    yield chunk["content"]
                # 工具调用暂不在此处处理（避免行为与 OpenAIProvider 不一致）
                if chunk.get("done"):
                    break
            else:
                yield chunk
