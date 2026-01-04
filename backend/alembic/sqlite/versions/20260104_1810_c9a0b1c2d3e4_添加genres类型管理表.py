"""添加genres类型管理表

Revision ID: c9a0b1c2d3e4
Revises: 7899f8d4d839
Create Date: 2026-01-04 18:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9a0b1c2d3e4'
down_revision: Union[str, None] = '7899f8d4d839'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 创建genres表
    op.create_table(
        'genres',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(50), nullable=False, unique=True),
        sa.Column('is_builtin', sa.Boolean(), default=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('world_building_guide', sa.Text(), nullable=True),
        sa.Column('character_guide', sa.Text(), nullable=True),
        sa.Column('plot_guide', sa.Text(), nullable=True),
        sa.Column('writing_style_guide', sa.Text(), nullable=True),
        sa.Column('example_works', sa.Text(), nullable=True),
        sa.Column('keywords', sa.JSON(), nullable=True),
        sa.Column('sort_order', sa.Integer(), default=100),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
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
