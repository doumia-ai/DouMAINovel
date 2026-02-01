# 豆妙AI创作 📚✨

<div align="center">

![Version](https://img.shields.io/badge/version-1.3.1-e-blue.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-green.svg)
![React](https://img.shields.io/badge/react-18.3.1-blue.svg)
![License](https://img.shields.io/badge/license-GPL%20v3-blue.svg)

**基于 AI 的智能小说创作助手**

[特性](#-特性) • [快速开始](#-快速开始) • [配置说明](#%EF%B8%8F-配置说明) • [项目结构](#-项目结构)

</div>

---

<div align="center">

## 💖 支持项目

如果这个项目对你有帮助，欢迎通过以下方式支持开发：

**[☕ 请我喝杯咖啡](https://ciii.eu.org/)**

您的支持是我持续开发的动力！🙏

</div>

---

## ✨ 核心特性

### 🤖 AI 智能创作
- **多模型支持** - OpenAI、Gemini、Claude 等主流 AI 模型
- **智能向导** - AI 自动生成项目大纲、角色设定和世界观
- **章节生成** - 基于大纲智能生成章节内容
- **内容润色** - AI 辅助润色和优化文本
- **章节分析** - 智能分析章节质量，提供改进建议

### 📝 创作管理
- **项目管理** - 多项目支持，独立的创作空间
- **大纲编辑** - 可视化大纲管理，支持拖拽排序
- **章节管理** - 创建、编辑、重新生成和删除章节
- **章节阅读器** - 沉浸式阅读体验，支持主题切换
- **数据导入导出** - 项目数据的完整导入导出

### 👥 角色与世界观
- **角色管理** - 详细的角色信息管理
- **人物关系** - 可视化人物关系网络
- **组织架构** - 势力、门派、组织管理
- **职业体系** - 自定义职业等级系统（修仙境界、魔法等级等）
- **世界观设定** - 构建完整的故事背景和设定

### 🎨 高级功能
- **伏笔管理** - 智能追踪剧情伏笔，提醒未回收线索
- **灵感模式** - AI 辅助生成创作灵感和点子
- **写作风格** - 自定义和管理 AI 写作风格
- **Prompt 模板** - 可视化编辑和管理提示词模板
- **类型管理** - 自定义小说类型和标签
- **MCP 插件** - 扩展 AI 能力的插件系统
- **AIGC 检测** - 检测文本是否为 AI 生成

### 🔐 用户与权限
- **多种登录** - LinuxDO OAuth 或本地账户登录
- **用户管理** - 管理员可管理用户账户和权限
- **数据隔离** - 多用户数据完全隔离
- **PostgreSQL** - 生产级数据库支持

### 🐳 部署与运维
- **Docker 部署** - 一键启动，开箱即用
- **健康检查** - 自动监控服务状态
- **日志管理** - 完整的日志记录和查询
- **性能优化** - 支持 80-150 并发用户


## 📸 项目预览

<details>

<summary>多图预警</summary>

<div align="center">

### 登录界面
![登录界面](images/1.png)

### 主界面
![主界面](images/2.png)

### 项目管理
![项目管理](images/3.png)

### 赞助我 💖
![赞助我](images/4.png)

</div>

</details>

## 📋 功能清单

### ✅ 已完成功能

#### 核心创作功能
- [x] **项目管理** - 创建、编辑、删除项目
- [x] **智能向导** - AI 自动生成大纲、角色和世界观
- [x] **大纲管理** - 可视化大纲编辑和管理
- [x] **章节管理** - 创建、编辑、生成、重新生成章节
- [x] **章节阅读器** - 沉浸式阅读体验
- [x] **章节分析** - AI 分析章节质量和提供建议
- [x] **内容润色** - AI 辅助润色文本

#### 角色与世界观
- [x] **角色管理** - 详细的角色信息管理
- [x] **人物关系** - 可视化人物关系网络
- [x] **组织管理** - 势力、门派、组织架构
- [x] **职业体系** - 自定义职业等级系统
- [x] **世界观设定** - 完整的世界观构建
- [x] **角色/组织导入导出** - 跨项目数据共享

#### 高级功能
- [x] **伏笔管理** - 智能追踪和管理剧情伏笔
- [x] **灵感模式** - AI 生成创作灵感
- [x] **写作风格** - 自定义 AI 写作风格
- [x] **Prompt 模板** - 可视化编辑提示词
- [x] **类型管理** - 自定义小说类型
- [x] **MCP 插件** - AI 能力扩展插件
- [x] **AIGC 检测** - AI 生成内容检测（需自行部署检测模型）
- [x] **数据导入导出** - 完整的项目数据导入导出

#### 系统功能
- [x] **用户认证** - LinuxDO OAuth 和本地账户登录
- [x] **用户管理** - 管理员用户管理功能
- [x] **多用户支持** - 数据隔离和权限管理
- [x] **系统设置** - AI 模型配置和系统参数
- [x] **主题切换** - 明暗主题支持

### 📝 规划中功能

- [ ] **提示词工坊** - 社区驱动的 Prompt 模板分享平台
- [ ] **协作功能** - 多人协作创作
- [ ] **版本控制** - 章节版本管理和回滚
- [ ] **导出格式** - 支持更多导出格式（EPUB、PDF 等）

> 💡 欢迎提交 Issue 或 Pull Request！


## 🚀 快速开始

### 前置要求

- Docker 和 Docker Compose
- 至少一个 AI 服务的 API Key（OpenAI/Gemini/Claude）

### Docker Compose 部署（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/doumia-ai/DouMAINovel.git
cd DouMAINovel

# 2. 配置环境变量（必需）
cp backend/.env.example .env
# 编辑 .env 文件，填入必要配置（API Key、数据库密码等）

# 3. 确保文件准备完整
# ⚠️ 重要：确保以下文件存在
# - .env（配置文件，必需挂载到容器）
# - backend/scripts/init_postgres.sql（数据库初始化脚本）

# 4. 启动服务
docker-compose up -d

# 5. 访问应用
# 打开浏览器访问 http://localhost:8000
```

> **📌 注意事项**
>
> 1. **`.env` 文件挂载**: `docker-compose.yml` 会自动将 `.env` 挂载到容器，确保文件存在
> 2. **数据库初始化**: `init_postgres.sql` 会在首次启动时自动执行，安装必要的PostgreSQL扩展
> 3. **自行构建**: 如需从源码构建，请先下载 embedding 模型文件（[加群获取](frontend/public/qq.jpg)）

### 使用 Docker Hub 镜像（推荐新手）

```bash
# 1. 拉取最新镜像（已包含模型文件）
docker pull brandeni/doumainovel:latest

# 2. 配置 .env 文件
cp backend/.env.example .env
# 编辑 .env 填入配置

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f

# 5. 更新到最新版本
docker-compose pull
docker-compose up -d
```

> **💡 提示**: Docker Hub 镜像已包含所有依赖和模型文件，无需额外下载

### 本地开发 / 从源码构建

#### 前置准备

```bash
# ⚠️ 重要：如果从源码构建，需要先下载 embedding 模型文件
# 模型文件较大（约 400MB），需放置到以下目录：
# backend/embedding/models--sentence-transformers--paraphrase-multilingual-MiniLM-L12-v2/
#
# 📥 获取方式：
# - 加入项目 QQ 群或 Linux DO 讨论区获取下载链接
# - 群号：见项目主页
# - Linux DO：https://linux.do/t/topic/1100112
```

#### 后端

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 配置 .env 文件
cp .env.example .env
# 编辑 .env 填入必要配置

# 启动 PostgreSQL（可使用 Docker）
docker run -d --name postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=mumuai_novel \
  -p 5432:5432 \
  postgres:18-alpine

# 启动后端
python -m uvicorn app.main:app --host localhost --port 8000 --reload
```

#### 前端

```bash
cd frontend
npm install
npm run dev  # 开发模式
npm run build  # 生产构建
```


## ⚙️ 配置说明

### 必需配置

创建 `.env` 文件：

```bash
# PostgreSQL 数据库（必需）
DATABASE_URL=postgresql+asyncpg://mumuai:your_password@postgres:5432/mumuai_novel
POSTGRES_PASSWORD=your_secure_password

# AI 服务配置
OPENAI_API_KEY=your_openai_key
OPENAI_BASE_URL=https://api.openai.com/v1
DEFAULT_AI_PROVIDER=openai
DEFAULT_MODEL=gpt-4o-mini

# 本地账户登录
LOCAL_AUTH_ENABLED=true
LOCAL_AUTH_USERNAME=admin
LOCAL_AUTH_PASSWORD=your_password
```

### 可选配置

```bash
# LinuxDO OAuth（可选）
LINUXDO_CLIENT_ID=your_client_id
LINUXDO_CLIENT_SECRET=your_client_secret
LINUXDO_REDIRECT_URI=http://localhost:8000/api/auth/callback

# PostgreSQL 连接池（高并发优化）
DATABASE_POOL_SIZE=30
DATABASE_MAX_OVERFLOW=20

# Gemini API（可选）
GEMINI_API_KEY=your_gemini_key
GEMINI_BASE_URL=https://generativelanguage.googleapis.com

# Claude API（可选）
ANTHROPIC_API_KEY=your_claude_key
ANTHROPIC_BASE_URL=https://api.anthropic.com
```

### 中转 API 配置

支持所有 OpenAI 兼容格式的中转服务：

```bash
# New API 示例
OPENAI_API_KEY=sk-xxxxxxxx
OPENAI_BASE_URL=https://api.new-api.com/v1

# 其他中转服务
OPENAI_BASE_URL=https://your-proxy-service.com/v1
```

## 🐳 Docker 部署详情

### 服务架构

- **postgres**: PostgreSQL 18 数据库
  - 端口: 5432
  - 数据持久化: `postgres_data` volume
  - 初始化脚本: `backend/scripts/init_postgres.sql`（自动挂载）
  - 优化配置: 支持 80-150 并发用户

- **豆妙AI创作**: 主应用服务
  - 端口: 8000
  - 日志目录: `./logs`
  - 配置挂载: `.env` 文件
  - 自动等待数据库就绪
  - 健康检查: 每 30 秒检测一次

### 重要文件说明

| 文件 | 说明 | 是否必需 |
|------|------|---------|
| `.env` | 环境配置（API Key、数据库密码等） | ✅ 必需 |
| `docker-compose.yml` | 服务编排配置 | ✅ 必需 |
| `backend/scripts/init_postgres.sql` | PostgreSQL 扩展安装脚本 | ✅ 自动挂载 |
| `backend/embedding/models--*/` | Embedding 模型文件 | ⚠️ 自建需要 |

> **注意**: 使用 Docker Hub 镜像时，模型文件已包含在镜像中，无需额外下载

### 常用命令

```bash
# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看资源使用
docker stats

# 进入容器
docker-compose exec doumainovel bash
```

### 数据持久化

- `./postgres_data` - PostgreSQL 数据库文件
- `./logs` - 应用日志文件

### 端口配置

修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "8800:8000"  # 宿主机:容器
```


## 📁 项目结构

```
豆妙AI创作/
├── backend/                    # 后端服务
│   ├── app/
│   │   ├── api/               # API 路由模块
│   │   │   ├── auth.py        # 用户认证
│   │   │   ├── projects.py    # 项目管理
│   │   │   ├── chapters.py    # 章节管理
│   │   │   ├── characters.py  # 角色管理
│   │   │   ├── outlines.py    # 大纲管理
│   │   │   ├── foreshadows.py # 伏笔管理
│   │   │   ├── careers.py     # 职业体系
│   │   │   ├── genres.py      # 类型管理
│   │   │   ├── mcp_plugins.py # MCP 插件
│   │   │   └── ...
│   │   ├── models/            # 数据模型
│   │   ├── services/          # 业务逻辑
│   │   │   ├── ai_service.py  # AI 服务集成
│   │   │   ├── ai_providers/  # AI 提供商
│   │   │   └── ...
│   │   ├── middleware/        # 中间件
│   │   ├── database.py        # 数据库连接
│   │   └── main.py            # 应用入口
│   ├── alembic/               # 数据库迁移
│   ├── scripts/               # 工具脚本
│   ├── embedding/             # Embedding 模型
│   └── requirements.txt       # Python 依赖
├── frontend/                  # 前端应用
│   ├── src/
│   │   ├── pages/            # 页面组件
│   │   │   ├── ProjectList.tsx      # 项目列表
│   │   │   ├── ProjectDetail.tsx    # 项目详情
│   │   │   ├── Chapters.tsx         # 章节管理
│   │   │   ├── Characters.tsx       # 角色管理
│   │   │   ├── Outline.tsx          # 大纲管理
│   │   │   ├── Foreshadows.tsx      # 伏笔管理
│   │   │   ├── Careers.tsx          # 职业体系
│   │   │   ├── Organizations.tsx    # 组织管理
│   │   │   ├── Relationships.tsx    # 人物关系
│   │   │   ├── WorldSetting.tsx     # 世界观设定
│   │   │   ├── WritingStyles.tsx    # 写作风格
│   │   │   ├── PromptTemplates.tsx  # Prompt 模板
│   │   │   ├── Genres.tsx           # 类型管理
│   │   │   ├── MCPPlugins.tsx       # MCP 插件
│   │   │   ├── AIGCDetect.tsx       # AIGC 检测
│   │   │   ├── Inspiration.tsx      # 灵感模式
│   │   │   ├── Settings.tsx         # 系统设置
│   │   │   └── ...
│   │   ├── components/       # 通用组件
│   │   ├── services/         # API 服务
│   │   │   ├── api/          # API 模块
│   │   │   │   ├── auth.api.ts
│   │   │   │   ├── project.api.ts
│   │   │   │   ├── chapter.api.ts
│   │   │   │   ├── character.api.ts
│   │   │   │   ├── outline.api.ts
│   │   │   │   ├── foreshadow.api.ts
│   │   │   │   └── ...
│   │   │   ├── http.client.ts      # HTTP 客户端
│   │   │   └── error.handler.ts    # 错误处理
│   │   ├── types/            # TypeScript 类型
│   │   │   ├── api.types.ts        # API 类型
│   │   │   ├── models.types.ts     # 数据模型类型
│   │   │   └── common.types.ts     # 通用类型
│   │   ├── config/           # 配置文件
│   │   │   └── routes.config.tsx   # 路由配置
│   │   ├── store/            # 状态管理
│   │   ├── hooks/            # 自定义 Hooks
│   │   └── utils/            # 工具函数
│   └── package.json
├── docker-compose.yml         # Docker Compose 配置
├── Dockerfile                 # Docker 镜像构建
└── README.md
```

## 🛠️ 技术栈

### 后端技术

- **框架**: FastAPI 0.109.0
- **数据库**: PostgreSQL 18 + SQLAlchemy
- **AI SDK**: OpenAI SDK、Google Generative AI、Anthropic SDK
- **异步**: asyncio、asyncpg
- **认证**: OAuth 2.0、JWT
- **其他**: Alembic（数据库迁移）、Pydantic（数据验证）

### 前端技术

- **框架**: React 18.3.1 + TypeScript
- **构建工具**: Vite 7.1.7
- **UI 库**: Ant Design 5.27.6
- **状态管理**: Zustand 5.0.8
- **路由**: React Router 6.28.0
- **HTTP 客户端**: Axios 1.12.2
- **其他**: Day.js、React Beautiful DnD

### 基础设施

- **容器化**: Docker + Docker Compose
- **数据库**: PostgreSQL 18 Alpine
- **反向代理**: 支持 Nginx/Caddy
- **日志**: 结构化日志记录


## 📖 使用指南

### 快速上手

1. **登录系统**
   - 使用本地账户登录（默认：admin/admin）
   - 或使用 LinuxDO OAuth 登录

2. **创建项目**
   - 点击"创建项目"
   - 选择"使用向导创建"或"手动创建"

3. **AI 向导生成**
   - 输入小说基本信息（标题、类型、简介等）
   - AI 自动生成大纲、角色和世界观
   - 可手动调整生成的内容

4. **编辑完善**
   - 管理角色关系和组织架构
   - 完善世界观设定
   - 调整大纲结构

5. **生成章节**
   - 基于大纲生成章节内容
   - 支持重新生成和润色
   - 章节分析提供改进建议

### 高级功能

#### 伏笔管理
- 创建伏笔并标记埋入章节
- 追踪伏笔状态（待埋入、已埋入、已回收）
- 查看伏笔时间线

#### 职业体系
- 自定义职业类型（修仙、魔法、武道等）
- 设置等级和晋升条件
- 关联角色职业和等级

#### 写作风格
- 创建自定义写作风格
- 设置风格参数和示例
- 应用到章节生成

#### MCP 插件
- 扩展 AI 能力
- 配置插件参数
- 测试插件功能

### API 文档

启动服务后访问：

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### 常见问题

<details>
<summary>如何更换 AI 模型？</summary>

在"系统设置"页面中：
1. 选择 AI 提供商（OpenAI/Gemini/Claude）
2. 填入对应的 API Key
3. 选择模型（如 gpt-4o-mini、gemini-pro 等）
4. 保存设置

</details>

<details>
<summary>如何导入导出项目？</summary>

**导出**：
1. 进入项目详情页
2. 点击"导出项目"
3. 选择导出选项（是否包含生成历史等）
4. 下载 JSON 文件

**导入**：
1. 在项目列表页点击"导入项目"
2. 上传 JSON 文件
3. 系统自动创建项目

</details>

<details>
<summary>如何备份数据？</summary>

**方法一：数据库备份**
```bash
docker-compose exec postgres pg_dump -U mumuai mumuai_novel > backup.sql
```

**方法二：导出所有项目**
逐个导出项目为 JSON 文件

</details>

<details>
<summary>如何升级到最新版本？</summary>

```bash
# 拉取最新镜像
docker-compose pull

# 重启服务
docker-compose up -d

# 查看日志确认启动成功
docker-compose logs -f
```

</details>


## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 开发规范

- **代码风格**: 遵循 PEP 8（Python）和 ESLint（TypeScript）
- **提交信息**: 使用清晰的提交信息
- **测试**: 确保代码通过现有测试
- **文档**: 更新相关文档

### 贡献者

感谢所有为本项目做出贡献的开发者！

<a href="https://github.com/doumia-ai/DouMAINovel/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=doumia-ai/DouMAINovel" />
</a>

## 📝 许可证

本项目采用 [GNU General Public License v3.0](LICENSE)

**GPL v3 意味着：**
- ✅ 可自由使用、修改和分发
- ✅ 可用于商业目的
- 📝 必须开源修改版本
- 📝 必须保留原作者版权
- 📝 衍生作品必须使用 GPL v3 协议

## 🙏 致谢

### 开源项目

- [FastAPI](https://fastapi.tiangolo.com/) - 现代化的 Python Web 框架
- [React](https://react.dev/) - 用户界面构建库
- [Ant Design](https://ant.design/) - 企业级 UI 设计语言和组件库
- [PostgreSQL](https://www.postgresql.org/) - 强大的开源关系型数据库
- [Zustand](https://zustand-demo.pmnd.rs/) - 轻量级状态管理
- [Vite](https://vitejs.dev/) - 下一代前端构建工具

### AI 服务提供商

- [OpenAI](https://openai.com/) - GPT 系列模型
- [Google AI](https://ai.google.dev/) - Gemini 系列模型
- [Anthropic](https://www.anthropic.com/) - Claude 系列模型

## 📧 联系方式

- **GitHub Issues**: [提交问题](https://github.com/doumia-ai/DouMAINovel/issues)
- **QQ 群**: [加入 QQ 群](frontend/public/qq.jpg)
- **微信群**: [加入微信群](frontend/public/WX.png)

## 🌟 Star History

如果这个项目对你有帮助，请给个 ⭐️ Star！

<a href="https://www.star-history.com/#doumia-ai/DouMAINovel&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=doumia-ai/DouMAINovel&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=doumia-ai/DouMAINovel&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=doumia-ai/DouMAINovel&type=date&legend=top-left" />
 </picture>
</a>

## 📊 项目统计

![Alt](https://repobeats.axiom.co/api/embed/ee7141a5f269c64759302e067abe23b46796bafe.svg "Repobeats analytics image")

---

<div align="center">

**Made with ❤️ by 豆妙AI创作团队**

[⬆ 回到顶部](#豆妙ai创作-)

</div>
