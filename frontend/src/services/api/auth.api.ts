import type { User, AuthUrlResponse } from '../../types/index.js';

import { httpClient } from '../http.client.js';

/**
 * Authentication API endpoints
 */
export const authApi = {
  /**
   * Get authentication configuration
   */
  getAuthConfig: () => 
    httpClient.get<unknown, { local_auth_enabled: boolean; linuxdo_enabled: boolean }>('/auth/config'),

  /**
   * Local login with username and password
   */
  localLogin: (username: string, password: string) =>
    httpClient.post<unknown, { success: boolean; message: string; user: User }>('/auth/local/login', { username, password }),

  /**
   * Bind account login
   */
  bindAccountLogin: (username: string, password: string) =>
    httpClient.post<unknown, { success: boolean; message: string; user: User }>('/auth/bind/login', { username, password }),

  /**
   * Get LinuxDO OAuth URL
   */
  getLinuxDOAuthUrl: () => 
    httpClient.get<unknown, AuthUrlResponse>('/auth/linuxdo/url'),

  /**
   * Get current authenticated user
   */
  getCurrentUser: () => 
    httpClient.get<unknown, User>('/auth/user'),

  /**
   * Get password status
   */
  getPasswordStatus: () => 
    httpClient.get<unknown, {
      has_password: boolean;
      has_custom_password: boolean;
      username: string | null;
      default_password: string | null;
    }>('/auth/password/status'),

  /**
   * Set user password
   */
  setPassword: (password: string) =>
    httpClient.post<unknown, { success: boolean; message: string }>('/auth/password/set', { password }),

  /**
   * Initialize user password
   */
  initializePassword: (password: string) =>
    httpClient.post<unknown, { success: boolean; message: string }>('/auth/password/initialize', { password }),

  /**
   * Refresh session
   */
  refreshSession: () => 
    httpClient.post<unknown, { message: string; expire_at: number; remaining_minutes: number }>('/auth/refresh'),

  /**
   * Logout current user
   */
  logout: () => 
    httpClient.post('/auth/logout'),
};
