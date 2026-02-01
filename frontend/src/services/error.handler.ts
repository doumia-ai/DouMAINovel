import type { AxiosError } from 'axios';
import { message } from 'antd';

/**
 * Error type classification
 */
export const ErrorType = {
  NETWORK: 'network',
  HTTP: 'http',
  BUSINESS: 'business',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown',
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

/**
 * Error information structure
 */
export interface ErrorInfo {
  type: ErrorType;
  status?: number;
  message: string;
  url?: string;
  method?: string;
  details?: Record<string, unknown>;
}

/**
 * Extracts error information from Axios error
 * @param error - Axios error object
 * @returns Structured error information
 */
function extractErrorInfo(error: AxiosError): ErrorInfo {
  const errorInfo: ErrorInfo = {
    type: ErrorType.UNKNOWN,
    message: '请求失败',
    url: error.config?.url,
    method: error.config?.method?.toUpperCase(),
  };

  if (error.response) {
    // HTTP error
    errorInfo.type = ErrorType.HTTP;
    errorInfo.status = error.response.status;
    errorInfo.message = getErrorMessage(error);
    errorInfo.details = error.response.data as Record<string, unknown>;
  } else if (error.request) {
    // Network error
    errorInfo.type = ErrorType.NETWORK;
    errorInfo.message = '网络错误，请检查网络连接';
  } else {
    // Unknown error
    errorInfo.message = error.message || '请求失败';
  }

  return errorInfo;
}

/**
 * Gets user-friendly error message based on HTTP status code
 * @param error - Axios error object
 * @returns User-friendly error message
 */
function getErrorMessage(error: AxiosError): string {
  const status = error.response?.status;
  const data = error.response?.data as any;

  switch (status) {
    case 400:
      return data?.detail || '请求参数错误';
    case 401:
      return '未授权，请先登录';
    case 403:
      return '没有权限访问';
    case 404:
      return data?.detail || '请求的资源不存在';
    case 422:
      if (data?.errors) {
        console.error('验证错误详情:', data.errors);
      }
      return data?.detail || '请求参数验证失败';
    case 500:
      return data?.detail || '服务器内部错误';
    case 503:
      return '服务暂时不可用，请稍后重试';
    default:
      return data?.detail || data?.message || `请求失败 (${status})`;
  }
}

/**
 * Shows user-friendly error message
 * @param errorInfo - Error information
 */
function showUserMessage(errorInfo: ErrorInfo): void {
  message.error(errorInfo.message);
}

/**
 * Logs detailed error information
 * @param errorInfo - Error information
 */
function logError(errorInfo: ErrorInfo): void {
  console.error('API Error:', errorInfo.message, {
    type: errorInfo.type,
    url: errorInfo.url,
    method: errorInfo.method,
    status: errorInfo.status,
    details: errorInfo.details,
  });
}

/**
 * Handles specific error scenarios
 * @param errorInfo - Error information
 */
function handleSpecificError(errorInfo: ErrorInfo): void {
  // Handle 401 Unauthorized - redirect to login
  if (errorInfo.status === 401) {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
}

/**
 * Main error handler for API requests
 * @param error - Axios error object
 */
export function handleApiError(error: AxiosError): void {
  // 1. Extract error information
  const errorInfo = extractErrorInfo(error);

  // 2. Show user-friendly error message
  showUserMessage(errorInfo);

  // 3. Log detailed error information
  logError(errorInfo);

  // 4. Handle specific error scenarios
  handleSpecificError(errorInfo);
}
