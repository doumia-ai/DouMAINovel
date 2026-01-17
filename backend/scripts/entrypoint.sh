#!/bin/bash
# Docker 容器启动入口脚本
# 功能：等待数据库就绪，执行迁移，启动应用（支持反向代理 HTTPS）

set -e  # 遇到错误立即退出

# ================================
# 基础信息
# ================================

# 获取版本信息（优先环境变量，其次 .env.example）
if [ -z "$APP_VERSION" ]; then
    if [ -f "/app/.env.example" ]; then
        APP_VERSION=$(grep "^APP_VERSION=" /app/.env.example | cut -d '=' -f2)
    fi
    APP_VERSION="${APP_VERSION:-1.0.0}"
fi

if [ -z "$APP_NAME" ]; then
    if [ -f "/app/.env.example" ]; then
        APP_NAME=$(grep "^APP_NAME=" /app/.env.example | cut -d '=' -f2)
    fi
    APP_NAME="${APP_NAME:-MuMuAINovel}"
fi

BUILD_TIME=$(date '+%Y-%m-%d %H:%M:%S')

echo "================================================"
echo "🚀 ${APP_NAME} 启动中..."
echo "📦 版本: v${APP_VERSION}"
echo "🕐 启动时间: ${BUILD_TIME}"
echo "================================================"

# ================================
# 数据库配置
# ================================

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${POSTGRES_USER:-mumuai}"
DB_NAME="${POSTGRES_DB:-mumuai_novel}"

echo "⏳ 等待数据库启动..."
MAX_RETRIES=30
RETRY_COUNT=0

while ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ 数据库连接超时（${MAX_RETRIES} 秒）"
        exit 1
    fi
    echo "   等待数据库... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 1
done

echo "✅ 数据库端口可达"

echo "⏳ 等待数据库完全就绪..."
sleep 3

echo "🔍 校验数据库连接..."
if ! PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ 数据库尚未就绪"
    exit 1
fi

echo "✅ 数据库已就绪"

# ================================
# 数据库迁移
# ================================

echo "================================================"
echo "🔄 执行数据库迁移..."
echo "================================================"

cd /app

alembic upgrade head

echo "✅ 数据库迁移完成"

# ================================
# 启动应用（关键修复点）
# ================================

echo "================================================"
echo "🎉 启动应用服务..."
echo "================================================"

exec uvicorn app.main:app \
    --host "${APP_HOST:-0.0.0.0}" \
    --port "${APP_PORT:-8000}" \
    --log-level info \
    --access-log \
    --use-colors \
    --proxy-headers \
    --forwarded-allow-ips="*"