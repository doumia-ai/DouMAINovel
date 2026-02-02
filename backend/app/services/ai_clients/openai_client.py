"""OpenAI / Zhipu(BigModel) 最终兼容客户端"""
import json
from typing import Any, AsyncGenerator, Dict, Optional

from app.logger import get_logger
from .base_client import BaseAIClient

logger = get_logger(__name__)


class OpenAIClient(BaseAIClient):
    """OpenAI API 客户端（工程级兼容智谱 BigModel）"""

    # ======================
    # 基础判断
    # ======================

    def _is_zhipu_api(self) -> bool:
        return "bigmodel.cn" in self.base_url

    def _build_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    # ======================
    # Payload 构造
    # ======================

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

        is_zhipu = self._is_zhipu_api()

        # ---- 1️⃣ messages 清洗（智谱强制要求）----
        clean_messages = [
            m for m in messages
            if m.get("content") and str(m["content"]).strip()
        ]

        # ---- 2️⃣ temperature 修正（智谱不允许 <=0）----
        if is_zhipu and temperature <= 0:
            temperature = 0.1
            logger.debug("🔧 Zhipu: temperature 调整为 0.1")

        payload: Dict[str, Any] = {
            "model": model,
            "messages": clean_messages,
            "temperature": temperature,
        }

        # ---- 3️⃣ max_tokens ----
        if is_zhipu:
            # GLM-4.5 系列支持较大的输出长度，设置合理值避免被默认值截断
            payload["max_tokens"] = min(max_tokens, 8192)
        elif self._is_ark_api():
            # Volcengine Ark 网关对 max_tokens 有硬上限（常见为 <= 32768）。
            # 上游若传入异常大值会直接 400，因此这里做保护。
            try:
                safe_max_tokens = int(max_tokens)
            except Exception:
                safe_max_tokens = 2048
            if safe_max_tokens <= 0:
                safe_max_tokens = 2048
            payload["max_tokens"] = min(safe_max_tokens, 32768)
        else:
            payload["max_tokens"] = max_tokens

        # ---- 4️⃣ stream（智谱不支持 OpenAI SSE）----
        if stream and not is_zhipu:
            payload["stream"] = True

        # ---- 5️⃣ tools（智谱工程上默认禁用）----
        if tools and not is_zhipu:
            cleaned = []
            for t in tools:
                tc = t.copy()
                if "function" in tc and "parameters" in tc["function"]:
                    tc["function"]["parameters"] = {
                        k: v
                        for k, v in tc["function"]["parameters"].items()
                        if k != "$schema"
                    }
                cleaned.append(tc)

            payload["tools"] = cleaned
            if tool_choice:
                payload["tool_choice"] = tool_choice

        return payload

    # ======================
    # 非流式
    # ======================

    async def chat_completion(
        self,
        messages: list,
        model: str,
        temperature: float,
        max_tokens: int,
        tools: Optional[list] = None,
        tool_choice: Optional[str] = None,
    ) -> Dict[str, Any]:

        payload = self._build_payload(
            messages, model, temperature, max_tokens, tools, tool_choice
        )

        logger.debug(
            f"📤 ChatCompletion Payload:\n{json.dumps(payload, ensure_ascii=False, indent=2)}"
        )

        data = await self._request_with_retry("POST", "/chat/completions", payload)

        logger.debug(
            f"📥 ChatCompletion Response:\n{json.dumps(data, ensure_ascii=False, indent=2)}"
        )

        choices = data.get("choices", [])
        if not choices:
            raise ValueError("API 返回空 choices")

        message = choices[0].get("message", {})
        finish_reason = choices[0].get("finish_reason")

        # 检测是否因长度限制被截断
        if finish_reason == "length":
            logger.warning(f"⚠️ API响应因长度限制被截断 (finish_reason=length)，可能导致JSON不完整")

        return {
            "content": message.get("content", ""),
            "tool_calls": message.get("tool_calls"),
            "finish_reason": finish_reason,
        }

    # ======================
    # 流式
    # ======================

    async def chat_completion_stream(
        self,
        messages: list,
        model: str,
        temperature: float,
        max_tokens: int,
        tools: Optional[list] = None,
        tool_choice: Optional[str] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        OpenAI: 原生 SSE 流式
        Zhipu: 自动降级为非流式（工程稳定）
        """

        # ---- 🚫 智谱直接降级 ----
        if self._is_zhipu_api():
            logger.warning("⚠️ Zhipu 不支持 OpenAI 风格 stream，已自动降级为非流式")
            result = await self.chat_completion(
                messages, model, temperature, max_tokens, tools, tool_choice
            )
            yield {"content": result["content"], "done": True}
            return

        # ---- OpenAI 正常流式 ----
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
                response.raise_for_status()

                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue

                    data_str = line[6:]
                    if data_str.strip() == "[DONE]":
                        if tool_calls_buffer:
                            yield {
                                "tool_calls": list(tool_calls_buffer.values()),
                                "done": True,
                            }
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

                    # 文本
                    content = delta.get("content")
                    if content:
                        yield {"content": content}

                    # 工具调用
                    tc_list = delta.get("tool_calls")
                    if tc_list:
                        for tc in tc_list:
                            index = tc.get("index", 0)
                            if index not in tool_calls_buffer:
                                tool_calls_buffer[index] = tc
                            else:
                                existing = tool_calls_buffer[index]
                                if (
                                    "function" in tc
                                    and "function" in existing
                                    and tc["function"].get("arguments")
                                ):
                                    existing["function"]["arguments"] += tc["function"]["arguments"]

        except Exception as e:
            logger.error(f"流式请求出错: {str(e)}")
            raise