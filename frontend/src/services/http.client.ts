import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { handleApiError } from './error.handler.js';

/**
 * Creates and configures an HTTP client instance with interceptors
 * @returns Configured Axios instance
 */
function createHttpClient(): AxiosInstance {
  const client = axios.create({
    baseURL: '/api',
    timeout: 120000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });

  // Request interceptor
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response.data;
    },
    (error) => {
      handleApiError(error);
      return Promise.reject(error);
    }
  );

  return client;
}

export const httpClient = createHttpClient();
