import type {
  MCPPlugin,
  MCPPluginCreate,
  MCPPluginUpdate,
  MCPTestResult,
  MCPTool,
  MCPToolCallRequest,
  MCPToolCallResponse,
} from '../../types/index.js';

import { httpClient } from '../http.client.js';

/**
 * MCP plugin simple create interface
 */
interface MCPPluginSimpleCreate {
  config_json: string;
  enabled: boolean;
}

/**
 * MCP plugin management API endpoints
 */
export const mcpPluginApi = {
  /**
   * Get all plugins
   */
  getPlugins: () =>
    httpClient.get<unknown, MCPPlugin[]>('/mcp/plugins'),

  /**
   * Get single plugin
   */
  getPlugin: (id: string) =>
    httpClient.get<unknown, MCPPlugin>(`/mcp/plugins/${id}`),

  /**
   * Create plugin
   */
  createPlugin: (data: MCPPluginCreate) =>
    httpClient.post<unknown, MCPPlugin>('/mcp/plugins', data),

  /**
   * Create plugin with simplified configuration (standard MCP config JSON)
   */
  createPluginSimple: (data: MCPPluginSimpleCreate) =>
    httpClient.post<unknown, MCPPlugin>('/mcp/plugins/simple', data),

  /**
   * Update plugin
   */
  updatePlugin: (id: string, data: MCPPluginUpdate) =>
    httpClient.put<unknown, MCPPlugin>(`/mcp/plugins/${id}`, data),

  /**
   * Delete plugin
   */
  deletePlugin: (id: string) =>
    httpClient.delete<unknown, { message: string }>(`/mcp/plugins/${id}`),

  /**
   * Enable/disable plugin
   */
  togglePlugin: (id: string, enabled: boolean) =>
    httpClient.post<unknown, MCPPlugin>(`/mcp/plugins/${id}/toggle`, null, { params: { enabled } }),

  /**
   * Test plugin connection
   */
  testPlugin: (id: string) =>
    httpClient.post<unknown, MCPTestResult>(`/mcp/plugins/${id}/test`),

  /**
   * Get plugin tools list
   */
  getPluginTools: (id: string) =>
    httpClient.get<unknown, { tools: MCPTool[] }>(`/mcp/plugins/${id}/tools`),

  /**
   * Call a tool
   */
  callTool: (data: MCPToolCallRequest) =>
    httpClient.post<unknown, MCPToolCallResponse>('/mcp/call', data),
};
