"""AIGC 文本检测代理 API

解决前端直接访问 localhost 导致的跨域和网络问题。
通过后端代理转发请求到 aigc-text-detector 服务。
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from typing import List
from app.config import settings
from app.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/aigc-detect", tags=["AIGC检测"])

# 从环境变量获取检测服务地址，默认使用 Docker 网络内部地址
AIGC_DETECT_URL = getattr(settings, 'aigc_detect_url', 'http://aigc-text-detector:8080')


class DetectRequest(BaseModel):
    """检测请求"""
    texts: List[str]


class DetectItemResult(BaseModel):
    """单个文本检测结果"""
    ai_probability: float
    human_probability: float
    label: str  # 'human', 'suspected_ai', 'ai'


class DetectSummary(BaseModel):
    """检测结果汇总"""
    human_ratio: float
    suspected_ai_ratio: float
    ai_ratio: float


class DetectResponse(BaseModel):
    """检测响应"""
    summary: DetectSummary
    items: List[DetectItemResult]


@router.post("/batch", response_model=DetectResponse)
async def detect_batch(request: DetectRequest):
    """
    批量检测文本是否为 AI 生成
    
    通过后端代理转发请求到 aigc-text-detector 服务，
    解决前端直接访问 localhost 导致的跨域和网络问题。
    
    Args:
        request: 包含待检测文本列表的请求
        
    Returns:
        检测结果，包含汇总统计和每个文本的检测结果
    """
    if not request.texts:
        raise HTTPException(status_code=400, detail="texts 不能为空")
    
    logger.info(f"AIGC 检测请求: {len(request.texts)} 个文本段落")
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{AIGC_DETECT_URL}/detect/batch",
                json={"texts": request.texts}
            )
            response.raise_for_status()
            result = response.json()
            logger.info(f"AIGC 检测完成: {len(result.get('items', []))} 个结果")
            return result
    except httpx.TimeoutException:
        logger.error("AIGC 检测服务超时")
        raise HTTPException(status_code=504, detail="检测服务响应超时，请稍后重试")
    except httpx.ConnectError as e:
        logger.error(f"无法连接 AIGC 检测服务: {e}")
        raise HTTPException(
            status_code=503, 
            detail="无法连接检测服务，请检查 aigc-text-detector 服务是否运行"
        )
    except httpx.HTTPStatusError as e:
        logger.error(f"AIGC 检测服务返回错误: {e.response.status_code}")
        raise HTTPException(
            status_code=e.response.status_code, 
            detail=f"检测服务返回错误: {e.response.status_code}"
        )
    except Exception as e:
        logger.error(f"AIGC 检测失败: {e}")
        raise HTTPException(status_code=500, detail=f"检测失败: {str(e)}")


@router.get("/health")
async def health_check():
    """
    检查 AIGC 检测服务是否可用
    
    Returns:
        服务状态信息
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # 尝试调用检测服务的健康检查接口
            response = await client.get(f"{AIGC_DETECT_URL}/health")
            response.raise_for_status()
            return {
                "status": "ok", 
                "service_url": AIGC_DETECT_URL,
                "service_status": response.json()
            }
    except httpx.ConnectError:
        return {
            "status": "error", 
            "message": "无法连接检测服务",
            "service_url": AIGC_DETECT_URL
        }
    except Exception as e:
        return {
            "status": "error", 
            "message": str(e), 
            "service_url": AIGC_DETECT_URL
        }
