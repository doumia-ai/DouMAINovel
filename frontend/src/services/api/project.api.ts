import axios from 'axios';

import type { Project, ProjectCreate, ProjectUpdate } from '../../types/index.js';

import { httpClient } from '../http.client.js';

/**
 * Project management API endpoints
 */
export const projectApi = {
  /**
   * Get all projects
   */
  getProjects: () => 
    httpClient.get<unknown, Project[]>('/projects'),

  /**
   * Get project by ID
   */
  getProject: (id: string) => 
    httpClient.get<unknown, Project>(`/projects/${id}`),

  /**
   * Create new project
   */
  createProject: (data: ProjectCreate) => 
    httpClient.post<unknown, Project>('/projects', data),

  /**
   * Update project
   */
  updateProject: (id: string, data: ProjectUpdate) =>
    httpClient.put<unknown, Project>(`/projects/${id}`, data),

  /**
   * Delete project
   */
  deleteProject: (id: string) => 
    httpClient.delete(`/projects/${id}`),

  /**
   * Export project (opens in new tab)
   */
  exportProject: (id: string) => {
    window.open(`/api/projects/${id}/export`, '_blank');
  },

  /**
   * Export project data as JSON
   */
  exportProjectData: async (id: string, options: { include_generation_history?: boolean; include_writing_styles?: boolean }) => {
    const response = await axios.post(
      `/api/projects/${id}/export-data`,
      options,
      {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Extract filename from response headers
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'project_export.json';
    if (contentDisposition) {
      const matches = /filename\*=UTF-8''(.+)/.exec(contentDisposition);
      if (matches && matches[1]) {
        filename = decodeURIComponent(matches[1]);
      }
    }

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Validate import file
   */
  validateImportFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient.post<unknown, {
      valid: boolean;
      version: string;
      project_name?: string;
      statistics: Record<string, number>;
      errors: string[];
      warnings: string[];
    }>('/projects/validate-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Import project from file
   */
  importProject: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient.post<unknown, {
      success: boolean;
      project_id?: string;
      message: string;
      statistics: Record<string, number>;
      warnings: string[];
    }>('/projects/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
