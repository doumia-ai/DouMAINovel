"""
更新日志API
提供GitHub提交历史的缓存和代理服务
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import httpx
from datetime import datetime, timedelta
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# GitHub API配置
GITHUB_API_BASE = "https://api.github.com"
REPO_OWNER = "doumia-ai"
REPO_NAME = "DouMAINovel"

# 从配置获取 GitHub Token
def get_github_token() -> str | None:
    """获取 GitHub Token"""
    from app.config import settings
    return settings.GITHUB_TOKEN

# 缓存配置
_cache = {
    "data": None,
    "timestamp": None,
    "ttl": timedelta(hours=24)  # 缓存24小时（提升缓存时间以减少 API 调用）
}


class GitHubAuthor(BaseModel):
    """GitHub作者信息"""
    name: str
    email: str
    date: str


class GitHubCommitInfo(BaseModel):
    """GitHub提交信息"""
    author: GitHubAuthor
    message: str


class GitHubUser(BaseModel):
    """GitHub用户信息"""
    login: str
    avatar_url: str


class GitHubCommit(BaseModel):
    """GitHub提交数据"""
    sha: str
    commit: GitHubCommitInfo
    html_url: str
    author: Optional[GitHubUser] = None


class ChangelogResponse(BaseModel):
    """更新日志响应"""
    commits: List[GitHubCommit]
    cached: bool
    cache_time: Optional[str] = None


def is_cache_valid() -> bool:
    """检查缓存是否有效"""
    if _cache["data"] is None or _cache["timestamp"] is None:
        return False
    
    now = datetime.now()
    cache_age = now - _cache["timestamp"]
    
    return cache_age < _cache["ttl"]


async def fetch_github_commits(page: int = 1, per_page: int = 30) -> List[dict]:
    """从GitHub API获取提交历史"""
    url = f"{GITHUB_API_BASE}/repos/{REPO_OWNER}/{REPO_NAME}/commits"
    params = {
        "author": REPO_OWNER,
        "page": page,
        "per_page": per_page
    }
    
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "DouMAINovel-App"
    }
    
    # 如果配置了 GitHub Token，添加认证头
    # 认证后 API 限制从 60 次/小时提升到 5000 次/小时
    github_token = get_github_token()
    if github_token:
        headers["Authorization"] = f"Bearer {github_token}"
        logger.debug("使用 GitHub Token 进行认证")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params, headers=headers)
            
            # 记录 API 限制信息
            rate_limit = response.headers.get("X-RateLimit-Limit", "unknown")
            rate_remaining = response.headers.get("X-RateLimit-Remaining", "unknown")
            logger.debug(f"GitHub API 限制: {rate_remaining}/{rate_limit}")
            
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 403:
            rate_remaining = e.response.headers.get("X-RateLimit-Remaining", "0")
            if rate_remaining == "0":
                logger.error("GitHub API 速率限制已达上限，请配置 GITHUB_TOKEN 或稍后重试")
                raise HTTPException(
                    status_code=429,
                    detail="GitHub API 请求次数已达上限（每小时60次）。请在 .env 文件中配置 GITHUB_TOKEN 以提升限制到 5000 次/小时。"
                )
        logger.error(f"GitHub API请求失败: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail=f"获取GitHub提交历史失败: {str(e)}"
        )


@router.get("/changelog", response_model=ChangelogResponse)
async def get_changelog(
    page: int = Query(1, ge=1, description="页码"),
    per_page: int = Query(30, ge=1, le=100, description="每页数量")
):
    """
    获取更新日志
    
    从GitHub获取项目的提交历史，支持缓存以减少API调用
    
    - **page**: 页码，从1开始
    - **per_page**: 每页返回的提交数量，最大100
    """
    try:
        # 只缓存第一页
        if page == 1 and is_cache_valid():
            logger.info("使用缓存的更新日志")
            return ChangelogResponse(
                commits=_cache["data"],
                cached=True,
                cache_time=_cache["timestamp"].isoformat()
            )
        
        # 从GitHub获取数据
        logger.info(f"从GitHub获取更新日志 (page={page}, per_page={per_page})")
        commits_data = await fetch_github_commits(page, per_page)
        
        # 解析数据
        commits = []
        for commit_data in commits_data:
            try:
                commit = GitHubCommit(
                    sha=commit_data["sha"],
                    commit=GitHubCommitInfo(
                        author=GitHubAuthor(
                            name=commit_data["commit"]["author"]["name"],
                            email=commit_data["commit"]["author"]["email"],
                            date=commit_data["commit"]["author"]["date"]
                        ),
                        message=commit_data["commit"]["message"]
                    ),
                    html_url=commit_data["html_url"],
                    author=GitHubUser(
                        login=commit_data["author"]["login"],
                        avatar_url=commit_data["author"]["avatar_url"]
                    ) if commit_data.get("author") else None
                )
                commits.append(commit)
            except (KeyError, TypeError) as e:
                logger.warning(f"解析提交数据失败: {str(e)}")
                continue
        
        # 缓存第一页数据
        if page == 1:
            _cache["data"] = commits
            _cache["timestamp"] = datetime.now()
            logger.info("已缓存更新日志")
        
        return ChangelogResponse(
            commits=commits,
            cached=False,
            cache_time=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取更新日志时发生错误: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"获取更新日志失败: {str(e)}"
        )


@router.post("/changelog/refresh")
async def refresh_changelog():
    """
    刷新更新日志缓存
    
    强制从GitHub重新获取最新的提交历史
    """
    try:
        logger.info("刷新更新日志缓存")
        
        # 清除缓存
        _cache["data"] = None
        _cache["timestamp"] = None
        
        # 重新获取
        commits_data = await fetch_github_commits(1, 30)
        
        # 解析数据
        commits = []
        for commit_data in commits_data:
            try:
                commit = GitHubCommit(
                    sha=commit_data["sha"],
                    commit=GitHubCommitInfo(
                        author=GitHubAuthor(
                            name=commit_data["commit"]["author"]["name"],
                            email=commit_data["commit"]["author"]["email"],
                            date=commit_data["commit"]["author"]["date"]
                        ),
                        message=commit_data["commit"]["message"]
                    ),
                    html_url=commit_data["html_url"],
                    author=GitHubUser(
                        login=commit_data["author"]["login"],
                        avatar_url=commit_data["author"]["avatar_url"]
                    ) if commit_data.get("author") else None
                )
                commits.append(commit)
            except (KeyError, TypeError) as e:
                logger.warning(f"解析提交数据失败: {str(e)}")
                continue
        
        # 更新缓存
        _cache["data"] = commits
        _cache["timestamp"] = datetime.now()
        
        return {
            "success": True,
            "message": "缓存已刷新",
            "commit_count": len(commits),
            "cache_time": _cache["timestamp"].isoformat()
        }
        
    except Exception as e:
        logger.error(f"刷新缓存时发生错误: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"刷新缓存失败: {str(e)}"
        )