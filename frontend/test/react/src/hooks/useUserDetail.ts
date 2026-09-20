// 用户详情加载 Hook
// 职责：封装详情加载的 UI 状态管理

import { useState, useCallback, useRef, useEffect } from 'react';
import type { UIState, User } from '../types/user.types';
import * as userService from '../services/user.service';

interface UseUserDetailResult {
  state: UIState;
  data: User | null;
  error: string | null;
  loadUserDetail: (id: string) => Promise<void>;
  refreshUserDetail: () => Promise<void>;
}

/**
 * 用户详情加载 Hook
 */
export function useUserDetail(): UseUserDetailResult {
  const [state, setState] = useState<UIState>('idle');
  const [data, setData] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentIdRef = useRef<string>('');

  const loadUserDetail = useCallback(async (id: string) => {
    currentIdRef.current = id;

    setState('loading');
    setError(null);
    setData(null);

    const result = await userService.fetchUserDetail(id);

    // 竞态保护：只处理最新请求
    if (currentIdRef.current !== id) {
      return;
    }

    if (result.success && result.data) {
      setState('success');
      setData(result.data);
    } else {
      setState('error');
      setError(result.error?.message || '用户不存在或已删除');
    }
  }, []);

  const refreshUserDetail = useCallback(async () => {
    if (currentIdRef.current) {
      await loadUserDetail(currentIdRef.current);
    }
  }, [loadUserDetail]);

  return {
    state,
    data,
    error,
    loadUserDetail,
    refreshUserDetail,
  };
}
