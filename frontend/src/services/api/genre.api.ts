import type { Genre, GenreCreate, GenreUpdate, GenreListResponse } from '../../types/index.js';

import { httpClient } from '../http.client.js';

/**
 * Genre management API endpoints
 */
export const genreApi = {
  /**
   * Get all genres
   */
  getGenres: (includeBuiltin: boolean = true) =>
    httpClient.get<unknown, GenreListResponse>('/genres', { params: { include_builtin: includeBuiltin } }),

  /**
   * Get genre by ID
   */
  getGenre: (id: string) =>
    httpClient.get<unknown, Genre>(`/genres/${id}`),

  /**
   * Get genre by name
   */
  getGenreByName: (name: string) =>
    httpClient.get<unknown, Genre>(`/genres/by-name/${encodeURIComponent(name)}`),

  /**
   * Create new genre
   */
  createGenre: (data: GenreCreate) =>
    httpClient.post<unknown, Genre>('/genres', data),

  /**
   * Update genre
   */
  updateGenre: (id: string, data: GenreUpdate) =>
    httpClient.put<unknown, Genre>(`/genres/${id}`, data),

  /**
   * Delete genre
   */
  deleteGenre: (id: string) =>
    httpClient.delete<unknown, { success: boolean; message: string }>(`/genres/${id}`),
};
