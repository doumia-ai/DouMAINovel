import { httpClient } from '../http.client.js';

/**
 * Inspiration API endpoints
 */
export const inspirationApi = {
  /**
   * Generate option suggestions
   */
  generateOptions: (data: {
    step: 'title' | 'description' | 'theme' | 'genre';
    context: {
      title?: string;
      description?: string;
      theme?: string;
    };
  }) =>
    httpClient.post<unknown, {
      prompt?: string;
      options: string[];
      error?: string;
    }>('/inspiration/generate-options', data),

  /**
   * Refine options based on user feedback
   */
  refineOptions: (data: {
    step: 'title' | 'description' | 'theme' | 'genre';
    context: {
      initial_idea?: string;
      title?: string;
      description?: string;
      theme?: string;
    };
    feedback: string;
    previous_options?: string[];
  }) =>
    httpClient.post<unknown, {
      prompt?: string;
      options: string[];
      error?: string;
    }>('/inspiration/refine-options', data),

  /**
   * Smart completion of missing information
   */
  quickGenerate: (data: {
    title?: string;
    description?: string;
    theme?: string;
    genre?: string | string[];
  }) =>
    httpClient.post<unknown, {
      title: string;
      description: string;
      theme: string;
      genre: string[];
      narrative_perspective: string;
    }>('/inspiration/quick-generate', data),
};
