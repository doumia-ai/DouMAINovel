"""小说类型相关的Schema"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class GenreBase(BaseModel):
    """类型基础模型"""
    name: str = Field(..., min_length=1, max_length=50, description="类型名称")
    description: Optional[str] = Field(None, description="类型描述")
    world_building_guide: Optional[str] = Field(None, description="世界观生成指导")
    character_guide: Optional[str] = Field(None, description="角色生成指导")
    plot_guide: Optional[str] = Field(None, description="情节/大纲生成指导")
    writing_style_guide: Optional[str] = Field(None, description="写作风格指导")
    example_works: Optional[str] = Field(None, description="代表作品参考")
    keywords: Optional[List[str]] = Field(None, description="关键词标签")


class GenreCreate(GenreBase):
    """创建类型请求"""
    pass


class GenreUpdate(BaseModel):
    """更新类型请求"""
    name: Optional[str] = Field(None, min_length=1, max_length=50, description="类型名称")
    description: Optional[str] = Field(None, description="类型描述")
    world_building_guide: Optional[str] = Field(None, description="世界观生成指导")
    character_guide: Optional[str] = Field(None, description="角色生成指导")
    plot_guide: Optional[str] = Field(None, description="情节/大纲生成指导")
    writing_style_guide: Optional[str] = Field(None, description="写作风格指导")
    example_works: Optional[str] = Field(None, description="代表作品参考")
    keywords: Optional[List[str]] = Field(None, description="关键词标签")


class GenreResponse(GenreBase):
    """类型响应模型"""
    id: str
    is_builtin: bool = Field(False, description="是否内置类型")
    sort_order: int = Field(100, description="排序权重")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GenreListResponse(BaseModel):
    """类型列表响应"""
    genres: List[GenreResponse]
    total: int


class GenreDeleteResponse(BaseModel):
    """删除类型响应"""
    success: bool = Field(..., description="是否成功")
    message: str = Field(..., description="响应消息")
