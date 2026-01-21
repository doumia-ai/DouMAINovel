import type {
  Outline,
  OutlineCreate,
  OutlineUpdate,
  OutlineReorderRequest,
  OutlineExpansionRequest,
  OutlineExpansionResponse,
  BatchOutlineExpansionRequest,
  BatchOutlineExpansionResponse,
  GenerateOutlineRequest,
  ChapterPlanItem,
} from '../../types/index.js';

import { httpClient } from '../http.client.js';

/**
 * Outline management API endpoints
 */
export const outlineApi = {
  /**
   * Get all outlines for a project
   */
  getOutlines: (projectId: string) =>
    httpClient.get<unknown, { total: number; items: Outline[] }>(`/outlines/project/${projectId}`).then(res => res.items),

  /**
   * Get outline by ID
   */
  getOutline: (id: string) => 
    httpClient.get<unknown, Outline>(`/outlines/${id}`),

  /**
   * Create new outline
   */
  createOutline: (data: OutlineCreate) => 
    httpClient.post<unknown, Outline>('/outlines', data),

  /**
   * Update outline
   */
  updateOutline: (id: string, data: OutlineUpdate) =>
    httpClient.put<unknown, Outline>(`/outlines/${id}`, data),

  /**
   * Delete outline
   */
  deleteOutline: (id: string) => 
    httpClient.delete(`/outlines/${id}`),

  /**
   * Reorder outlines
   */
  reorderOutlines: (data: OutlineReorderRequest) =>
    httpClient.post<unknown, { message: string; updated_outlines: number; updated_chapters: number }>('/outlines/reorder', data),

  /**
   * Generate outline using AI
   */
  generateOutline: (data: GenerateOutlineRequest) =>
    httpClient.post<unknown, { total: number; items: Outline[] }>('/outlines/generate', data).then(res => res.items),

  /**
   * Predict characters needed for continuation
   */
  predictCharacters: (data: {
    project_id: string;
    start_chapter: number;
    chapter_count: number;
    plot_stage: string;
    story_direction?: string;
    enable_mcp: boolean;
  }) =>
    httpClient.post<unknown, {
      needs_new_characters: boolean;
      reason: string;
      character_count: number;
      predicted_characters: Array<{
        name: string | null;
        role_description: string;
        suggested_role_type: string;
        importance: string;
        appearance_chapter: number;
        key_abilities: string[];
        plot_function: string;
        relationship_suggestions: Array<{
          target_character_name: string;
          relationship_type: string;
          description?: string;
        }>;
      }>;
    }>('/outlines/predict-characters', data),

  /**
   * Get chapters associated with an outline
   */
  getOutlineChapters: (outlineId: string) =>
    httpClient.get<unknown, {
      has_chapters: boolean;
      outline_id: string;
      outline_title: string;
      chapter_count: number;
      chapters: Array<{
        id: string;
        chapter_number: number;
        title: string;
        summary: string;
        sub_index: number;
        status: string;
        word_count: number;
      }>;
      expansion_plans: Array<{
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
        }> | null;
      }> | null;
    }>(`/outlines/${outlineId}/chapters`),

  /**
   * Expand single outline into multiple chapters
   */
  expandOutline: (outlineId: string, data: OutlineExpansionRequest) =>
    httpClient.post<unknown, OutlineExpansionResponse>(`/outlines/${outlineId}/expand`, data),

  /**
   * Create chapters from existing plans (avoid duplicate AI calls)
   */
  createChaptersFromPlans: (outlineId: string, chapterPlans: ChapterPlanItem[]) =>
    httpClient.post<unknown, {
      outline_id: string;
      outline_title: string;
      chapters_created: number;
      created_chapters: Array<{
        id: string;
        chapter_number: number;
        title: string;
        summary: string;
        outline_id: string;
        sub_index: number;
        status: string;
      }>;
    }>(`/outlines/${outlineId}/create-chapters-from-plans`, { chapter_plans: chapterPlans }),

  /**
   * Batch expand multiple outlines
   */
  batchExpandOutlines: (data: BatchOutlineExpansionRequest) =>
    httpClient.post<unknown, BatchOutlineExpansionResponse>('/outlines/batch-expand', data),
};
