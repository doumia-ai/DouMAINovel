import axios from 'axios';
import type { AxiosInstance } from 'axios';

// =======================
// 类型定义
// =======================

export interface DetectRequest {
  texts: string[];
}

export interface DetectResponse {
  summary: {
    human_ratio: number;
    suspected_ai_ratio: number;
    ai_ratio: number;
  };
  items: Array<{
    ai_probability: number;
    human_probability: number;
    label: 'human' | 'suspected_ai' | 'ai';
  }>;
}

export interface ServiceConfig {
  baseUrl: string;
  detectPath: string;
  headers: Array<{ key: string; value: string }>;
}

export interface DetectConfig {
  source: 'builtin' | 'custom';
  builtinConfig: ServiceConfig;
  customConfig: ServiceConfig;
}

// =======================
// 默认配置
// =======================

// 内置服务使用后端代理，解决远程访问时 localhost 指向用户本地电脑的问题
const DEFAULT_BUILTIN_CONFIG: ServiceConfig = {
  baseUrl: '',  // 空字符串表示使用当前域名（通过后端代理）
  detectPath: '/api/aigc-detect/batch',  // 后端代理 API 路径
  headers: [],
};

const DEFAULT_CUSTOM_CONFIG: ServiceConfig = {
  baseUrl: '',
  detectPath: '/detect/batch',
  headers: [],
};

export const DEFAULT_DETECT_CONFIG: DetectConfig = {
  source: 'builtin',
  builtinConfig: { ...DEFAULT_BUILTIN_CONFIG },
  customConfig: { ...DEFAULT_CUSTOM_CONFIG },
};

// =======================
// 本地存储
// =======================

const STORAGE_KEY = 'aigc_detect_config';

export const loadDetectConfig = (): DetectConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        source: parsed.source || 'builtin',
        builtinConfig: {
          ...DEFAULT_BUILTIN_CONFIG,
          ...parsed.builtinConfig,
        },
        customConfig: {
          ...DEFAULT_CUSTOM_CONFIG,
          ...parsed.customConfig,
        },
      };
    }
  } catch (e) {
    console.warn('Failed to load detect config:', e);
  }
  return { ...DEFAULT_DETECT_CONFIG };
};

export const saveDetectConfig = (config: DetectConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save detect config:', e);
  }
};

// =======================
// 内部工具函数
// =======================

const getActiveServiceConfig = (config: DetectConfig): ServiceConfig => {
  return config.source === 'builtin'
    ? DEFAULT_BUILTIN_CONFIG
    : config.customConfig;
};

const validateConfig = (config: DetectConfig): void => {
  if (config.source === 'custom') {
    if (!config.customConfig.baseUrl?.trim()) {
      throw new Error('自定义检测 API 的 Base URL 不能为空');
    }
  }
};

const createDetectClient = (config: DetectConfig): AxiosInstance => {
  validateConfig(config);

  const serviceConfig = getActiveServiceConfig(config);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  serviceConfig.headers.forEach(({ key, value }) => {
    if (key?.trim() && value?.trim()) {
      headers[key.trim()] = value.trim();
    }
  });

  return axios.create({
    baseURL: serviceConfig.baseUrl,
    timeout: 60000,
    headers,
  });
};

// =======================
// 服务接口
// =======================

export const aigcDetectService = {
  detectTexts: async (
    texts: string[],
    config: DetectConfig = DEFAULT_DETECT_CONFIG
  ): Promise<DetectResponse> => {
    const client = createDetectClient(config);
    const path =
      config.source === 'builtin'
        ? DEFAULT_BUILTIN_CONFIG.detectPath
        : config.customConfig.detectPath;

    const response = await client.post<DetectResponse>(path, { texts });
    return response.data;
  },

  testConnection: async (
    config: DetectConfig
  ): Promise<{ success: boolean; message: string }> => {
    try {
      await aigcDetectService.detectTexts(['测试文本'], config);
      return { success: true, message: '连接成功' };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || '连接失败',
      };
    }
  },

  splitTextToParagraphs: (text: string): string[] => {
    return text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  },
};

export default aigcDetectService;