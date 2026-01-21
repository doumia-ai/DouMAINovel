"""
认证中间件 - 从 Cookie 中提取用户信息并注入到 request.state
"""
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from app.user_manager import user_manager
from app.logger import get_logger

logger = get_logger(__name__)


class AuthMiddleware(BaseHTTPMiddleware):
    """认证中间件"""
    
    async def dispatch(self, request: Request, call_next):
        """
        处理请求，从 Cookie 中提取用户 ID 并注入到 request.state
        """
        # 从 Cookie 中获取用户 ID
        user_id = request.cookies.get("user_id")
        
        # 记录请求信息（仅对API请求）
        if request.url.path.startswith("/api/"):
            logger.debug(f"🔐 Auth check: {request.method} {request.url.path} | Cookie user_id: {user_id}")
        
        # 注入到 request.state
        if user_id:
            user = await user_manager.get_user(user_id)
            if user:
                # 检查用户是否被禁用 (trust_level = -1)
                if user.trust_level == -1:
                    logger.warning(f"❌ 禁用用户尝试访问: {user_id} ({user.username})")
                    # 清除用户状态，视为未登录
                    request.state.user_id = None
                    request.state.user = None
                    request.state.is_admin = False
                else:
                    # 用户正常，注入状态
                    request.state.user_id = user_id
                    request.state.user = user
                    request.state.is_admin = user.is_admin
                    if request.url.path.startswith("/api/"):
                        logger.debug(f"✅ Authenticated: {user_id} ({user.username})")
            else:
                # 用户不存在，清除状态
                logger.warning(f"⚠️ Invalid user_id in cookie: {user_id}")
                request.state.user_id = None
                request.state.user = None
                request.state.is_admin = False
        else:
            # 未登录
            if request.url.path.startswith("/api/") and not request.url.path.startswith("/api/auth"):
                logger.debug(f"⚠️ No user_id cookie found for: {request.method} {request.url.path}")
            request.state.user_id = None
            request.state.user = None
            request.state.is_admin = False
        
        # 继续处理请求
        response = await call_next(request)
        return response