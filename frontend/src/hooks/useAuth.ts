import { useEffect, useState } from 'react';
import { authApi } from '../services/api/index.js';
import { sessionManager } from '../utils/sessionManager.js';

export interface UseAuthResult {
  isAuthenticated: boolean | null;
  isLoading: boolean;
}

export function useAuth(): UseAuthResult {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      try {
        await authApi.getCurrentUser();
        setIsAuthenticated(true);
        // 启动会话管理器
        sessionManager.start();
      } catch {
        setIsAuthenticated(false);
        // 停止会话管理器
        sessionManager.stop();
      }
    };
    
    checkAuth();
    
    return () => {
      // 组件卸载时不停止会话管理器，让它在整个应用生命周期内运行
    };
  }, []);

  return {
    isAuthenticated,
    isLoading: isAuthenticated === null,
  };
}
