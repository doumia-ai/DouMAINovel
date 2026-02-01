// 数据模型类型定义

/**
 * 用户类型
 */
export interface User {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  trust_level: number;
  is_admin: boolean;
  linuxdo_id: string;
  created_at: string;
  last_login: string;
}

/**
 * 设置类型
 */
export interface Settings {
  id: string;
  user_id: string;
  api_provider: string;
  api_key: string;
  api_base_url: string;
  llm_model: string;
  temperature: number;
  max_tokens: number;
  system_prompt?: string;
  preferences?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 设置更新请求
 */
export interface SettingsUpdate {
  api_provider?: string;
  api_key?: string;
  api_base_url?: string;
  llm_model?: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  preferences?: string;
}

/**
 * API 密钥预设配置
 */
export interface APIKeyPresetConfig {
  api_provider: string;
  api_key: string;
  api_base_url?: string;
  llm_model: string;
  temperature: number;
  max_tokens: number;
  system_prompt?: string;
}

/**
 * API 密钥预设
 */
export interface APIKeyPreset {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  config: APIKeyPresetConfig;
}

/**
 * 预设创建请求
 */
export interface PresetCreateRequest {
  name: string;
  description?: string;
  config: APIKeyPresetConfig;
}

/**
 * 预设更新请求
 */
export interface PresetUpdateRequest {
  name?: string;
  description?: string;
  config?: APIKeyPresetConfig;
}

/**
 * 项目类型
 */
export interface Project {
  id: string;
  title: string;
  description?: string;
  theme?: string;
  genre?: string;
  target_words?: number;
  current_words: number;
  status: 'planning' | 'writing' | 'revising' | 'completed';
  wizard_status?: 'incomplete' | 'completed';
  wizard_step?: number;
  outline_mode: 'one-to-one' | 'one-to-many';
  world_time_period?: string;
  world_location?: string;
  world_atmosphere?: string;
  world_rules?: string;
  chapter_count?: number;
  narrative_perspective?: string;
  character_count?: number;
  created_at: string;
  updated_at: string;
}

/**
 * 项目创建请求
 */
export interface ProjectCreate {
  title: string;
  description?: string;
  theme?: string;
  genre?: string;
  target_words?: number;
  outline_mode?: 'one-to-one' | 'one-to-many';
  wizard_status?: 'incomplete' | 'completed';
  wizard_step?: number;
  world_time_period?: string;
  world_location?: string;
  world_atmosphere?: string;
  world_rules?: string;
}

/**
 * 项目更新请求
 */
export interface ProjectUpdate {
  title?: string;
  description?: string;
  theme?: string;
  genre?: string;
  target_words?: number;
  status?: 'planning' | 'writing' | 'revising' | 'completed';
  world_time_period?: string;
  world_location?: string;
  world_atmosphere?: string;
  world_rules?: string;
  chapter_count?: number;
  narrative_perspective?: string;
  character_count?: number;
}

/**
 * 项目向导更新请求
 */
export interface ProjectWizardUpdate extends ProjectUpdate {
  wizard_status?: 'incomplete' | 'completed';
  wizard_step?: number;
}

/**
 * 项目创建向导请求
 */
export interface ProjectWizardRequest {
  title: string;
  theme: string;
  genre?: string;
  chapter_count: number;
  narrative_perspective: string;
  character_count?: number;
  target_words?: number;
  outline_mode?: 'one-to-one' | 'one-to-many';
  world_building?: {
    time_period: string;
    location: string;
    atmosphere: string;
    rules: string;
  };
}

/**
 * 大纲类型
 */
export interface Outline {
  id: string;
  project_id: string;
  title: string;
  content: string;
  structure?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

/**
 * 大纲创建请求
 */
export interface OutlineCreate {
  project_id: string;
  title: string;
  content: string;
  structure?: string;
  order_index: number;
}

/**
 * 大纲更新请求
 */
export interface OutlineUpdate {
  title?: string;
  content?: string;
}

/**
 * 角色类型
 */
export interface Character {
  id: string;
  project_id: string;
  name: string;
  age?: string;
  gender?: string;
  is_organization: boolean;
  role_type?: string;
  personality?: string;
  background?: string;
  appearance?: string;
  relationships?: string;
  organization_type?: string;
  organization_purpose?: string;
  organization_members?: string;
  traits?: string;
  avatar_url?: string;
  power_level?: number;
  location?: string;
  motto?: string;
  color?: string;
  main_career_id?: string;
  main_career_stage?: number;
  sub_careers?: Array<{
    career_id: string;
    stage: number;
  }>;
  created_at: string;
  updated_at: string;
}

/**
 * 角色更新请求
 */
export interface CharacterUpdate {
  name?: string;
  age?: string;
  gender?: string;
  is_organization?: boolean;
  role_type?: string;
  personality?: string;
  background?: string;
  appearance?: string;
  relationships?: string;
  organization_type?: string;
  organization_purpose?: string;
  organization_members?: string;
  traits?: string;
  power_level?: number;
  location?: string;
  motto?: string;
  color?: string;
}

/**
 * 展开规划数据结构
 */
export interface ExpansionPlanData {
  key_events: string[];
  character_focus: string[];
  emotional_tone: string;
  narrative_goal: string;
  conflict_type: string;
  estimated_words: number;
  scenes?: Array<{
    location: string;
    characters: string[];
    purpose: string;
  }> | null;
}

/**
 * 章节类型
 */
export interface Chapter {
  id: string;
  project_id: string;
  title: string;
  content?: string;
  summary?: string;
  chapter_number: number;
  word_count: number;
  status: 'draft' | 'writing' | 'completed';
  expansion_plan?: string;
  outline_id?: string;
  sub_index?: number;
  outline_title?: string;
  outline_order?: number;
  created_at: string;
  updated_at: string;
}

/**
 * 章节创建请求
 */
export interface ChapterCreate {
  project_id: string;
  title: string;
  chapter_number: number;
  content?: string;
  summary?: string;
  status?: 'draft' | 'writing' | 'completed';
}

/**
 * 章节更新请求
 */
export interface ChapterUpdate {
  title?: string;
  content?: string;
  summary?: string;
  status?: 'draft' | 'writing' | 'completed';
}

/**
 * 写作风格类型
 */
export interface WritingStyle {
  id: number;
  user_id: string | null;
  name: string;
  style_type: 'preset' | 'custom';
  preset_id?: string;
  description?: string;
  prompt_content: string;
  is_default: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

/**
 * 写作风格创建请求
 */
export interface WritingStyleCreate {
  name: string;
  style_type?: 'preset' | 'custom';
  preset_id?: string;
  description?: string;
  prompt_content: string;
}

/**
 * 写作风格更新请求
 */
export interface WritingStyleUpdate {
  name?: string;
  description?: string;
  prompt_content?: string;
  order_index?: number;
}

/**
 * 向导表单数据类型
 */
export interface WizardBasicInfo {
  title: string;
  description: string;
  theme: string;
  genre: string | string[];
  chapter_count: number;
  narrative_perspective: string;
  character_count?: number;
  target_words?: number;
  outline_mode?: 'one-to-one' | 'one-to-many';
}

/**
 * 章节分析任务
 */
export interface AnalysisTask {
  has_task: boolean;
  task_id: string | null;
  chapter_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'none';
  progress: number;
  error_message?: string | null;
  auto_recovered?: boolean;
  created_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

/**
 * 分析结果 - 钩子
 */
export interface AnalysisHook {
  type: string;
  content: string;
  strength: number;
  position: string;
}

/**
 * 分析结果 - 伏笔
 */
export interface AnalysisForeshadow {
  content: string;
  type: 'planted' | 'resolved';
  strength: number;
  subtlety: number;
  reference_chapter?: number;
}

/**
 * 分析结果 - 冲突
 */
export interface AnalysisConflict {
  types: string[];
  parties: string[];
  level: number;
  description: string;
  resolution_progress: number;
}

/**
 * 分析结果 - 情感曲线
 */
export interface AnalysisEmotionalArc {
  primary_emotion: string;
  intensity: number;
  curve: string;
  secondary_emotions: string[];
}

/**
 * 分析结果 - 角色状态
 */
export interface AnalysisCharacterState {
  character_name: string;
  state_before: string;
  state_after: string;
  psychological_change: string;
  key_event: string;
  relationship_changes: Record<string, string>;
}

/**
 * 分析结果 - 情节点
 */
export interface AnalysisPlotPoint {
  content: string;
  type: 'revelation' | 'conflict' | 'resolution' | 'transition';
  importance: number;
  impact: string;
}

/**
 * 分析结果 - 场景
 */
export interface AnalysisScene {
  location: string;
  atmosphere: string;
  duration: string;
}

/**
 * 分析结果 - 评分
 */
export interface AnalysisScores {
  pacing: number;
  engagement: number;
  coherence: number;
  overall: number;
}

/**
 * 完整分析数据
 */
export interface AnalysisData {
  id: string;
  chapter_id: string;
  plot_stage: string;
  conflict_level: number;
  conflict_types: string[];
  emotional_tone: string;
  emotional_intensity: number;
  hooks: AnalysisHook[];
  hooks_count: number;
  foreshadows: AnalysisForeshadow[];
  foreshadows_planted: number;
  foreshadows_resolved: number;
  plot_points: AnalysisPlotPoint[];
  plot_points_count: number;
  character_states: AnalysisCharacterState[];
  scenes?: AnalysisScene[];
  pacing: string;
  overall_quality_score: number;
  pacing_score: number;
  engagement_score: number;
  coherence_score: number;
  analysis_report: string;
  suggestions: string[];
  dialogue_ratio: number;
  description_ratio: number;
  created_at: string;
}

/**
 * 记忆片段
 */
export interface StoryMemory {
  id: string;
  type: 'hook' | 'foreshadow' | 'plot_point' | 'character_event';
  title: string;
  content: string;
  importance: number;
  tags: string[];
  is_foreshadow: 0 | 1 | 2;
}

/**
 * MCP 插件类型
 */
export interface MCPPlugin {
  id: string;
  plugin_name: string;
  display_name: string;
  description?: string;
  plugin_type: 'http' | 'stdio' | 'streamable_http' | 'sse';
  category: string;
  server_url?: string;
  headers?: Record<string, string>;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  enabled: boolean;
  status: 'active' | 'inactive' | 'error';
  last_error?: string;
  last_test_at?: string;
  created_at: string;
}

/**
 * MCP 插件创建请求
 */
export interface MCPPluginCreate {
  plugin_name: string;
  display_name?: string;
  description?: string;
  server_type: 'http' | 'stdio' | 'streamable_http' | 'sse';
  server_url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  headers?: Record<string, string>;
  enabled?: boolean;
}

/**
 * MCP 插件更新请求
 */
export interface MCPPluginUpdate {
  display_name?: string;
  description?: string;
  server_url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  headers?: Record<string, string>;
  enabled?: boolean;
}

/**
 * Key 池
 */
export interface KeyPool {
  id: string;
  name: string;
  provider: string;
  base_url: string;
  model: string;
  keys: string[];
  keys_preview: string[];
  key_count: number;
  enabled: boolean;
  created_at?: string;
  total_requests: number;
}

/**
 * Key 池创建请求
 */
export interface KeyPoolCreateRequest {
  name: string;
  provider: string;
  base_url: string;
  model: string;
  keys: string[];
  enabled?: boolean;
}

/**
 * Key 池更新请求
 */
export interface KeyPoolUpdateRequest {
  name?: string;
  keys?: string[];
  enabled?: boolean;
}

/**
 * 伏笔状态类型
 */
export type ForeshadowStatus = 'pending' | 'planted' | 'resolved' | 'partially_resolved' | 'abandoned';

/**
 * 伏笔来源类型
 */
export type ForeshadowSourceType = 'analysis' | 'manual';

/**
 * 伏笔分类
 */
export type ForeshadowCategory = 'identity' | 'mystery' | 'item' | 'relationship' | 'event' | 'ability' | 'prophecy';

/**
 * 伏笔类型
 */
export interface Foreshadow {
  id: string;
  project_id: string;
  title: string;
  content: string;
  hint_text?: string;
  resolution_text?: string;
  source_type?: ForeshadowSourceType;
  source_memory_id?: string;
  source_analysis_id?: string;
  plant_chapter_id?: string;
  plant_chapter_number?: number;
  target_resolve_chapter_id?: string;
  target_resolve_chapter_number?: number;
  actual_resolve_chapter_id?: string;
  actual_resolve_chapter_number?: number;
  status: ForeshadowStatus;
  is_long_term: boolean;
  importance: number;
  strength: number;
  subtlety: number;
  urgency: number;
  related_characters?: string[];
  related_foreshadow_ids?: string[];
  tags?: string[];
  category?: ForeshadowCategory;
  notes?: string;
  resolution_notes?: string;
  auto_remind: boolean;
  remind_before_chapters: number;
  include_in_context: boolean;
  created_at?: string;
  updated_at?: string;
  planted_at?: string;
  resolved_at?: string;
}

/**
 * 伏笔创建请求
 */
export interface ForeshadowCreate {
  project_id: string;
  title: string;
  content: string;
  hint_text?: string;
  resolution_text?: string;
  plant_chapter_number?: number;
  target_resolve_chapter_number?: number;
  is_long_term?: boolean;
  importance?: number;
  strength?: number;
  subtlety?: number;
  related_characters?: string[];
  tags?: string[];
  category?: ForeshadowCategory;
  notes?: string;
  resolution_notes?: string;
  auto_remind?: boolean;
  remind_before_chapters?: number;
  include_in_context?: boolean;
}

/**
 * 伏笔更新请求
 */
export interface ForeshadowUpdate {
  title?: string;
  content?: string;
  hint_text?: string;
  resolution_text?: string;
  plant_chapter_number?: number;
  target_resolve_chapter_number?: number;
  status?: ForeshadowStatus;
  is_long_term?: boolean;
  importance?: number;
  strength?: number;
  subtlety?: number;
  urgency?: number;
  related_characters?: string[];
  related_foreshadow_ids?: string[];
  tags?: string[];
  category?: ForeshadowCategory;
  notes?: string;
  resolution_notes?: string;
  auto_remind?: boolean;
  remind_before_chapters?: number;
  include_in_context?: boolean;
}

/**
 * 类型管理 - Genre
 */
export interface Genre {
  id: string;
  name: string;
  is_builtin: boolean;
  description?: string;
  world_building_guide?: string;
  character_guide?: string;
  plot_guide?: string;
  writing_style_guide?: string;
  example_works?: string;
  keywords?: string[];
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Genre 创建请求
 */
export interface GenreCreate {
  name: string;
  description?: string;
  world_building_guide?: string;
  character_guide?: string;
  plot_guide?: string;
  writing_style_guide?: string;
  example_works?: string;
  keywords?: string[];
}

/**
 * Genre 更新请求
 */
export interface GenreUpdate {
  name?: string;
  description?: string;
  world_building_guide?: string;
  character_guide?: string;
  plot_guide?: string;
  writing_style_guide?: string;
  example_works?: string;
  keywords?: string[];
}

/**
 * Genre 列表响应
 */
export interface GenreListResponse {
  genres: Genre[];
  total: number;
}
