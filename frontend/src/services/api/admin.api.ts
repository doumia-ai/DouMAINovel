import type { User } from '../../types/index.js';

import { httpClient } from '../http.client.js';

/**
 * Admin management API endpoints
 */
export const adminApi = {
  /**
   * Get all users
   */
  getUsers: () =>
    httpClient.get<unknown, { total: number; users: User[] }>('/admin/users'),

  /**
   * Create new user
   */
  createUser: (data: {
    username: string;
    display_name: string;
    password?: string;
    avatar_url?: string;
    trust_level?: number;
    is_admin?: boolean;
  }) =>
    httpClient.post<unknown, {
      success: boolean;
      message: string;
      user: User;
      default_password?: string;
    }>('/admin/users', data),

  /**
   * Update user
   */
  updateUser: (userId: string, data: {
    display_name?: string;
    avatar_url?: string;
    trust_level?: number;
  }) =>
    httpClient.put<unknown, {
      success: boolean;
      message: string;
      user: User;
    }>(`/admin/users/${userId}`, data),

  /**
   * Toggle user status (enable/disable)
   */
  toggleUserStatus: (userId: string, isActive: boolean) =>
    httpClient.post<unknown, {
      success: boolean;
      message: string;
      is_active: boolean;
    }>(`/admin/users/${userId}/toggle-status`, { is_active: isActive }),

  /**
   * Reset user password
   */
  resetPassword: (userId: string, newPassword?: string) =>
    httpClient.post<unknown, {
      success: boolean;
      message: string;
      new_password: string;
    }>(`/admin/users/${userId}/reset-password`, { new_password: newPassword }),

  /**
   * Delete user
   */
  deleteUser: (userId: string) =>
    httpClient.delete<unknown, {
      success: boolean;
      message: string;
    }>(`/admin/users/${userId}`),
};
