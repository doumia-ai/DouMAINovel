import axios from 'axios';

import type { Character, CharacterUpdate, GenerateCharacterRequest } from '../../types/index.js';

import { httpClient } from '../http.client.js';

/**
 * Character management API endpoints
 */
export const characterApi = {
  /**
   * Get all characters for a project
   */
  getCharacters: (projectId: string) =>
    httpClient.get<unknown, Character[]>(`/characters/project/${projectId}`),

  /**
   * Get character by ID
   */
  getCharacter: (id: string) => 
    httpClient.get<unknown, Character>(`/characters/${id}`),

  /**
   * Create new character
   */
  createCharacter: (data: {
    project_id: string;
    name: string;
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
    avatar_url?: string;
    power_level?: number;
    location?: string;
    motto?: string;
    color?: string;
  }) =>
    httpClient.post<unknown, Character>('/characters', data),

  /**
   * Update character
   */
  updateCharacter: (id: string, data: CharacterUpdate) =>
    httpClient.put<unknown, Character>(`/characters/${id}`, data),

  /**
   * Delete character
   */
  deleteCharacter: (id: string) => 
    httpClient.delete(`/characters/${id}`),

  /**
   * Generate character using AI
   */
  generateCharacter: (data: GenerateCharacterRequest) =>
    httpClient.post<unknown, Character>('/characters/generate', data),

  /**
   * Export characters to file
   */
  exportCharacters: async (characterIds: string[]) => {
    const response = await axios.post(
      '/api/characters/export',
      { character_ids: characterIds },
      {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Extract filename from response headers
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'characters_export.json';
    if (contentDisposition) {
      const matches = /filename=(.+)/.exec(contentDisposition);
      if (matches && matches[1]) {
        filename = matches[1];
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
   * Validate character import file
   */
  validateImportCharacters: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient.post<unknown, {
      valid: boolean;
      version: string;
      statistics: { characters: number; organizations: number };
      errors: string[];
      warnings: string[];
    }>('/characters/validate-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Import characters from file
   */
  importCharacters: (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient.post<unknown, {
      success: boolean;
      message: string;
      statistics: {
        total: number;
        imported: number;
        skipped: number;
        errors: number;
      };
      details: {
        imported_characters: string[];
        imported_organizations: string[];
        skipped: string[];
        errors: string[];
      };
      warnings: string[];
    }>(`/characters/import?project_id=${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
