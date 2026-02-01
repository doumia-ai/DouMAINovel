import type { Chapter, ChapterCreate, ChapterUpdate } from '../../types/index.js';

import { httpClient } from '../http.client.js';

/**
 * Chapter management API endpoints
 */
export const chapterApi = {
  /**
   * Get all chapters for a project
   */
  getChapters: (projectId: string) =>
    httpClient.get<unknown, Chapter[]>(`/chapters/project/${projectId}`),

  /**
   * Get chapter by ID
   */
  getChapter: (id: string) => 
    httpClient.get<unknown, Chapter>(`/chapters/${id}`),

  /**
   * Create new chapter
   */
  createChapter: (data: ChapterCreate) => 
    httpClient.post<unknown, Chapter>('/chapters', data),

  /**
   * Update chapter
   */
  updateChapter: (id: string, data: ChapterUpdate) =>
    httpClient.put<unknown, Chapter>(`/chapters/${id}`, data),

  /**
   * Delete chapter
   */
  deleteChapter: (id: string) => 
    httpClient.delete(`/chapters/${id}`),

  /**
   * Check if chapter can be generated
   */
  checkCanGenerate: (chapterId: string) =>
    httpClient.get<unknown, import('../../types/index.js').ChapterCanGenerateResponse>(`/chapters/${chapterId}/can-generate`),

  /**
   * Get regeneration tasks for a chapter
   */
  getRegenerationTasks: (chapterId: string, limit?: number) =>
    httpClient.get<unknown, {
      chapter_id: string;
      total: number;
      tasks: Array<{
        task_id: string;
        status: string;
        version_number: number | null;
        version_note: string | null;
        original_word_count: number | null;
        regenerated_word_count: number | null;
        created_at: string | null;
        completed_at: string | null;
      }>;
    }>(`/chapters/${chapterId}/regeneration/tasks`, { params: { limit } }),
};
