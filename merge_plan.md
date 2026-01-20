# Main 分支更新合并到 Optimize 分支工作文档

## 概述
本文档详细说明如何将 main 分支的 4 个关键提交合并到 optimize 分支，采用代码修改而非文件覆盖的方式。

---

## 提交信息汇总

### 1. 提交 927072d - 优化剧情分析与章节规划算法
**作者**: xiamuceer-j  
**日期**: 2026-01-19 17:23:50  
**影响文件**:
- `backend/app/services/chapter_context_service.py` (+185行, -31行)
- `backend/app/services/plot_expansion_service.py` (+71行, -31行)
- `backend/app/services/prompt_service.py` (+83行, -31行)

**核心功能**:
- 集成伏笔上下文追踪到章节生成流程
- 增强章节衔接锚点（包含上一章摘要和关键事件）
- 优化剧情分析算法，支持伏笔ID追踪
- 完善章节删除时的级联清理逻辑

---

### 2. 提交 5f25deb - 新增伏笔管理系统
**作者**: xiamuceer-j  
**日期**: 2026-01-19 17:24:37  
**影响文件**: 19个文件，+4068行, -91行

**核心功能**:
- 完整的伏笔管理系统（前后端）
- 可视化追踪伏笔状态
- AI智能关联回收
- 章节生成时的伏笔提醒

**新增文件**:
- `backend/app/api/foreshadows.py` - 伏笔API路由
- `backend/app/models/foreshadow.py` - 伏笔数据模型
- `backend/app/schemas/foreshadow.py` - 伏笔数据模式
- `backend/app/services/foreshadow_service.py` - 伏笔业务逻辑
- `frontend/src/pages/Foreshadows.tsx` - 伏笔管理前端页面
- 数据库迁移脚本（SQLite版本）

**修改文件**:
- `backend/app/api/chapters.py` - 集成伏笔功能
- `backend/app/api/memories.py` - 记忆与伏笔关联
- `backend/app/api/outlines.py` - 大纲与伏笔关联
- `backend/app/main.py` - 注册伏笔路由
- `backend/app/models/__init__.py` - 导出伏笔模型
- `backend/app/services/plot_analyzer.py` - 剧情分析支持伏笔
- `frontend/src/App.tsx` - 添加伏笔路由
- `frontend/src/pages/Chapters.tsx` - 章节页面集成伏笔
- `frontend/src/pages/ProjectDetail.tsx` - 项目详情集成伏笔
- `frontend/src/services/api.ts` - 伏笔API调用
- `frontend/src/types/index.ts` - 伏笔类型定义

---

### 3. 提交 444ba9d - 更新版本v1.3.0
**作者**: xiamuceer  
**日期**: 2026-01-20 09:11:30  
**影响文件**: 5个文件

**核心功能**:
- 版本号更新到 v1.3.0
- 新增 PostgreSQL 数据库迁移脚本

**修改文件**:
- `README.md` - 版本徽章更新
- `backend/.env.example` - APP_VERSION 更新
- `frontend/package.json` - 版本号更新
- `frontend/package-lock.json` - 依赖版本更新
- 新增 PostgreSQL 迁移脚本

---

### 4. 提交 ebb3506 - 修复Docker构建错误
**作者**: xiamuceer-j  
**日期**: 2026-01-20 09:26:48  
**影响文件**: 1个文件

**核心功能**:
- 修复前端构建时因镜像源不一致导致的404错误

**修改文件**:
- `Dockerfile` - 删除 package-lock.json 避免镜像源冲突

---

## 合并策略建议

### 阶段一：准备工作
1. **备份当前 optimize 分支**
   ```bash
   git branch optimize-backup
   ```

2. **检查 optimize 分支的独特修改**
   ```bash
   git log optimize --not main --oneline
   ```

3. **识别冲突文件**
   - 对比 optimize 分支是否修改了上述文件
   - 特别关注 `chapter_context_service.py`、`plot_expansion_service.py`、`prompt_service.py`

---

### 阶段二：逐个提交合并

#### 步骤 1: 合并提交 5f25deb（伏笔管理系统）

**优先级**: 最高（基础功能）

**操作步骤**:

1. **新增文件（直接复制）**:
   ```bash
   # 后端新增文件
   git checkout main -- backend/app/api/foreshadows.py
   git checkout main -- backend/app/models/foreshadow.py
   git checkout main -- backend/app/schemas/foreshadow.py
   git checkout main -- backend/app/services/foreshadow_service.py
   
   # 前端新增文件
   git checkout main -- frontend/src/pages/Foreshadows.tsx
   
   # 数据库迁移脚本
   git checkout main -- "backend/alembic/sqlite/versions/20260119_1005_951919659e0f_添加伏笔管理表.py"
   ```

