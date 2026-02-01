"""
认证 API - LinuxDO OAuth2 登录 + 本地账户登录
（最终推荐稳定版，Edge / Chrome / Firefox 全兼容）
"""
from fastapi import APIRouter, HTTPException, Response, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional
import hashlib
from datetime import datetime, timedelta, timezone

from app.services.oauth_service import LinuxDOOAuthService
from app.user_manager import user_manager
from app.user_password import password_manager
from app.logger import get_logger
from app.config import settings

# 中国时区 UTC+8
CHINA_TZ = timezone(timedelta(hours=8))

def get_china_now():
    return datetime.now(CHINA_TZ)

logger = get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["认证"])

oauth_service = LinuxDOOAuthService()

# OAuth state 临时存储（生产建议用 Redis）
_state_storage = {}


# =========================
# Cookie 工具（核心修复点）
# =========================
def set_auth_cookie(
    response: Response,
    key: str,
    value: str,
    max_age: int,
    httponly: bool = True
):
    """
    统一的认证 Cookie 设置函数
    适配 HTTPS + Cloudflare + NPM + Edge
    
    注意：COOKIE_DOMAIN 配置说明
    - 如果为 None：不设置 domain，Cookie 仅对当前域名有效
    - 如果设置为主域名（如 ".example.com"）：Cookie 对所有子域名有效
    - Edge 浏览器对 Cookie 域名验证较严格，域名不匹配会导致 Cookie 被拒绝
    """
    # 构建 Cookie 参数
    cookie_kwargs = {
        "key": key,
        "value": value,
        "max_age": max_age,
        "httponly": httponly,
        "secure": True,          # ★ Edge / HTTPS 必须
        "samesite": "none",      # ★ OAuth / 子域 / Edge 必须
        "path": "/"
    }
    
    # 只有在配置了 COOKIE_DOMAIN 时才设置 domain 参数
    # 这样可以避免 Edge 浏览器因域名不匹配而拒绝 Cookie
    if settings.COOKIE_DOMAIN:
        cookie_kwargs["domain"] = settings.COOKIE_DOMAIN
    
    response.set_cookie(**cookie_kwargs)


# =========================
# Models
# =========================
class AuthUrlResponse(BaseModel):
    auth_url: str
    state: str


class LocalLoginRequest(BaseModel):
    username: str
    password: str


class LocalLoginResponse(BaseModel):
    success: bool
    message: str
    user: Optional[dict] = None


class SetPasswordRequest(BaseModel):
    password: str


class SetPasswordResponse(BaseModel):
    success: bool
    message: str


class PasswordStatusResponse(BaseModel):
    has_password: bool
    has_custom_password: bool
    username: Optional[str] = None
    default_password: Optional[str] = None


# =========================
# Routes
# =========================
@router.get("/config")
async def get_auth_config():
    return {
        "local_auth_enabled": settings.LOCAL_AUTH_ENABLED,
        "linuxdo_enabled": bool(settings.LINUXDO_CLIENT_ID and settings.LINUXDO_CLIENT_SECRET)
    }


@router.post("/local/login", response_model=LocalLoginResponse)
async def local_login(request: LocalLoginRequest, response: Response):
    if not settings.LOCAL_AUTH_ENABLED:
        raise HTTPException(status_code=403, detail="本地账户登录未启用")

    logger.info(f"[本地登录] 尝试登录用户名: {request.username}")

    all_users = await user_manager.get_all_users()
    target_user = None

    for user in all_users:
        password_username = await password_manager.get_username(user.user_id)
        if user.username == request.username or password_username == request.username:
            target_user = user
            break

    if target_user:
        if not await password_manager.has_password(target_user.user_id):
            raise HTTPException(status_code=401, detail="用户名或密码错误")
        if not await password_manager.verify_password(target_user.user_id, request.password):
            raise HTTPException(status_code=401, detail="用户名或密码错误")
        user = target_user
    else:
        if not settings.LOCAL_AUTH_USERNAME or not settings.LOCAL_AUTH_PASSWORD:
            raise HTTPException(status_code=401, detail="用户名或密码错误")

        user_id = f"local_{hashlib.md5(request.username.encode()).hexdigest()[:16]}"
        user = await user_manager.get_user(user_id)

        if not user:
            if request.username != settings.LOCAL_AUTH_USERNAME or request.password != settings.LOCAL_AUTH_PASSWORD:
                raise HTTPException(status_code=401, detail="用户名或密码错误")

            user = await user_manager.create_or_update_from_linuxdo(
                linuxdo_id=user_id,
                username=request.username,
                display_name=settings.LOCAL_AUTH_DISPLAY_NAME,
                avatar_url=None,
                trust_level=9
            )
            await password_manager.set_password(user.user_id, request.username, request.password)
        else:
            if not await password_manager.verify_password(user.user_id, request.password):
                raise HTTPException(status_code=401, detail="用户名或密码错误")

    max_age = settings.SESSION_EXPIRE_MINUTES * 60
    expire_time = get_china_now() + timedelta(minutes=settings.SESSION_EXPIRE_MINUTES)
    expire_at = int(expire_time.timestamp())

    set_auth_cookie(response, "user_id", user.user_id, max_age, httponly=True)
    set_auth_cookie(response, "session_expire_at", str(expire_at), max_age, httponly=False)

    return LocalLoginResponse(success=True, message="登录成功", user=user.dict())


