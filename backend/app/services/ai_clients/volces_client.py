"""Volcengine Ark (Volces) OpenAI-Compatible 客户端

实现目标：
- 作为“独立厂商 client”，但复用 OpenAI Chat Completions 兼容协议。
- 与现有 [`backend/app/services/ai_clients/openai_client.py`](backend/app/services/ai_clients/openai_client.py:1) 的差异：
  - 不做 Zhipu/Ark 的“自动识别+降级”混杂逻辑；专门服务 Ark。
  - 后续可在这里加入 Ark 特有的 header、错误解析、模型列表等。

说明：
- Ark OpenAI-compatible 网关通常 base_url 形如 `https://ark.cn-beijing.volces.com/api/v3`。
- chat endpoint：`POST {base_url}/chat/completions`
- models endpoint（如需）：`GET {base_url}/models`

注意：
- Ark 对 stream/SSE 的兼容度在不同产品形态/账号/模型上可能不一致。
  本 client 默认：
  - 非流式：直接走 /chat/completions
  - 流式：优先尝试 SSE；若失败，可由上层 Provider 做降级（或后续在此内置降级策略）。
"""

from __future__ import annotations

import json
from typing import Any, AsyncGenerator, Dict, Optional

import httpx

from app.logger import get_logger
from .base_client import BaseAIClient

logger = get_logger(__name__)


class VolcesClient(BaseAIClient):
    """火山方舟（Ark）OpenAI-Compatible 客户端"""

    def _build_headers(self) -> Dict[str, str]:
        # OpenAI 兼容：Bearer Token
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _build_payload(
        self,
        messages: list,
        model: str,
        temperature: float,
        max_tokens: int,
        tools: Optional[list] = None,
        tool_choice: Optional[str] = None,
        stream: bool = False,
    ) -> Dict[str, Any]:
        # Ark 基于 OpenAI 兼容协议：messages/temperature/max_tokens/tools/tool_choice
        # 做最小清洗：过滤空 content
        clean_messages = [m for m in messages if m.get("content") and str(m["content"]).strip()]

        # Ark 会对 max_tokens 做硬限制（从日志看当前网关要求 <= 32768）。
        # 这里做强制上限保护，避免上游传入异常大值导致 400。
        safe_max_tokens = int(max_tokens) if max_tokens is not None else 0
        if safe_max_tokens <= 0:
            # 保底：给一个合理默认值，避免某些网关拒绝 0/负数
            safe_max_tokens = 2048
        safe_max_tokens = min(safe_max_tokens, 32768)

        payload: Dict[str, Any] = {
            "model": model,
            "messages": clean_messages,
            "temperature": temperature,
            "max_tokens": safe_max_tokens,
        }

        if stream:
            payload["stream"] = True

        if tools:
            cleaned = []
            for t in tools:
                tc = t.copy()
                # 清理 JSON schema 中部分字段，提升兼容性
                if "function" in tc and "parameters" in tc["function"]:
                    tc["function"]["parameters"] = {
                        k: v for k, v in tc["function"]["parameters"].items() if k != "$schema"
                    }
                cleaned.append(tc)
            payload["tools"] = cleaned
            if tool_choice:
                payload["tool_choice"] = tool_choice

        return payload

    async def chat_completion(
        self,
        messages: list,
        model: str,
        temperature: float,
        max_tokens: int,
        tools: Optional[list] = None,
        tool_choice: Optional[str] = None,
    ) -> Dict[str, Any]:
        payload = self._build_payload(messages, model, temperature, max_tokens, tools, tool_choice)

        logger.debug("📤 Volces ChatCompletion Payload: %s", json.dumps(payload, ensure_ascii=False))

        data = await self._request_with_retry("POST", "/chat/completions", payload)

        choices = data.get("choices", [])
        if not choices:
            raise ValueError("Volces/Ark API 返回空 choices")

        message = choices[0].get("message", {})
        finish_reason = choices[0].get("finish_reason")

        return {
            "content": message.get("content", ""),
            "tool_calls": message.get("tool_calls"),
            "finish_reason": finish_reason,
        }

    async def chat_completion_stream(
        self,
        messages: list,
        model: str,
        temperature: float,
        max_tokens: int,
        tools: Optional[list] = None,
        tool_choice: Optional[str] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        payload = self._build_payload(
            messages,
            model,
            temperature,
            max_tokens,
            tools,
            tool_choice,
            stream=True,
        )

        tool_calls_buffer = {}

        try:
            async with await self._request_with_retry(
                "POST", "/chat/completions", payload, stream=True
            ) as response:
                try:
                    response.raise_for_status()
                except httpx.HTTPStatusError as e:
                    detail = ""
                    try:
                        detail = json.dumps(e.response.json(), ensure_ascii=False)
                    except Exception:
                        try:
                            detail = e.response.text
                        except Exception:
                            detail = "<no response body>"

                    logger.error(
                        "Volces/Ark 流式请求 HTTP 错误: status=%s url=%s model=%s base_url=%s body=%s",
                        e.response.status_code,
                        str(e.response.url),
                        payload.get("model"),
                        self.base_url,
                        detail,
                    )
                    raise

                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue

                    data_str = line[6:]
                    if data_str.strip() == "[DONE]":
                        if tool_calls_buffer:
                            yield {"tool_calls": list(tool_calls_buffer.values()), "done": True}
                        yield {"done": True}
                        break

                    try:
                        data = json.loads(data_str)
                    except json.JSONDecodeError:
                        continue

                    choices = data.get("choices", [])
                    if not choices:
                        continue

                    delta = choices[0].get("delta", {})

                    content = delta.get("content")
                    if content:
                        yield {"content": content}

                    # tool_calls（OpenAI SSE 规范增量）
                    tool_calls = delta.get("tool_calls")
                    if tool_calls:
                        for tc in tool_calls:
                            idx = tc.get("index", 0)
                            if idx not in tool_calls_buffer:
                                tool_calls_buffer[idx] = {
                                    "id": tc.get("id"),
                                    "type": tc.get("type", "function"),
                                    "function": {
                                        "name": tc.get("function", {}).get("name"),
                                        "arguments": "",
                                    },
                                }
                            # 拼接 arguments 增量
                            args_delta = tc.get("function", {}).get("arguments")
                            if args_delta:
                                tool_calls_buffer[idx]["function"]["arguments"] += args_delta

        except GeneratorExit:
            raise
