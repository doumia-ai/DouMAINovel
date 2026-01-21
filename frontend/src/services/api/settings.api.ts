import type {
  Settings,
  SettingsUpdate,
  APIKeyPreset,
  PresetCreateRequest,
  PresetUpdateRequest,
  PresetListResponse,
  KeyPool,
  KeyPoolCreateRequest,
  KeyPoolUpdateRequest,
  KeyPoolListResponse,
  KeyPoolStatsResponse,
  KeyPoolTestResult,
} from '../../types/index.js';

import { httpClient } from '../http.client.js';

/**
 * Settings management API endpoints
 */
export const settingsApi = {
  /**
   * Get user settings
   */
  getSettings: () => 
    httpClient.get<unknown, Settings>('/settings'),

  /**
   * Save settings
   */
  saveSettings: (data: SettingsUpdate) =>
    httpClient.post<unknown, Settings>('/settings', data),

  /**
   * Update settings
   */
  updateSettings: (data: SettingsUpdate) =>
    httpClient.put<unknown, Settings>('/settings', data),

  /**
   * Delete settings
   */
  deleteSettings: () => 
    httpClient.delete<unknown, { message: string; user_id: string }>('/settings'),

  /**
   * Get available models for a provider
   */
  getAvailableModels: (params: { api_key: string; api_base_url: string; provider: string }) =>
    httpClient.get<unknown, { provider: string; models: Array<{ value: string; label: string; description: string }>; count?: number }>('/settings/models', { params }),

  /**
   * Test API connection
   */
  testApiConnection: (params: { api_key: string; api_base_url: string; provider: string; llm_model: string }) =>
    httpClient.post<unknown, {
      success: boolean;
      message: string;
      response_time_ms?: number;
      provider?: string;
      model?: string;
      response_preview?: string;
      details?: Record<string, boolean>;
      error?: string;
      error_type?: string;
      suggestions?: string[];
    }>('/settings/test', params),

  /**
   * Check function calling support
   */
  checkFunctionCalling: (params: { api_key: string; api_base_url: string; provider: string; llm_model: string }) =>
    httpClient.post<unknown, {
      success: boolean;
      supported: boolean;
      message: string;
      response_time_ms?: number;
      provider?: string;
      model?: string;
      details?: {
        finish_reason?: string;
        has_tool_calls?: boolean;
        tool_call_count?: number;
        test_tool?: string;
        test_prompt?: string;
        response_type?: string;
      };
      tool_calls?: Array<{
        id?: string;
        type?: string;
        function?: {
          name: string;
          arguments: string;
        };
      }>;
      response_preview?: string;
      error?: string;
      error_type?: string;
      suggestions?: string[];
    }>('/settings/check-function-calling', params),

  // API configuration preset management
  
  /**
   * Get all presets
   */
  getPresets: () =>
    httpClient.get<unknown, PresetListResponse>('/settings/presets'),

  /**
   * Create new preset
   */
  createPreset: (data: PresetCreateRequest) =>
    httpClient.post<unknown, APIKeyPreset>('/settings/presets', data),

  /**
   * Update preset
   */
  updatePreset: (presetId: string, data: PresetUpdateRequest) =>
    httpClient.put<unknown, APIKeyPreset>(`/settings/presets/${presetId}`, data),

  /**
   * Delete preset
   */
  deletePreset: (presetId: string) =>
    httpClient.delete<unknown, { message: string; preset_id: string }>(`/settings/presets/${presetId}`),

  /**
   * Activate preset
   */
  activatePreset: (presetId: string) =>
    httpClient.post<unknown, { message: string; preset_id: string; preset_name: string }>(`/settings/presets/${presetId}/activate`),

  /**
   * Test preset connection
   */
  testPreset: (presetId: string) =>
    httpClient.post<unknown, {
      success: boolean;
      message: string;
      response_time_ms?: number;
      provider?: string;
      model?: string;
      response_preview?: string;
      details?: Record<string, boolean>;
      error?: string;
      error_type?: string;
      suggestions?: string[];
    }>(`/settings/presets/${presetId}/test`),

  /**
   * Create preset from current settings
   */
  createPresetFromCurrent: (name: string, description?: string) =>
    httpClient.post<unknown, APIKeyPreset>('/settings/presets/from-current', null, {
      params: { name, description }
    }),

  // Key pool management
  
  /**
   * Get all key pools
   */
  getKeyPools: () =>
    httpClient.get<unknown, KeyPoolListResponse>('/settings/key-pools'),

  /**
   * Create new key pool
   */
  createKeyPool: (data: KeyPoolCreateRequest) =>
    httpClient.post<unknown, KeyPool>('/settings/key-pools', data),

  /**
   * Get key pool by ID
   */
  getKeyPool: (poolId: string) =>
    httpClient.get<unknown, KeyPool>(`/settings/key-pools/${poolId}`),

  /**
   * Update key pool
   */
  updateKeyPool: (poolId: string, data: KeyPoolUpdateRequest) =>
    httpClient.put<unknown, KeyPool>(`/settings/key-pools/${poolId}`, data),

  /**
   * Delete key pool
   */
  deleteKeyPool: (poolId: string) =>
    httpClient.delete<unknown, { message: string; pool_id: string }>(`/settings/key-pools/${poolId}`),

  /**
   * Get key pool statistics
   */
  getKeyPoolStats: (poolId: string) =>
    httpClient.get<unknown, KeyPoolStatsResponse>(`/settings/key-pools/${poolId}/stats`),

  /**
   * Reset key status in pool
   */
  resetKeyStatus: (poolId: string, key: string) =>
    httpClient.post<unknown, { message: string; key_preview: string }>(`/settings/key-pools/${poolId}/reset-key`, null, {
      params: { key }
    }),

  /**
   * Test key pool
   */
  testKeyPool: (poolId: string) =>
    httpClient.post<unknown, KeyPoolTestResult>(`/settings/key-pools/${poolId}/test`),
};