2. **修改现有文件（需要手动合并）**:

   **文件**: `backend/app/main.py`
   - 在路由注册部分添加:
   ```python
   from app.api import foreshadows
   app.include_router(foreshadows.router, prefix="/api/foreshadows", tags=["foreshadows"])
   ```

   **文件**: `backend/app/models/__init__.py`
   - 添加导入:
   ```python
   from app.models.foreshadow import Foreshadow
   ```

   **文件**: `backend/app/api/chapters.py`
   - 需要详细对比差异，主要是集成伏笔相关的API端点
   - 建议使用 `git diff main optimize -- backend/app/api/chapters.py` 查看差异
   - 手动添加伏笔相关的路由和逻辑

   **文件**: `frontend/src/App.tsx`
   - 添加伏笔页面路由:
   ```tsx
   import Foreshadows from './pages/Foreshadows';
   // 在路由配置中添加
   <Route path="/foreshadows" element={<Foreshadows />} />
   ```

   **文件**: `frontend/src/services/api.ts`
   - 添加伏笔相关的API调用函数
   - 参考 main 分支的实现

   **文件**: `frontend/src/types/index.ts`
   - 添加伏笔相关的TypeScript类型定义

3. **运行数据库迁移**:
   ```bash
   # SQLite
   cd backend
   alembic -c alembic-sqlite.ini upgrade head
   
   # PostgreSQL（如果使用）
   alembic -c alembic-postgres.ini upgrade head
   ```

---

#### 步骤 2: 合并提交 927072d（优化剧情分析算法）

**优先级**: 高（依赖伏笔系统）

**操作步骤**:

1. **文件**: `backend/app/services/chapter_context_service.py`

   **关键修改点**:
   
   a. 在 `ChapterContext` 类中添加新字段:
   ```python
   from app.models.foreshadow import Foreshadow
   
   # 在 ChapterContext 类中添加
   previous_chapter_summary: Optional[str] = None
   previous_chapter_events: Optional[List[str]] = None
   foreshadow_reminders: Optional[str] = None
   ```

   b. 在 `ChapterContextBuilder.__init__` 中添加:
   ```python
   def __init__(self, memory_service=None, foreshadow_service=None):
       self.memory_service = memory_service
       self.foreshadow_service = foreshadow_service
   ```

   c. 替换 `_get_last_ending` 方法为 `_get_last_ending_enhanced`:
   - 完整复制新方法（约100行代码）
   - 更新调用处

   d. 添加 `_get_foreshadow_reminders` 方法:
   - 完整复制新方法（约50行代码）

   e. 在 `build` 方法中添加伏笔提醒逻辑:
   ```python
   # 在 P2-参考信息部分添加
   if self.foreshadow_service:
       context.foreshadow_reminders = await self._get_foreshadow_reminders(
           project.id, chapter_number, db
       )
   ```

2. **文件**: `backend/app/services/plot_expansion_service.py`

   **关键修改点**:
   
   a. 在 `_generate_batch_plans` 方法中:
   - 增强上下文构建逻辑（包含差异化信息）
   - 添加已使用关键事件追踪
   - 更新提示词模板调用

   b. 在 `_parse_expansion_response` 方法中:
   - 添加 `ending_type` 字段处理
   - 确保 `key_events` 非空

3. **文件**: `backend/app/services/prompt_service.py`

   **关键修改点**:
   
   a. 在章节生成提示词模板中添加:
   ```python
   <foreshadow_reminders priority="P1">
   【🎯 伏笔提醒 - 需关注】
   {foreshadow_reminders}
   </foreshadow_reminders>
   
   <continuation>
   【🔴 上一章已完成剧情（禁止重复！）】
   {previous_chapter_summary}
   </continuation>
   ```

   b. 在剧情分析提示词中添加:
   ```python
   <existing_foreshadows priority="P1">
   【已埋入伏笔列表 - 用于回收匹配】
   {existing_foreshadows}
   </existing_foreshadows>
   ```

   c. 更新伏笔分析部分的JSON格式要求:
   - 添加 `reference_foreshadow_id` 字段
   - 添加更多伏笔属性字段

   d. 更新模板参数列表:
   ```python
   "parameters": [..., "foreshadow_reminders", "previous_chapter_summary"]
   ```

---

#### 步骤 3: 合并提交 444ba9d（版本更新）

**优先级**: 中

**操作步骤**:

1. **更新版本号**:
   
   **文件**: `README.md`
   ```markdown
   ![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)
   ```

   **文件**: `backend/.env.example`
   ```
   APP_VERSION=1.3.0-e
   ```

   **文件**: `frontend/package.json`
   ```json
   "version": "1.3.0-e"
   ```

