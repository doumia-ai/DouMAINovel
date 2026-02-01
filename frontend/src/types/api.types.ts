// API 相关类型定义

/**
 * LinuxDO 授权 URL 响应
 */
export interface AuthUrlResponse {
  auth_url: string;
  state: string;
}

/**
 * 世界观构建响应
 */
export interface WorldBuildingResponse {
  project_id: string;
  time_period: string;
  location: string;
  atmosphere: string;
  rules: string;
}

/**
 * AI 生成大纲请求
 */
export interface GenerateOutlineRequest {
  project_id: string;
  genre?: string;
  theme: string;
  chapter_count: number;
  narrative_perspective: string;
  world_context?: Record<string, unknown>;
  characters_context?: import('./models.types.js').Character[];
  target_words?: number;
  requirements?: string;
  provider?: string;
  model?: string;
  // 续写功能新增字段
  mode?: 'auto' | 'new' | 'continue';
  story_direction?: string;
  plot_stage?: 'development' | 'climax' | 'ending';
  keep_existing?: boolean;
}

/**
 * AI 生成角色请求
 */
export interface GenerateCharacterRequest {
  project_id: string;
  name?: string;
  role_type?: string;
  background?: string;
  requirements?: string;
  provider?: string;
  model?: string;
}

/**
 * 文本润色请求
 */
export interface PolishTextRequest {
  text: string;
  style?: string;
}

/**
 * 生成角色响应
 */
export interface GenerateCharactersResponse {
  characters: import('./models.types.js').Character[];
}

/**
 * 生成大纲响应
 */
export interface GenerateOutlineResponse {
  outlines: import('./models.types.js').Outline[];
}

/**
 * 章节生成请求类型
 */
export interface ChapterGenerateRequest {
  style_id?: number;
  target_word_count?: number;
}

/**
 * 章节生成检查响应
 */
export interface ChapterCanGenerateResponse {
  can_generate: boolean;
  reason: string;
  previous_chapters: {
    id: string;
    chapter_number: number;
    title: string;
    has_content: boolean;
    word_count: number;
  }[];
  chapter_number: number;
}

/**
 * 大纲重排序请求项
 */
export interface OutlineReorderItem {
  id: string;
  order_index: number;
}

/**
 * 大纲重排序请求
 */
export interface OutlineReorderRequest {
  orders: OutlineReorderItem[];
}

/**
 * 章节规划项
 */
export interface ChapterPlanItem {
  sub_index: number;
  title: string;
  plot_summary: string;
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
  }>;
}

/**
 * 大纲展开请求
 */
export interface OutlineExpansionRequest {
  target_chapter_count: number;
  expansion_strategy?: 'balanced' | 'climax' | 'detail';
  auto_create_chapters?: boolean;
  provider?: string;
  model?: string;
}

/**
 * 大纲展开响应
 */
export interface OutlineExpansionResponse {
  outline_id: string;
  outline_title: string;
  target_chapter_count: number;
  actual_chapter_count: number;
  expansion_strategy: string;
  chapter_plans: ChapterPlanItem[];
  created_chapters?: Array<{
    id: string;
    chapter_number: number;
    title: string;
    summary: string;
    outline_id: string;
    sub_index: number;
    status: string;
  }> | null;
}

/**
 * 批量大纲展开请求
 */
export interface BatchOutlineExpansionRequest {
  project_id: string;
  outline_ids?: string[];
  chapters_per_outline: number;
  expansion_strategy?: 'balanced' | 'climax' | 'detail';
  auto_create_chapters?: boolean;
  provider?: string;
  model?: string;
}

/**
 * 批量大纲展开响应
 */
export interface BatchOutlineExpansionResponse {
  project_id: string;
  total_outlines_expanded: number;
  total_chapters_created: number;
  expansion_results: OutlineExpansionResponse[];
  skipped_outlines?: Array<{
    outline_id: string;
    outline_title: string;
    reason: string;
  }>;
}

/**
 * 手动触发分析响应
 */
