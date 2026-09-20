// 用户列表数据加载 Hook
// 职责：封装列表加载的 UI 状态管理、调用 Logic 和 Service

import { useState, useEffect, useCallback, useRef } from 'react';
import type { UIState, User, UserListParams, PaginatedData } from '../types/user.types';
import * as userService from '../services/user.service';

interface UseUserListResult {
  state: UIState;
  data: User[];
  total: number;
  error: string | null;
  loadUsers: (params: UserListParams) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

/**
 * 用户列表加载 Hook
 */
export function useUserList(initialParams: UserListParams): UseUserListResult {
  const [state, setState] = useState<UIState>('idle');
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const currentParamsRef = useRef<UserListParams>(initialParams);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadUsers = useCallback(async (params: UserListParams) => {
    // 取消上一次请求（竞态保护）
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    currentParamsRef.current = params;

    setState('loading');
    setError(null);

    const result = await userService.fetchUserList(params);

    // 检查是否是最新请求
    if (currentParamsRef.current !== params) {
      return;
    }

    if (result.success && result.data) {
      const { list, total: totalCount } = result.data;

      if (list.length === 0 && params.page === 1) {
        setState('empty');
        setData([]);
        setTotal(0);
      } else {
        setState('success');
        setData(list);
        setTotal(totalCount);
      }
    } else {
      setState('error');
      setError(result.error?.message || '加载失败，请稍后重试');
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    await loadUsers(currentParamsRef.current);
  }, [loadUsers]);

  // 组件卸载时取消请求
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    state,
    data,
    total,
    error,
    loadUsers,
    refreshUsers,
  };
}