2. **添加 PostgreSQL 迁移脚本**:
   ```bash
   git checkout main -- "backend/alembic/postgres/versions/20260119_1729_6a73f37e9adb_添加伏笔管理表.py"
   ```

3. **更新 package-lock.json**:
   - 如果 optimize 分支有自己的依赖修改，需要手动合并
   - 建议重新运行 `npm install` 生成新的 lock 文件

---

#### 步骤 4: 合并提交 ebb3506（Docker修复）

**优先级**: 低（仅影响Docker构建）

**操作步骤**:

**文件**: `Dockerfile`
- 在前端构建部分添加:
```dockerfile
# 删除 package-lock.json 以避免因镜像源不一致导致的 404 错误
RUN rm -f package-lock.json
```

---

### 阶段三：测试验证

1. **后端测试**:
   ```bash
   cd backend
   # 检查数据库迁移
   alembic -c alembic-sqlite.ini current
   
   # 启动后端服务
   python -m uvicorn app.main:app --reload
   
   # 测试伏笔API
   curl http://localhost:8000/api/foreshadows/
   ```

2. **前端测试**:
   ```bash
   cd frontend
   npm install
   npm run dev
   
   # 访问伏笔管理页面
   # http://localhost:5173/foreshadows
   ```

3. **集成测试**:
   - 创建新项目
   - 生成章节，验证伏笔提醒功能
   - 查看剧情分析，验证伏笔追踪
   - 测试伏笔管理界面

---

### 阶段四：冲突解决

如果 optimize 分支对相同文件有修改，需要：

1. **识别冲突**:
   ```bash
   git diff optimize main -- <文件路径>
   ```

2. **手动合并策略**:
   - 保留 optimize 分支的优化逻辑
   - 添加 main 分支的伏笔功能
   - 确保两者不冲突

3. **重点关注文件**:
   - `chapter_context_service.py` - 可能有性能优化冲突
   - `plot_expansion_service.py` - 可能有算法优化冲突
   - `prompt_service.py` - 可能有提示词优化冲突

---

## 风险评估

### 高风险区域
1. **章节生成流程** - 核心业务逻辑，修改较大
2. **数据库模型** - 新增表和字段，需要迁移
3. **前端路由** - 新增页面，可能影响现有导航

### 中风险区域
1. **API路由** - 新增端点，需要测试
2. **提示词模板** - 修改较多，影响AI生成质量

### 低风险区域
1. **版本号更新** - 纯配置修改
2. **Docker构建** - 独立修改

---

## 回滚方案

如果合并出现问题：

1. **快速回滚**:
   ```bash
   git reset --hard optimize-backup
   ```

2. **部分回滚**:
   ```bash
   # 回滚特定文件
   git checkout optimize-backup -- <文件路径>
   ```

3. **数据库回滚**:
   ```bash
   # 回滚到上一个版本
   alembic -c alembic-sqlite.ini downgrade -1
   ```

---

## 建议的合并顺序

1. ✅ **第一步**: 合并提交 5f25deb（伏笔管理系统基础）
2. ✅ **第二步**: 合并提交 927072d（集成伏笔到章节生成）
3. ✅ **第三步**: 合并提交 444ba9d（版本更新）
4. ✅ **第四步**: 合并提交 ebb3506（Docker修复）

每完成一步后进行测试，确保功能正常再进行下一步。

---

## 注意事项

1. **不要使用 `git merge --allow-unrelated-histories`**
   - 这会导致大量冲突
   - 采用手动合并更可控

2. **保持增量提交**
   - 每合并一个功能就提交一次
   - 便于追踪和回滚

3. **充分测试**
   - 每个阶段都要测试
   - 特别是章节生成和伏笔功能

4. **文档同步**
   - 更新 README 中的功能说明
   - 更新 API 文档

---

## 完成检查清单

- [ ] 备份 optimize 分支
- [ ] 新增伏笔相关文件
- [ ] 修改 main.py 注册路由
- [ ] 修改 models/__init__.py
- [ ] 更新 chapter_context_service.py
- [ ] 更新 plot_expansion_service.py
- [ ] 更新 prompt_service.py
- [ ] 更新前端路由和页面
- [ ] 运行数据库迁移
- [ ] 更新版本号
- [ ] 修改 Dockerfile
- [ ] 后端功能测试
- [ ] 前端功能测试
- [ ] 集成测试
- [ ] 提交所有更改

---

## 联系与支持

如果在合并过程中遇到问题，请：
1. 检查本文档的相关章节
2. 查看 git diff 输出
3. 参考 main 分支的完整实现
4. 必要时回滚到备份分支重新开始
