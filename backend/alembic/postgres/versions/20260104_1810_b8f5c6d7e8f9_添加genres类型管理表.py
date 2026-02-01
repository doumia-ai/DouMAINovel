"""添加genres类型管理表

Revision ID: b8f5c6d7e8f9
Revises: a7e4408e1d5b
Create Date: 2026-01-04 18:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8f5c6d7e8f9'
down_revision: Union[str, None] = 'a7e4408e1d5b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 创建genres表
    op.create_table(
        'genres',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(50), nullable=False, unique=True, comment='类型名称'),
        sa.Column('is_builtin', sa.Boolean(), default=False, comment='是否内置类型'),
        sa.Column('description', sa.Text(), nullable=True, comment='类型描述'),
        sa.Column('world_building_guide', sa.Text(), nullable=True, comment='世界观生成指导'),
        sa.Column('character_guide', sa.Text(), nullable=True, comment='角色生成指导'),
        sa.Column('plot_guide', sa.Text(), nullable=True, comment='情节/大纲生成指导'),
        sa.Column('writing_style_guide', sa.Text(), nullable=True, comment='写作风格指导'),
        sa.Column('example_works', sa.Text(), nullable=True, comment='代表作品参考'),
        sa.Column('keywords', sa.JSON(), nullable=True, comment='关键词标签'),
        sa.Column('sort_order', sa.Integer(), default=100, comment='排序权重'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), comment='更新时间'),
    )
    
    # 创建索引
    op.create_index('ix_genres_name', 'genres', ['name'])
    op.create_index('ix_genres_is_builtin', 'genres', ['is_builtin'])
    op.create_index('ix_genres_sort_order', 'genres', ['sort_order'])


def downgrade() -> None:
    # 删除索引
    op.drop_index('ix_genres_sort_order', table_name='genres')
    op.drop_index('ix_genres_is_builtin', table_name='genres')
    op.drop_index('ix_genres_name', table_name='genres')
    
    # 删除表
    op.drop_table('genres')
