"""小说类型管理API"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
import logging

from app.database import get_db
from app.models.genre import Genre
from app.schemas.genre import GenreCreate, GenreUpdate, GenreResponse, GenreListResponse, GenreDeleteResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=GenreListResponse, summary="获取类型列表")
async def get_genres(
    include_builtin: bool = Query(True, description="是否包含内置类型"),
    db: AsyncSession = Depends(get_db)
):
    """
    获取所有小说类型列表

    - **include_builtin**: 是否包含内置类型，默认为True
    """
    try:
        query = select(Genre).order_by(Genre.sort_order, Genre.created_at)

        if not include_builtin:
            query = query.where(Genre.is_builtin == False)

        result = await db.execute(query)
        genres = result.scalars().all()

        return GenreListResponse(
            genres=[GenreResponse.model_validate(g) for g in genres],
            total=len(genres)
        )
    except Exception as e:
        logger.error(f"获取类型列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取类型列表失败: {str(e)}")


# 注意：/by-name/{name} 必须在 /{genre_id} 之前定义，否则 "by-name" 会被当作 genre_id 匹配
@router.get("/by-name/{name}", response_model=GenreResponse, summary="根据名称获取类型")
async def get_genre_by_name(
    name: str,
    db: AsyncSession = Depends(get_db)
):
    """根据类型名称获取详细信息（用于AI生成时获取指导配置）"""
    result = await db.execute(select(Genre).where(Genre.name == name))
    genre = result.scalar_one_or_none()

    if not genre:
        raise HTTPException(status_code=404, detail=f"类型 '{name}' 不存在")

    return GenreResponse.model_validate(genre)


@router.get("/{genre_id}", response_model=GenreResponse, summary="获取类型详情")
async def get_genre(
    genre_id: str,
    db: AsyncSession = Depends(get_db)
):
    """获取指定类型的详细信息"""
    result = await db.execute(select(Genre).where(Genre.id == genre_id))
    genre = result.scalar_one_or_none()
    
    if not genre:
        raise HTTPException(status_code=404, detail="类型不存在")
    
    return GenreResponse.model_validate(genre)


@router.post("", response_model=GenreResponse, summary="创建类型")
async def create_genre(
    genre_data: GenreCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    创建新的小说类型
    
    - 类型名称必须唯一
    - 新创建的类型默认为非内置类型
    """
    # 检查名称是否已存在
    existing = await db.execute(
        select(Genre).where(Genre.name == genre_data.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"类型名称 '{genre_data.name}' 已存在")
    
    try:
        genre = Genre(
            name=genre_data.name,
            description=genre_data.description,
            is_builtin=False,
            world_building_guide=genre_data.world_building_guide,
            character_guide=genre_data.character_guide,
            plot_guide=genre_data.plot_guide,
            writing_style_guide=genre_data.writing_style_guide,
            example_works=genre_data.example_works,
            keywords=genre_data.keywords,
            sort_order=100  # 自定义类型排在内置类型后面
        )
        
        db.add(genre)
        await db.commit()
        await db.refresh(genre)
        
        logger.info(f"✅ 创建类型成功: {genre.name} (ID: {genre.id})")
        return GenreResponse.model_validate(genre)
        
    except Exception as e:
        await db.rollback()
        logger.error(f"创建类型失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"创建类型失败: {str(e)}")


@router.put("/{genre_id}", response_model=GenreResponse, summary="更新类型")
async def update_genre(
    genre_id: str,
    genre_data: GenreUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    更新类型信息
    
    - 内置类型只能修改描述和AI指导配置，不能修改名称
    - 自定义类型可以修改所有字段
    """
    result = await db.execute(select(Genre).where(Genre.id == genre_id))
    genre = result.scalar_one_or_none()
    
    if not genre:
        raise HTTPException(status_code=404, detail="类型不存在")
    
    # 内置类型不能修改名称
    if genre.is_builtin and genre_data.name and genre_data.name != genre.name:
        raise HTTPException(status_code=400, detail="内置类型不能修改名称")
    
    # 检查新名称是否与其他类型冲突
    if genre_data.name and genre_data.name != genre.name:
        existing = await db.execute(
            select(Genre).where(Genre.name == genre_data.name, Genre.id != genre_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"类型名称 '{genre_data.name}' 已存在")
    
    try:
        # 更新字段
        update_data = genre_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(genre, key, value)
        
        await db.commit()
        await db.refresh(genre)
        
        logger.info(f"✅ 更新类型成功: {genre.name} (ID: {genre.id})")
        return GenreResponse.model_validate(genre)
        
    except Exception as e:
        await db.rollback()
        logger.error(f"更新类型失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"更新类型失败: {str(e)}")


@router.delete("/{genre_id}", response_model=GenreDeleteResponse, summary="删除类型")
async def delete_genre(
    genre_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    删除类型

    - 内置类型不能删除
    - 删除前会检查是否有项目正在使用该类型
    """
    result = await db.execute(select(Genre).where(Genre.id == genre_id))
    genre = result.scalar_one_or_none()

    if not genre:
        raise HTTPException(status_code=404, detail="类型不存在")

    if genre.is_builtin:
        raise HTTPException(status_code=400, detail="内置类型不能删除")

    # 检查是否有项目正在使用该类型
    from app.models.project import Project
    projects_result = await db.execute(
        select(func.count(Project.id)).where(Project.genre.contains(genre.name))
    )
    project_count = projects_result.scalar_one()
    if project_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"有 {project_count} 个项目正在使用该类型，无法删除"
        )

    try:
        genre_name = genre.name
        await db.delete(genre)
        await db.commit()

        logger.info(f"✅ 删除类型成功: {genre_name} (ID: {genre_id})")
        return GenreDeleteResponse(success=True, message=f"类型 '{genre_name}' 已删除")

    except Exception as e:
        await db.rollback()
        logger.error(f"删除类型失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"删除类型失败: {str(e)}")
