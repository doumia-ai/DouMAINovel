"""
API Key 池管理器 - 支持多 Key 轮询

功能：
- 支持同一服务商/模型下多个 Key 轮询
- 线程安全的轮询索引
- 记录每个 Key 的使用统计
- 自动跳过出错的 Key
- 持久化存储（通过 Settings.preferences）
"""
import threading
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
import json

from app.logger import get_logger

logger = get_logger(__name__)


@dataclass
class KeyStats:
    """单个 Key 的统计信息"""
    key: str
    request_count: int = 0
    last_used: Optional[datetime] = None
    error_count: int = 0
    is_disabled: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "key": self.key,
            "request_count": self.request_count,
            "last_used": self.last_used.isoformat() if self.last_used else None,
            "error_count": self.error_count,
            "is_disabled": self.is_disabled
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "KeyStats":
        return cls(
            key=data["key"],
            request_count=data.get("request_count", 0),
            last_used=datetime.fromisoformat(data["last_used"]) if data.get("last_used") else None,
            error_count=data.get("error_count", 0),
            is_disabled=data.get("is_disabled", False)
        )


@dataclass
class KeyPoolConfig:
    """Key 池配置"""
    id: str                 # 池 ID
    name: str               # 池名称（用于显示）
    provider: str           # 服务商: openai, anthropic, gemini
    base_url: str           # API 地址
    model: str              # 模型名称
    keys: List[str] = field(default_factory=list)  # Key 列表
    enabled: bool = True    # 是否启用轮询
    created_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "provider": self.provider,
            "base_url": self.base_url,
            "model": self.model,
            "keys": self.keys,
            "enabled": self.enabled,
            "created_at": self.created_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "KeyPoolConfig":
        return cls(
            id=data["id"],
            name=data.get("name", ""),
            provider=data["provider"],
            base_url=data["base_url"],
            model=data["model"],
            keys=data.get("keys", []),
            enabled=data.get("enabled", True),
            created_at=data.get("created_at")
        )


