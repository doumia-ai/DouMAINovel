"""自动组织引入服务 - 在续写大纲时根据剧情推进自动引入新组织"""
from typing import List, Dict, Any, Optional, Callable, Awaitable
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json
import asyncio

from app.models.character import Character
from app.models.relationship import Organization, OrganizationMember
from app.models.project import Project
from app.services.ai_service import AIService
from app.services.prompt_service import PromptService
from app.logger import get_logger

logger = get_logger(__name__)


class AutoOrganizationService:
    """自动组织引入服务"""
    
    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service
    
    async def analyze_and_create_organizations(
        self,
        project_id: str,
        outline_content: str,
        existing_characters: List[Character],
        existing_organizations: List[Dict[str, Any]],
        db: AsyncSession,
        user_id: str = None,
        enable_mcp: bool = True,
        all_chapters_brief: str = "",
        start_chapter: int = 1,
        chapter_count: int = 3,
        plot_stage: str = "发展",
        story_direction: str = "继续推进主线剧情",
        preview_only: bool = False,
        progress_callback: Optional[Callable[[str], Awaitable[None]]] = None
    ) -> Dict[str, Any]:
        """
        预测性分析并创建需要的新组织
        
        Args:
            project_id: 项目ID
            outline_content: 当前批次大纲内容（用于向后兼容，实际不使用）
            existing_characters: 现有角色列表
            existing_organizations: 现有组织列表
            db: 数据库会话
            user_id: 用户ID(用于MCP和自定义提示词)
            enable_mcp: 是否启用MCP增强
            all_chapters_brief: 已有章节概览
            start_chapter: 起始章节号
            chapter_count: 续写章节数
            plot_stage: 剧情阶段
            story_direction: 故事发展方向
            preview_only: 仅预测不创建（用于组织确认机制）
            
        Returns:
            {
                "new_organizations": [组织信息字典列表],
                "members_created": [成员关系信息列表],
                "organization_count": 新增组织数量,
                "analysis_result": AI分析结果,
                "predicted_organizations": [预测的组织数据]
                "needs_new_organizations": bool,
                "reason": str
            }
        """
        logger.info(f"🏛️ 【组织引入】预测性分析：检测是否需要引入新组织...")
        logger.info(f"  - 项目ID: {project_id}")
        logger.info(f"  - 续写计划: 第{start_chapter}章起，共{chapter_count}章")
        logger.info(f"  - 剧情阶段: {plot_stage}")
        logger.info(f"  - 发展方向: {story_direction}")
        logger.info(f"  - 现有角色数: {len(existing_characters)}")
        logger.info(f"  - 现有组织数: {len(existing_organizations)}")
        
        # 1. 获取项目信息
        project_result = await db.execute(
            select(Project).where(Project.id == project_id)
        )
        project = project_result.scalar_one_or_none()
        if not project:
            raise ValueError("项目不存在")
        
        # ⭐ 关键修复：提前提取项目信息到字典，避免后续 Session 解绑问题
        project_info = {
            "id": project.id,
            "title": project.title,
            "theme": project.theme,
            "genre": project.genre,
            "world_time_period": project.world_time_period,
            "world_location": project.world_location,
            "world_atmosphere": project.world_atmosphere,
            "world_rules": project.world_rules
        }
        logger.debug(f"  ✅ 已提取项目信息: {project_info['title']}")
        
        # ⭐ 关键修复：提前提取角色信息到字典列表，避免后续 Session 解绑问题
        existing_chars_info = []
        for char in existing_characters:
            try:
                existing_chars_info.append({
                    "id": char.id,
                    "name": char.name,
                    "is_organization": char.is_organization,
                    "role_type": char.role_type,
                    "personality": char.personality[:100] if char.personality else ""
                })
            except Exception as e:
                logger.warning(f"提取角色信息失败: {e}")
                continue
        logger.debug(f"  ✅ 已提取 {len(existing_chars_info)} 个角色信息")
        
        # 2. 构建现有组织信息摘要
        existing_orgs_summary = self._build_organization_summary(existing_organizations)
        existing_chars_summary = self._build_character_summary_from_info(existing_chars_info)
        
        # 3. AI预测性分析是否需要新组织
        if progress_callback:
            await progress_callback("🤖 AI分析组织需求...")
        
        analysis_result = await self._analyze_organization_needs(
            project_info=project_info,
            outline_content=outline_content,
            existing_orgs_summary=existing_orgs_summary,
            existing_chars_summary=existing_chars_summary,
            db=db,
            user_id=user_id,
            enable_mcp=enable_mcp,
            all_chapters_brief=all_chapters_brief,
            start_chapter=start_chapter,
            chapter_count=chapter_count,
            plot_stage=plot_stage,
            story_direction=story_direction
        )
        
        if progress_callback:
            await progress_callback("✅ 组织需求分析完成")
        
        # 4. 判断是否需要创建组织
        if not analysis_result or not analysis_result.get("needs_new_organizations"):
            logger.info("✅ AI判断：当前剧情不需要引入新组织")
            return {
                "new_organizations": [],
                "members_created": [],
                "organization_count": 0,
                "analysis_result": analysis_result,
                "predicted_organizations": [],
                "needs_new_organizations": False,
                "reason": analysis_result.get("reason", "当前剧情不需要新组织")
            }
        
        # 5. 如果是预览模式，仅返回预测结果，不创建组织
        if preview_only:
            organization_specs = analysis_result.get("organization_specifications", [])
            logger.info(f"🔮 预览模式：预测到 {len(organization_specs)} 个组织，不创建数据库记录")
            return {
                "new_organizations": [],
                "members_created": [],
                "organization_count": 0,
                "analysis_result": analysis_result,
                "predicted_organizations": organization_specs,
                "needs_new_organizations": True,
                "reason": analysis_result.get("reason", "预测需要新组织")
            }
        
        # 6. 批量生成新组织（非预览模式）
        new_organizations = []
        members_created = []
        skipped_organizations = []
        
        organization_specs = analysis_result.get("organization_specifications", [])
        logger.info(f"🎯 AI建议引入 {len(organization_specs)} 个新组织")
        
        # 获取现有组织名称列表用于重复检测
        existing_org_names = set()
        for org in existing_organizations:
            if isinstance(org, dict):
                org_name = org.get('name', '')
            else:
                org_name = getattr(org, 'name', '')
            if org_name:
                existing_org_names.add(org_name.lower().strip())
        
        for idx, spec in enumerate(organization_specs):
            try:
                spec_name = spec.get('name', spec.get('organization_description', '未命名'))
                
                # 重复检测
                if spec_name.lower().strip() in existing_org_names:
                    logger.info(f"  [{idx+1}/{len(organization_specs)}] ⏭️ 跳过已存在的组织: {spec_name}")
                    skipped_organizations.append({
                        "name": spec_name,
                        "reason": "already_exists"
                    })
                    if progress_callback:
                        await progress_callback(f"⏭️ [{idx+1}/{len(organization_specs)}] 跳过已存在: {spec_name}")
                    continue
                
                logger.info(f"  [{idx+1}/{len(organization_specs)}] 生成组织规格: {spec_name}")
                
                if progress_callback:
                    await progress_callback(f"🏛️ [{idx+1}/{len(organization_specs)}] 生成组织详情: {spec_name}")
                
                # 生成组织详细信息
                organization_data = await self._generate_organization_details(
                    spec=spec,
                    project_info=project_info,
                    existing_chars_info=existing_chars_info,
                    existing_organizations=existing_organizations,
                    db=db,
                    user_id=user_id,
                    enable_mcp=enable_mcp
                )
                
                # 再次检查生成后的组织名是否重复
                generated_name = organization_data.get('name', spec_name)
                if generated_name.lower().strip() in existing_org_names:
                    logger.info(f"  [{idx+1}/{len(organization_specs)}] ⏭️ 跳过已存在的组织(生成后检测): {generated_name}")
                    skipped_organizations.append({
                        "name": generated_name,
                        "reason": "already_exists_after_generation"
                    })
                    if progress_callback:
                        await progress_callback(f"⏭️ [{idx+1}/{len(organization_specs)}] 跳过已存在: {generated_name}")
                    continue
                
                if progress_callback:
                    await progress_callback(f"💾 [{idx+1}/{len(organization_specs)}] 保存组织: {generated_name}")
                
                # ⭐ 创建组织记录并返回信息字典
                org_info = await self._create_organization_record(
                    project_id=project_id,
                    organization_data=organization_data,
                    db=db
                )
                
                # 🔧 修复：使用 flush 而不是 commit，由调用方统一管理事务
                await db.flush()
                logger.info(f"  ✅ 创建新组织: {org_info['character_name']}, ID: {org_info['organization_id']} (已flush)")
                
                # 将新创建的组织名加入已存在列表
                existing_org_names.add(org_info['character_name'].lower().strip())
                
                new_organizations.append(org_info)
                
                if progress_callback:
                    await progress_callback(f"✅ [{idx+1}/{len(organization_specs)}] 组织创建成功: {org_info['character_name']}")
                
                # 建立成员关系
                members_data = organization_data.get("initial_members", [])
                if members_data:
                    logger.info(f"  🔗 开始创建 {len(members_data)} 个成员关系...")
                    
                    if progress_callback:
                        await progress_callback(f"🔗 [{idx+1}/{len(organization_specs)}] 建立 {len(members_data)} 个成员关系")
                    
                    members = await self._create_member_relationships(
                        organization_id=org_info["organization_id"],
                        member_specs=members_data,
                        project_id=project_id,
                        db=db
                    )
                    members_created.extend(members)
                    
                    # 🔧 修复：使用 flush 而不是 commit，由调用方统一管理事务
                    await db.flush()
                    logger.info(f"  ✅ 实际创建了 {len(members)} 个成员关系记录 (已flush)")
                
            except Exception as e:
                logger.error(f"  ❌ 创建组织失败: {e}")
                # 🔧 修复：不在这里回滚，由外层统一管理事务
                continue
        
        # 构建创建摘要
        creation_summary = {
            "total_suggested": len(organization_specs),
            "created": len(new_organizations),
            "skipped": len(skipped_organizations),
            "skipped_details": skipped_organizations
        }
        
        logger.info(f"🎉 自动组织引入完成: 新增{len(new_organizations)}个组织, {len(members_created)}个成员关系, 跳过{len(skipped_organizations)}个已存在组织")
        
        return {
            "new_organizations": new_organizations,
            "members_created": members_created,
            "organization_count": len(new_organizations),
            "analysis_result": analysis_result,
            "predicted_organizations": [],
            "needs_new_organizations": True,
            "reason": analysis_result.get("reason", ""),
            "creation_summary": creation_summary
        }
    
    def _build_organization_summary(self, organizations: List[Dict[str, Any]]) -> str:
        """构建现有组织摘要"""
        if not organizations:
            return "暂无组织"
        
        summary = []
        for org in organizations:
            org_name = org.get("name", "未知")
            org_type = org.get("organization_type", "未知类型")
            power_level = org.get("power_level", 50)
            purpose = (org.get("organization_purpose") or "")[:50]
            summary.append(f"- {org_name} ({org_type}, 势力等级:{power_level}): {purpose}")
        
        return "\n".join(summary[:15])
    
    def _build_character_summary(self, characters: List[Character]) -> str:
        """构建现有角色摘要"""
        if not characters:
            return "暂无角色"
        
        summary = []
        for char in characters:
            if not char.is_organization:
                char_role = char.role_type or "未知"
                personality = (char.personality or "")[:30]
                summary.append(f"- {char.name} ({char_role}): {personality}")
        
        return "\n".join(summary[:20])
    
    def _build_character_summary_from_info(self, chars_info: List[Dict[str, Any]]) -> str:
        """从字典列表构建现有角色摘要（避免 Session 解绑问题）"""
        if not chars_info:
            return "暂无角色"
        
        summary = []
        for char in chars_info:
            if not char.get("is_organization"):
                char_role = char.get("role_type") or "未知"
                personality = (char.get("personality") or "")[:30]
                summary.append(f"- {char.get('name', '未知')} ({char_role}): {personality}")
        
        return "\n".join(summary[:20])
    
    async def _analyze_organization_needs(
        self,
        project_info: Dict[str, Any],
        outline_content: str,
        existing_orgs_summary: str,
        existing_chars_summary: str,
        db: AsyncSession,
        user_id: str,
        enable_mcp: bool,
        all_chapters_brief: str = "",
        start_chapter: int = 1,
        chapter_count: int = 3,
        plot_stage: str = "发展",
        story_direction: str = "继续推进主线剧情"
    ) -> Dict[str, Any]:
        """AI预测性分析是否需要新组织"""
        
        template = await PromptService.get_template(
            "AUTO_ORGANIZATION_ANALYSIS",
            user_id,
            db
        )
        
        prompt = PromptService.format_prompt(
            template,
            title=project_info.get("title", "未知"),
            theme=project_info.get("theme") or "未设定",
            genre=project_info.get("genre") or "未设定",
            time_period=project_info.get("world_time_period") or "未设定",
            location=project_info.get("world_location") or "未设定",
            atmosphere=project_info.get("world_atmosphere") or "未设定",
            existing_organizations=existing_orgs_summary,
            existing_characters=existing_chars_summary,
            all_chapters_brief=all_chapters_brief,
            start_chapter=start_chapter,
            chapter_count=chapter_count,
            plot_stage=plot_stage,
            story_direction=story_direction
        )
        
        try:
            analysis = await asyncio.wait_for(
                self.ai_service.call_with_json_retry(
                    prompt=prompt,
                    max_retries=3,
                ),
                timeout=300.0
            )
            
            # ⭐ 处理 AI 返回列表而非字典的情况
            if isinstance(analysis, list):
                if len(analysis) > 0 and isinstance(analysis[0], dict):
                    logger.warning(f"  ⚠️ AI分析返回了列表格式，提取第一个元素")
                    analysis = analysis[0]
                else:
                    logger.warning(f"  ⚠️ AI分析返回了无效的列表格式，默认不需要新组织")
                    return {"needs_new_organizations": False}
            
            logger.info(f"  ✅ AI分析完成: needs_new_organizations={analysis.get('needs_new_organizations')}")
            return analysis
            
        except json.JSONDecodeError as e:
            logger.error(f"  ❌ 组织需求分析JSON解析失败: {e}")
            return {"needs_new_organizations": False}
        except Exception as e:
            logger.error(f"  ❌ 组织需求分析失败: {e}")
            return {"needs_new_organizations": False}
    
    async def _generate_organization_details(
        self,
        spec: Dict[str, Any],
        project_info: Dict[str, Any],
        existing_chars_info: List[Dict[str, Any]],
        existing_organizations: List[Dict[str, Any]],
        db: AsyncSession,
        user_id: str,
        enable_mcp: bool
    ) -> Dict[str, Any]:
        """生成组织详细信息"""
        
        template = await PromptService.get_template(
            "AUTO_ORGANIZATION_GENERATION",
            user_id,
            db
        )
        
        existing_orgs_summary = self._build_organization_summary(existing_organizations)
        existing_chars_summary = self._build_character_summary_from_info(existing_chars_info)
        
        prompt = PromptService.format_prompt(
            template,
            title=project_info.get("title", "未知"),
            genre=project_info.get("genre") or "未设定",
            theme=project_info.get("theme") or "未设定",
            time_period=project_info.get("world_time_period") or "未设定",
            location=project_info.get("world_location") or "未设定",
            atmosphere=project_info.get("world_atmosphere") or "未设定",
            rules=project_info.get("world_rules") or "未设定",
            existing_organizations=existing_orgs_summary,
            existing_characters=existing_chars_summary,
            plot_context="根据剧情需要引入的新组织",
            organization_specification=json.dumps(spec, ensure_ascii=False, indent=2),
            mcp_references=""
        )
        
        try:
            organization_data = await asyncio.wait_for(
                self.ai_service.call_with_json_retry(
                    prompt=prompt,
                    max_retries=3,
                ),
                timeout=300.0
            )
            
            # ⭐ 处理 AI 返回列表而非字典的情况
            if isinstance(organization_data, list):
                if len(organization_data) > 0 and isinstance(organization_data[0], dict):
                    logger.warning(f"    ⚠️ AI返回了列表格式，提取第一个元素")
                    organization_data = organization_data[0]
                else:
                    raise ValueError("AI返回的数据格式无效：期望字典或包含字典的列表")
            
            org_name = organization_data.get('name', '未知')
            logger.info(f"    ✅ 组织详情生成成功: {org_name}")
            
            if 'name' not in organization_data or not organization_data['name']:
                logger.warning(f"    ⚠️ AI返回的组织数据缺少name字段，使用规格中的信息")
                organization_data['name'] = spec.get('name', f"新组织{spec.get('organization_description', '')[:10]}")
            
            return organization_data
            
        except Exception as e:
            logger.error(f"    ❌ 生成组织详情失败: {e}")
            raise
    
    async def _create_organization_record(
        self,
        project_id: str,
        organization_data: Dict[str, Any],
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        创建组织数据库记录（包括Character和Organization）
        
        ⭐ 返回信息字典而不是 ORM 对象，避免 Session 解绑问题
        """
        
        character = Character(
            project_id=project_id,
            name=organization_data.get("name", "未命名组织"),
            is_organization=True,
            role_type=organization_data.get("role_type", "supporting"),
            personality=organization_data.get("personality", ""),
            background=organization_data.get("background", ""),
            appearance=organization_data.get("appearance", ""),
            organization_type=organization_data.get("organization_type"),
            organization_purpose=organization_data.get("organization_purpose"),
            traits=json.dumps(organization_data.get("traits", []), ensure_ascii=False) if organization_data.get("traits") else None
        )
        
        db.add(character)
        await db.flush()
        
        # ⭐ 立即提取信息
        character_id = character.id
        character_name = character.name
        
        organization = Organization(
            character_id=character_id,
            project_id=project_id,
            power_level=organization_data.get("power_level", 50),
            member_count=0,
            location=organization_data.get("location"),
            motto=organization_data.get("motto"),
            color=organization_data.get("color")
        )
        
        db.add(organization)
        await db.flush()
        
        organization_id = organization.id
        
        logger.info(f"    ✅ 创建组织记录: {character_name}, Organization ID: {organization_id}")
        
        return {
            "character_id": character_id,
            "character_name": character_name,
            "organization_id": organization_id
        }
    
    async def _create_member_relationships(
        self,
        organization_id: str,
        member_specs: List[Dict[str, Any]],
        project_id: str,
        db: AsyncSession
    ) -> List[Dict[str, Any]]:
        """
        创建组织成员关系
        
        ⭐ 返回信息字典列表而不是 ORM 对象列表
        """
        
        if not member_specs:
            return []
        
        members = []
        
        for member_spec in member_specs:
            try:
                character_name = member_spec.get("character_name")
                if not character_name:
                    continue
                
                # ⭐ 在方法内部重新查询角色
                target_char_result = await db.execute(
                    select(Character).where(
                        Character.project_id == project_id,
                        Character.name == character_name,
                        Character.is_organization == False
                    )
                )
                target_char = target_char_result.scalar_one_or_none()
                
                if not target_char:
                    logger.warning(f"    ⚠️ 目标角色不存在: {character_name}")
                    continue
                
                target_char_id = target_char.id
                
                # 检查成员关系是否已存在
                existing_member = await db.execute(
                    select(OrganizationMember).where(
                        OrganizationMember.organization_id == organization_id,
                        OrganizationMember.character_id == target_char_id
                    )
                )
                if existing_member.scalar_one_or_none():
                    logger.debug(f"    ℹ️ 成员关系已存在: {character_name} -> {organization_id}")
                    continue
                
                member = OrganizationMember(
                    organization_id=organization_id,
                    character_id=target_char_id,
                    position=member_spec.get("position", "成员"),
                    rank=member_spec.get("rank", 0),
                    loyalty=member_spec.get("loyalty", 50),
                    status=member_spec.get("status", "active"),
                    joined_at=member_spec.get("joined_at"),
                    source="auto"
                )
                
                db.add(member)
                await db.flush()
                
                # ⭐ 提取信息
                member_info = {
                    "member_id": member.id,
                    "organization_id": organization_id,
                    "character_id": target_char_id,
                    "character_name": character_name,
                    "position": member_spec.get("position", "成员")
                }
                members.append(member_info)
                
                logger.info(
                    f"    ✅ 创建成员关系: {character_name} -> {organization_id} "
                    f"({member_spec.get('position', '成员')})"
                )
                
            except Exception as e:
                logger.warning(f"    ❌ 创建成员关系失败: {e}")
                continue
        
        # ⭐ 更新组织成员数量
        if members:
            org_result = await db.execute(
                select(Organization).where(Organization.id == organization_id)
            )
            organization = org_result.scalar_one_or_none()
            if organization:
                organization.member_count = (organization.member_count or 0) + len(members)
        
        return members


# 全局实例缓存
_auto_organization_service_instance: Optional[AutoOrganizationService] = None


def get_auto_organization_service(ai_service: AIService) -> AutoOrganizationService:
    """获取自动组织服务实例（单例模式）"""
    global _auto_organization_service_instance
    if _auto_organization_service_instance is None:
        _auto_organization_service_instance = AutoOrganizationService(ai_service)
    return _auto_organization_service_instance
