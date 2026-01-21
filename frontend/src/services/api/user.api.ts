import type { User } from '../../types/index.js';

import { httpClient } from '../http.client.js';

/**
 * User management API endpoints
 */
export const userApi = {
  /**
   * Get current user
   */
  getCurrentUser: () => 
    httpClient.get<unknown, User>('/users/current'),

  /**
   * List all users
   */
  listUsers: () => 
    httpClient.get<unknown, User[]>('/users'),

  /**
   * Set admin status for a user
   */
  setAdmin: (userId: string, isAdmin: boolean) =>
    httpClient.post('/users/set-admin', { user_id: userId, is_admin: isAdmin }),

  /**
   * Delete a user
   */
  deleteUser: (userId: string) => 
    httpClient.delete(`/users/${userId}`),

  /**
   * Get user by ID
   */
  getUser: (userId: string) => 
    httpClient.get<unknown, User>(`/users/${userId}`),

  /**
   * Reset user password
   */
  resetPassword: (userId: string, newPassword?: string) =>
    httpClient.post<unknown, {
      message: string;
      user_id: string;
      username: string;
      default_password?: string;
    }>('/users/reset-password', { user_id: userId, new_password: newPassword }),
};