class KeyPoolManager:
    """
    API Key 池管理器

    功能：
    - 支持同一服务商/模型下多个 Key 轮询
    - 线程安全的轮询索引
    - 记录每个 Key 的使用统计
    - 自动跳过出错的 Key
    """

    def __init__(self):
        # user_id -> pool_id -> KeyPoolConfig
        self._pools: Dict[str, Dict[str, KeyPoolConfig]] = {}
        # user_id -> pool_id -> current_index
        self._indexes: Dict[str, Dict[str, int]] = {}
        # user_id -> pool_id -> key -> KeyStats
        self._stats: Dict[str, Dict[str, Dict[str, KeyStats]]] = {}
        self._lock = threading.Lock()

    def _generate_pool_id(self, provider: str, base_url: str, model: str) -> str:
        """生成 Pool ID（同服务商+地址+模型共用一个池）"""
        import hashlib
        content = f"{provider}:{base_url}:{model}"
        return f"pool_{hashlib.md5(content.encode()).hexdigest()[:12]}"

    def load_from_preferences(self, user_id: str, preferences: Optional[str]) -> None:
        """从 preferences JSON 加载 Key 池配置"""
        if not preferences:
            return

        try:
            prefs = json.loads(preferences)
            key_pools_data = prefs.get("key_pools", {})
            pools = key_pools_data.get("pools", [])
            indexes = key_pools_data.get("indexes", {})
            stats = key_pools_data.get("stats", {})

            with self._lock:
                self._pools[user_id] = {}
                self._indexes[user_id] = {}
                self._stats[user_id] = {}

                for pool_data in pools:
                    pool = KeyPoolConfig.from_dict(pool_data)
                    self._pools[user_id][pool.id] = pool
                    self._indexes[user_id][pool.id] = indexes.get(pool.id, 0)

                    # 加载统计信息
                    pool_stats = stats.get(pool.id, {})
                    self._stats[user_id][pool.id] = {}
                    for key in pool.keys:
                        if key in pool_stats:
                            self._stats[user_id][pool.id][key] = KeyStats.from_dict(pool_stats[key])
                        else:
                            self._stats[user_id][pool.id][key] = KeyStats(key=key)

            logger.debug(f"用户 {user_id} 加载了 {len(pools)} 个 Key 池")
        except json.JSONDecodeError:
            logger.warning(f"用户 {user_id} 的 preferences JSON 格式错误")
        except Exception as e:
            logger.error(f"加载 Key 池配置失败: {e}")

    def save_to_preferences(self, user_id: str, current_preferences: Optional[str] = None) -> str:
        """将 Key 池配置保存到 preferences JSON"""
        try:
            prefs = json.loads(current_preferences or '{}')
        except json.JSONDecodeError:
            prefs = {}

        with self._lock:
            pools = []
            indexes = {}
            stats = {}

            if user_id in self._pools:
                for pool_id, pool in self._pools[user_id].items():
                    pools.append(pool.to_dict())
                    indexes[pool_id] = self._indexes.get(user_id, {}).get(pool_id, 0)

                    # 保存统计信息
                    if user_id in self._stats and pool_id in self._stats[user_id]:
                        stats[pool_id] = {
                            key: s.to_dict()
                            for key, s in self._stats[user_id][pool_id].items()
                        }

            prefs["key_pools"] = {
                "pools": pools,
                "indexes": indexes,
                "stats": stats,
                "version": "1.0"
            }

        return json.dumps(prefs, ensure_ascii=False)

    def create_pool(
        self,
        user_id: str,
        name: str,
        provider: str,
        base_url: str,
        model: str,
        keys: List[str],
        enabled: bool = True
    ) -> KeyPoolConfig:
        """创建新的 Key 池"""
        pool_id = self._generate_pool_id(provider, base_url, model)

        with self._lock:
            if user_id not in self._pools:
                self._pools[user_id] = {}
                self._indexes[user_id] = {}
                self._stats[user_id] = {}

            pool = KeyPoolConfig(
                id=pool_id,
                name=name,
                provider=provider,
                base_url=base_url,
                model=model,
                keys=keys,
                enabled=enabled,
                created_at=datetime.now().isoformat()
            )

            self._pools[user_id][pool_id] = pool
            self._indexes[user_id][pool_id] = 0

            # 初始化统计
            self._stats[user_id][pool_id] = {
                key: KeyStats(key=key) for key in keys
            }

        logger.info(f"用户 {user_id} 创建 Key 池: {name} ({pool_id}), 共 {len(keys)} 个 Key")
        return pool

    def update_pool(
        self,
        user_id: str,
        pool_id: str,
        name: Optional[str] = None,
        keys: Optional[List[str]] = None,
        enabled: Optional[bool] = None
    ) -> Optional[KeyPoolConfig]:
        """更新 Key 池"""
        with self._lock:
            if user_id not in self._pools or pool_id not in self._pools[user_id]:
                return None

            pool = self._pools[user_id][pool_id]

            if name is not None:
                pool.name = name

            if enabled is not None:
                pool.enabled = enabled

            if keys is not None:
                old_keys = set(pool.keys)
                new_keys = set(keys)
                pool.keys = keys

                # 为新增的 Key 初始化统计
                for key in new_keys - old_keys:
                    self._stats[user_id][pool_id][key] = KeyStats(key=key)

                # 移除已删除 Key 的统计
                for key in old_keys - new_keys:
                    if key in self._stats[user_id][pool_id]:
                        del self._stats[user_id][pool_id][key]

                # 重置索引
                self._indexes[user_id][pool_id] = 0

        logger.info(f"用户 {user_id} 更新 Key 池: {pool_id}")
        return pool

    def delete_pool(self, user_id: str, pool_id: str) -> bool:
        """删除 Key 池"""
        with self._lock:
            if user_id in self._pools and pool_id in self._pools[user_id]:
                del self._pools[user_id][pool_id]
                if pool_id in self._indexes.get(user_id, {}):
                    del self._indexes[user_id][pool_id]
                if pool_id in self._stats.get(user_id, {}):
                    del self._stats[user_id][pool_id]
                logger.info(f"用户 {user_id} 删除 Key 池: {pool_id}")
                return True
            return False

    def get_pool(self, user_id: str, pool_id: str) -> Optional[KeyPoolConfig]:
        """获取指定 Key 池"""
        with self._lock:
            if user_id in self._pools and pool_id in self._pools[user_id]:
                return self._pools[user_id][pool_id]
            return None

    def get_user_pools(self, user_id: str) -> List[Dict[str, Any]]:
        """获取用户所有 Key 池"""
        with self._lock:
            if user_id not in self._pools:
                return []

            result = []
            for pool_id, pool in self._pools[user_id].items():
                pool_info = pool.to_dict()
                # 添加统计摘要
                pool_info["key_count"] = len(pool.keys)
                pool_info["keys_preview"] = [k[:8] + "..." + k[-4:] if len(k) > 16 else k[:8] + "..." for k in pool.keys]

                # 添加使用统计
                if pool_id in self._stats.get(user_id, {}):
                    total_requests = sum(s.request_count for s in self._stats[user_id][pool_id].values())
                    pool_info["total_requests"] = total_requests

                result.append(pool_info)

            return result

    def find_pool_for_request(
        self,
        user_id: str,
        provider: str,
        base_url: str,
        model: str
    ) -> Optional[KeyPoolConfig]:
        """根据请求参数查找匹配的 Key 池"""
        pool_id = self._generate_pool_id(provider, base_url, model)

        with self._lock:
            if (user_id in self._pools and
                pool_id in self._pools[user_id] and
                self._pools[user_id][pool_id].enabled):
                return self._pools[user_id][pool_id]
            return None

    def get_next_key(
        self,
        user_id: str,
        provider: str,
        base_url: str,
        model: str,
        fallback_key: str
    ) -> str:
        """
        获取下一个可用的 Key（轮询）

        Args:
            user_id: 用户 ID
            provider: 服务商
            base_url: API 地址
            model: 模型名称
            fallback_key: 如果没有配置池，使用的默认 Key

        Returns:
            下一个可用的 API Key
        """
        pool_id = self._generate_pool_id(provider, base_url, model)

        with self._lock:
            # 检查是否有配置池
            if (user_id not in self._pools or
                pool_id not in self._pools[user_id] or
                not self._pools[user_id][pool_id].enabled):
                return fallback_key

            pool = self._pools[user_id][pool_id]
            if not pool.keys:
                return fallback_key

            # 轮询获取下一个 Key
            current_idx = self._indexes[user_id].get(pool_id, 0)
            keys = pool.keys

            # 尝试找到一个未禁用的 Key
            for _ in range(len(keys)):
                key = keys[current_idx % len(keys)]
                stats = self._stats[user_id][pool_id].get(key)

                if stats and not stats.is_disabled:
                    # 更新索引和统计
                    self._indexes[user_id][pool_id] = (current_idx + 1) % len(keys)
                    stats.request_count += 1
                    stats.last_used = datetime.now()

                    logger.debug(f"用户 {user_id} 使用 Key 池 {pool_id}, Key 索引 {current_idx}, Key: {key[:8]}...")
                    return key

                current_idx += 1

            # 所有 Key 都被禁用，返回第一个
            logger.warning(f"用户 {user_id} 的 Key 池 {pool_id} 所有 Key 都被禁用，使用第一个")
            return keys[0]

    def report_success(self, user_id: str, provider: str, base_url: str, model: str, key: str):
        """报告 Key 请求成功（重置错误计数）"""
        pool_id = self._generate_pool_id(provider, base_url, model)

        with self._lock:
            if (user_id in self._stats and
                pool_id in self._stats[user_id] and
                key in self._stats[user_id][pool_id]):
                stats = self._stats[user_id][pool_id][key]
                stats.error_count = 0  # 成功后重置错误计数

    def report_error(self, user_id: str, provider: str, base_url: str, model: str, key: str):
        """报告 Key 错误（可用于自动禁用频繁出错的 Key）"""
        pool_id = self._generate_pool_id(provider, base_url, model)

        with self._lock:
            if (user_id in self._stats and
                pool_id in self._stats[user_id] and
                key in self._stats[user_id][pool_id]):
                stats = self._stats[user_id][pool_id][key]
                stats.error_count += 1

                # 连续错误超过 5 次自动禁用
                if stats.error_count >= 5:
                    stats.is_disabled = True
                    logger.warning(f"Key {key[:8]}... 因连续 {stats.error_count} 次错误被自动禁用")

    def reset_key_status(self, user_id: str, pool_id: str, key: str) -> bool:
        """重置 Key 状态（取消禁用，清零错误计数）"""
        with self._lock:
            if (user_id in self._stats and
                pool_id in self._stats[user_id] and
                key in self._stats[user_id][pool_id]):
                stats = self._stats[user_id][pool_id][key]
                stats.error_count = 0
                stats.is_disabled = False
                logger.info(f"Key {key[:8]}... 状态已重置")
                return True
            return False

    def get_pool_stats(self, user_id: str, pool_id: str) -> Dict[str, Any]:
        """获取 Key 池详细统计信息"""
        with self._lock:
            if user_id not in self._stats or pool_id not in self._stats[user_id]:
                return {}

            stats_list = []
            for key, s in self._stats[user_id][pool_id].items():
                stats_list.append({
                    "key_preview": key[:8] + "..." + key[-4:] if len(key) > 16 else key[:8] + "...",
                    "key_full": key,  # 完整 key，前端可选择是否显示
                    "request_count": s.request_count,
                    "last_used": s.last_used.isoformat() if s.last_used else None,
                    "error_count": s.error_count,
                    "is_disabled": s.is_disabled
                })

            return {
                "pool_id": pool_id,
                "keys": stats_list,
                "total_requests": sum(s["request_count"] for s in stats_list),
                "active_keys": sum(1 for s in stats_list if not s["is_disabled"]),
                "disabled_keys": sum(1 for s in stats_list if s["is_disabled"])
            }


# 全局单例
key_pool_manager = KeyPoolManager()