@router.get("/linuxdo/url", response_model=AuthUrlResponse)
async def get_linuxdo_auth_url():
    state = oauth_service.generate_state()
    auth_url = oauth_service.get_authorization_url(state)
    _state_storage[state] = True
    return AuthUrlResponse(auth_url=auth_url, state=state)


async def _handle_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None
):
    if error:
        raise HTTPException(status_code=400, detail=f"授权失败: {error}")
    if not code or not state or state not in _state_storage:
        raise HTTPException(status_code=400, detail="无效的授权参数")

    del _state_storage[state]

    token_data = await oauth_service.get_access_token(code)
    access_token = token_data.get("access_token")
    user_info = await oauth_service.get_user_info(access_token)

    linuxdo_id = str(user_info.get("id"))
    username = user_info.get("username", "")
    display_name = user_info.get("name", username)

    user = await user_manager.create_or_update_from_linuxdo(
        linuxdo_id=linuxdo_id,
        username=username,
        display_name=display_name,
        avatar_url=user_info.get("avatar_url"),
        trust_level=user_info.get("trust_level", 0)
    )

    is_first_login = not await password_manager.has_password(user.user_id)

    redirect_url = f"{settings.FRONTEND_URL.rstrip('/')}/auth/callback"
    response = RedirectResponse(url=redirect_url)

    max_age = settings.SESSION_EXPIRE_MINUTES * 60
    expire_time = get_china_now() + timedelta(minutes=settings.SESSION_EXPIRE_MINUTES)
    expire_at = int(expire_time.timestamp())

    set_auth_cookie(response, "user_id", user.user_id, max_age, httponly=True)
    set_auth_cookie(response, "session_expire_at", str(expire_at), max_age, httponly=False)

    if is_first_login:
        set_auth_cookie(response, "first_login", "true", 300, httponly=False)

    return response


@router.get("/linuxdo/callback")
async def linuxdo_callback(code: Optional[str] = None, state: Optional[str] = None, error: Optional[str] = None):
    return await _handle_callback(code, state, error)


@router.get("/callback")
async def callback_alias(code: Optional[str] = None, state: Optional[str] = None, error: Optional[str] = None):
    return await _handle_callback(code, state, error)


@router.post("/refresh")
async def refresh_session(request: Request, response: Response):
    if not hasattr(request.state, "user") or not request.state.user:
        raise HTTPException(status_code=401, detail="未登录")

    user = request.state.user
    max_age = settings.SESSION_EXPIRE_MINUTES * 60
    expire_time = get_china_now() + timedelta(minutes=settings.SESSION_EXPIRE_MINUTES)
    expire_at = int(expire_time.timestamp())

    set_auth_cookie(response, "user_id", user.user_id, max_age, httponly=True)
    set_auth_cookie(response, "session_expire_at", str(expire_at), max_age, httponly=False)

    return {"message": "会话刷新成功", "expire_at": expire_at}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("user_id", path="/")
    response.delete_cookie("session_expire_at", path="/")
    response.delete_cookie("first_login", path="/")
    return {"message": "退出登录成功"}


@router.get("/user")
async def get_current_user(request: Request):
    if not hasattr(request.state, "user") or not request.state.user:
        raise HTTPException(status_code=401, detail="未登录")
    return request.state.user.dict()


@router.get("/password/status", response_model=PasswordStatusResponse)
async def get_password_status(request: Request):
    if not hasattr(request.state, "user") or not request.state.user:
        raise HTTPException(status_code=401, detail="未登录")

    user = request.state.user
    has_password = await password_manager.has_password(user.user_id)
    has_custom = await password_manager.has_custom_password(user.user_id)
    username = await password_manager.get_username(user.user_id)

    default_password = None
    if has_password and not has_custom:
        default_password = f"{user.username}@666"

    return PasswordStatusResponse(
        has_password=has_password,
        has_custom_password=has_custom,
        username=username or user.username,
        default_password=default_password
    )


@router.post("/password/set", response_model=SetPasswordResponse)
async def set_user_password(request: Request, password_req: SetPasswordRequest):
    if not hasattr(request.state, "user") or not request.state.user:
        raise HTTPException(status_code=401, detail="未登录")

    if len(password_req.password) < 6:
        raise HTTPException(status_code=400, detail="密码长度至少为6个字符")

    user = request.state.user
    await password_manager.set_password(user.user_id, user.username, password_req.password)
    return SetPasswordResponse(success=True, message="密码设置成功")