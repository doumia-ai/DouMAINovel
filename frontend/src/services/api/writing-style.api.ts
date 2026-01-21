import type {
  WritingStyle,
  WritingStyleCreate,
  WritingStyleUpdate,
  PresetStyle,
  WritingStyleListResponse,
} from '../../types/index.js';

import { httpClient } from '../http.client.js';

/**
 * Writing style management API endpoints
 */
export const writingStyleApi = {
  /**
   * Get preset writing styles
   */
  getPresetStyles: () =>
    httpClient.get<unknown, PresetStyle[]>('/writing-styles/presets/list'),

  /**
   * Get all user writing styles
   */
  getUserStyles: () =>
    httpClient.get<unknown, WritingStyleListResponse>('/writing-styles/user'),

  /**
   * Get all writing styles for a project (backward compatibility)
   */
  getProjectStyles: (projectId: string) =>
    httpClient.get<unknown, WritingStyleListResponse>(`/writing-styles/project/${projectId}`),

  /**
   * Create new writing style (based on preset or custom)
   */
  createStyle: (data: WritingStyleCreate) =>
    httpClient.post<unknown, WritingStyle>('/writing-styles', data),

  /**
   * Update writing style
   */
  updateStyle: (styleId: number, data: WritingStyleUpdate) =>
    httpClient.put<unknown, WritingStyle>(`/writing-styles/${styleId}`, data),

  /**
   * Delete writing style
   */
  deleteStyle: (styleId: number) =>
    httpClient.delete<unknown, { message: string }>(`/writing-styles/${styleId}`),

  /**
   * Set default writing style for a project
   */
  setDefaultStyle: (styleId: number, projectId: string) =>
    httpClient.post<unknown, WritingStyle>(`/writing-styles/${styleId}/set-default`, { project_id: projectId }),

  /**
   * Initialize default writing styles for a project (if none exist)
   */
  initializeDefaultStyles: (projectId: string) =>
    httpClient.post<unknown, WritingStyleListResponse>(`/writing-styles/project/${projectId}/initialize`, {}),
};
