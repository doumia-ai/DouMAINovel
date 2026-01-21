import type {
  Foreshadow,
  ForeshadowCreate,
  ForeshadowUpdate,
  ForeshadowListResponse,
  ForeshadowStats,
  ForeshadowContextResponse,
  PlantForeshadowRequest,
  ResolveForeshadowRequest,
  SyncFromAnalysisRequest,
  SyncFromAnalysisResponse,
} from '../../types/index.js';

import { httpClient } from '../http.client.js';

/**
 * Foreshadow management API endpoints
 */
export const foreshadowApi = {
  /**
   * Get all foreshadows for a project
   */
  getProjectForeshadows: (projectId: string, params?: {
    status?: string;
    category?: string;
    is_long_term?: boolean;
    source_type?: string;
    sort_by?: string;
    page?: number;
    limit?: number;
  }) =>
    httpClient.get<unknown, ForeshadowListResponse>(
      `/foreshadows/projects/${projectId}`,
      { params }
    ),

  /**
   * Get foreshadow statistics
   */
  getForeshadowStats: (projectId: string, currentChapter?: number) =>
    httpClient.get<unknown, ForeshadowStats>(
      `/foreshadows/projects/${projectId}/stats`,
      { params: { current_chapter: currentChapter } }
    ),

  /**
   * Get chapter foreshadow context
   */
  getChapterContext: (projectId: string, chapterNumber: number, params?: {
    include_pending?: boolean;
    include_overdue?: boolean;
    lookahead?: number;
  }) =>
    httpClient.get<unknown, ForeshadowContextResponse>(
      `/foreshadows/projects/${projectId}/context/${chapterNumber}`,
      { params }
    ),

  /**
   * Get pending resolve foreshadows
   */
  getPendingResolveForeshadows: (projectId: string, currentChapter: number, lookahead?: number) =>
    httpClient.get<unknown, { total: number; items: Foreshadow[] }>(
      `/foreshadows/projects/${projectId}/pending-resolve`,
      { params: { current_chapter: currentChapter, lookahead } }
    ),

  /**
   * Get single foreshadow
   */
  getForeshadow: (foreshadowId: string) =>
    httpClient.get<unknown, Foreshadow>(`/foreshadows/${foreshadowId}`),

  /**
   * Create foreshadow
   */
  createForeshadow: (data: ForeshadowCreate) =>
    httpClient.post<unknown, Foreshadow>('/foreshadows', data),

  /**
   * Update foreshadow
   */
  updateForeshadow: (foreshadowId: string, data: ForeshadowUpdate) =>
    httpClient.put<unknown, Foreshadow>(`/foreshadows/${foreshadowId}`, data),

  /**
   * Delete foreshadow
   */
  deleteForeshadow: (foreshadowId: string) =>
    httpClient.delete<unknown, { message: string; id: string }>(`/foreshadows/${foreshadowId}`),

  /**
   * Mark foreshadow as planted
   */
  plantForeshadow: (foreshadowId: string, data: PlantForeshadowRequest) =>
    httpClient.post<unknown, Foreshadow>(`/foreshadows/${foreshadowId}/plant`, data),

  /**
   * Mark foreshadow as resolved
   */
  resolveForeshadow: (foreshadowId: string, data: ResolveForeshadowRequest) =>
    httpClient.post<unknown, Foreshadow>(`/foreshadows/${foreshadowId}/resolve`, data),

  /**
   * Mark foreshadow as abandoned
   */
  abandonForeshadow: (foreshadowId: string, reason?: string) =>
    httpClient.post<unknown, Foreshadow>(
      `/foreshadows/${foreshadowId}/abandon`,
      null,
      { params: { reason } }
    ),

  /**
   * Sync foreshadows from analysis results
   */
  syncFromAnalysis: (projectId: string, data: SyncFromAnalysisRequest) =>
    httpClient.post<unknown, SyncFromAnalysisResponse>(
      `/foreshadows/projects/${projectId}/sync-from-analysis`,
      data
    ),
};
