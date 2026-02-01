import { httpClient } from '../http.client.js';

import type { PromptSubmissionCreate } from '../../types/index.js';

type WorkshopStatus = {
  mode: string;
  instance_id: string;
  cloud_connected?: boolean;
};

type ToggleLikeResponse = {
  liked: boolean;
  like_count: number;
};

// 统一使用 httpClient（baseURL:'/api' + withCredentials:true）
// 避免直接 axios 调用导致 Cookie 不携带，从而出现 401（导入到本地/点赞/提交等功能都会失败）
export const promptWorkshopApi = {
  // Public
  getStatus: () => httpClient.get<WorkshopStatus, WorkshopStatus>('/prompt-workshop/status'),

  getItems: (params: {
    category?: string;
    search?: string;
    tags?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) => httpClient.get('/prompt-workshop/items', { params }),

  getItem: (itemId: string) => httpClient.get(`/prompt-workshop/items/${itemId}`),

  // Auth required
  importItem: (itemId: string, data?: { custom_name?: string }) =>
    // FastAPI 端点签名是 `data: ImportRequest`，需要 request body；否则会 422
    httpClient.post(`/prompt-workshop/items/${itemId}/import`, data ?? {}),

  toggleLike: (itemId: string) =>
    httpClient.post<ToggleLikeResponse, ToggleLikeResponse>(`/prompt-workshop/items/${itemId}/like`),

  submit: (data: PromptSubmissionCreate) => httpClient.post('/prompt-workshop/submit', data),

  getMySubmissions: () => httpClient.get('/prompt-workshop/my-submissions'),

  withdrawSubmission: (submissionId: string, force: boolean = false) =>
    httpClient.delete(`/prompt-workshop/submissions/${submissionId}`, { params: { force } }),

  deleteSubmission: (submissionId: string) =>
    httpClient.delete(`/prompt-workshop/submissions/${submissionId}`),

  deleteItem: (itemId: string) => httpClient.delete(`/prompt-workshop/items/${itemId}`),

  // Admin APIs (cloud/server only)
  adminGetSubmissions: (params: { status?: string; page?: number; limit?: number }) =>
    httpClient.get('/prompt-workshop/admin/submissions', { params }),

  adminGetStats: () => httpClient.get('/prompt-workshop/admin/stats'),

  adminReviewSubmission: (
    submissionId: string,
    data: {
      action: 'approve' | 'reject';
      review_note?: string;
      category?: string;
      tags?: string[];
    }
  ) => httpClient.post(`/prompt-workshop/admin/submissions/${submissionId}/review`, data),

  adminCreateItem: (data: {
    name: string;
    category: string;
    description?: string;
    prompt_content: string;
    tags?: string[];
    author_name?: string;
    is_official?: boolean;
  }) => httpClient.post('/prompt-workshop/admin/items', data),

  adminUpdateItem: (
    itemId: string,
    data: Partial<{
      name: string;
      category: string;
      description?: string;
      prompt_content: string;
      tags?: string[];
      author_name?: string;
      is_official?: boolean;
      status?: string;
    }>
  ) => httpClient.put(`/prompt-workshop/admin/items/${itemId}`, data),

  adminDeleteItem: (itemId: string) => httpClient.delete(`/prompt-workshop/admin/items/${itemId}`),
} satisfies Record<string, (...args: any[]) => any>;

export default promptWorkshopApi;
