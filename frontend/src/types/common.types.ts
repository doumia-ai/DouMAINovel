// 通用类型定义

/**
 * API 响应包装类型
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * 分页响应类型
 */
export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * API 错误响应类型
 */
export interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
  };
  message?: string;
}
