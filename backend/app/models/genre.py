"""小说类型模型"""
from sqlalchemy import Column, String, Text, Boolean, DateTime, JSON, Integer
from sqlalchemy.sql import func
import uuid

from app.database import Base


class Genre(Base):
    """小说类型表"""
    __tablename__ = "genres"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), nullable=False, unique=True, comment="类型名称")
    is_builtin = Column(Boolean, default=False, comment="是否内置类型")
    description = Column(Text, comment="类型描述")

    # AI生成指导配置
    world_building_guide = Column(Text, comment="世界观生成指导")
    character_guide = Column(Text, comment="角色生成指导")
    plot_guide = Column(Text, comment="情节/大纲生成指导")
    writing_style_guide = Column(Text, comment="写作风格指导")

    # 示例和参考
    example_works = Column(Text, comment="代表作品参考")
    keywords = Column(JSON, comment="关键词标签")

    # 排序权重（内置类型排在前面）
    sort_order = Column(Integer, default=100, comment="排序权重，数字越小越靠前")

    # 时间戳
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")

    def __repr__(self):
        return f"<Genre(id={self.id}, name={self.name}, is_builtin={self.is_builtin})>"