export interface TriggerAnalysisResponse {
  task_id: string;
  chapter_id: string;
  status: string;
  message: string;
}

/**
 * MCP 工具
 */
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

/**
 * MCP 测试结果
 */
export interface MCPTestResult {
  success: boolean;
  message: string;
  tools?: MCPTool[];
  tools_count?: number;
  response_time_ms?: number;
  error?: string;
  error_type?: string;
  suggestions?: string[];
}

/**
 * MCP 工具调用请求
 */
export interface MCPToolCallRequest {
  plugin_id: string;
  tool_name: string;
  arguments: Record<string, unknown>;
}

/**
 * MCP 工具调用响应
 */
export interface MCPToolCallResponse {
  success: boolean;
  result?: unknown;
  error?: string;
}

/**
 * Key 池列表响应
 */
export interface KeyPoolListResponse {
  pools: import('./models.types.js').KeyPool[];
  total: number;
}

/**
 * Key 统计
 */
export interface KeyStats {
  key_preview: string;
  key_full: string;
  request_count: number;
  last_used?: string;
  error_count: number;
  is_disabled: boolean;
}

/**
 * Key 池统计响应
 */
export interface KeyPoolStatsResponse {
  pool_id: string;
  keys: KeyStats[];
  total_requests: number;
  active_keys: number;
  disabled_keys: number;
}

/**
 * Key 池测试结果
 */
export interface KeyPoolTestResult {
  pool_id: string;
  pool_name: string;
  results: Array<{
    key_preview: string;
    success: boolean;
    message: string;
    response_time_ms?: number;
  }>;
  success_count: number;
  total_count: number;
}

/**
 * API 配置预设列表响应
 */
export interface PresetListResponse {
  presets: import('./models.types.js').APIKeyPreset[];
  total: number;
  active_preset_id?: string;
}

/**
 * 写作风格列表响应
 */
export interface WritingStyleListResponse {
  styles: import('./models.types.js').WritingStyle[];
  total: number;
}

/**
 * 预设风格
 */
export interface PresetStyle {
  id: string;
  name: string;
  description: string;
  prompt_content: string;
}

/**
 * 伏笔统计
 */
export interface ForeshadowStats {
  total: number;
  pending: number;
  planted: number;
  resolved: number;
  partially_resolved: number;
  abandoned: number;
  long_term_count: number;
  overdue_count: number;
}

/**
 * 伏笔列表响应
 */
export interface ForeshadowListResponse {
  total: number;
  items: import('./models.types.js').Foreshadow[];
  stats?: ForeshadowStats;
}

/**
 * 埋入伏笔请求
 */
export interface PlantForeshadowRequest {
  chapter_id: string;
  chapter_number: number;
  hint_text?: string;
}

/**
 * 回收伏笔请求
 */
export interface ResolveForeshadowRequest {
  chapter_id: string;
  chapter_number: number;
  resolution_text?: string;
  is_partial?: boolean;
}

/**
 * 从分析同步伏笔请求
 */
export interface SyncFromAnalysisRequest {
  chapter_ids?: string[];
  overwrite_existing?: boolean;
  auto_set_planted?: boolean;
}

/**
 * 从分析同步伏笔响应
 */
export interface SyncFromAnalysisResponse {
  synced_count: number;
  skipped_count: number;
  new_foreshadows: import('./models.types.js').Foreshadow[];
  skipped_reasons: Array<{ source_memory_id: string; reason: string }>;
}

/**
 * 伏笔上下文响应
 */
export interface ForeshadowContextResponse {
  chapter_number: number;
  context_text: string;
  pending_plant: import('./models.types.js').Foreshadow[];
  pending_resolve: import('./models.types.js').Foreshadow[];
  overdue: import('./models.types.js').Foreshadow[];
  recently_planted: import('./models.types.js').Foreshadow[];
}

/**
 * 章节分析响应
 */
export interface ChapterAnalysisResponse {
  chapter_id: string;
  analysis: import('./models.types.js').AnalysisData;
  memories: import('./models.types.js').StoryMemory[];
  created_at: string;
}
