"""添加 provider_type 等 HTTP Tool Provider 字段

Revision ID: d1e2f3a4b5c6
Revises: c9a0b1c2d3e4
Create Date: 2026-01-06 09:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, None] = 'c9a0b1c2d3e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """添加 HTTP Tool Provider 支持字段"""
    # 添加 provider_type 字段，默认值为 'mcp' 保持向后兼容
    op.add_column('mcp_plugins', sa.Column(
        'provider_type', 
        sa.String(20), 
        nullable=True,
        server_default='mcp',
        comment='Provider类型：mcp/http（mcp=MCP协议，http=普通HTTP API）'
    ))
    
    # 添加 openapi_schema 字段（缓存 OpenAPI schema）
    op.add_column('mcp_plugins', sa.Column(
        'openapi_schema', 
        sa.JSON(), 
        nullable=True,
        comment='HTTP Provider的OpenAPI schema缓存'
    ))
    
    # 添加 openapi_path 字段
    op.add_column('mcp_plugins', sa.Column(
        'openapi_path', 
        sa.String(200), 
        nullable=True,
        server_default='/openapi.json',
        comment='OpenAPI schema路径'
    ))
    
    # 添加 tool_endpoint_template 字段
    op.add_column('mcp_plugins', sa.Column(
        'tool_endpoint_template', 
        sa.String(500), 
        nullable=True,
        comment='工具调用URL模板，如 /tools/{tool_name}/invoke'
    ))


def downgrade() -> None:
    """移除 HTTP Tool Provider 支持字段"""
    op.drop_column('mcp_plugins', 'tool_endpoint_template')
    op.drop_column('mcp_plugins', 'openapi_path')
    op.drop_column('mcp_plugins', 'openapi_schema')
    op.drop_column('mcp_plugins', 'provider_type')