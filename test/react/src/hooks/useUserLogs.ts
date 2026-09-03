// 操作记录加载 Hook
// 职责：封装操作记录加载的 UI 状态管理

import { useState, useCallback } from 'react';
import type { UIState, OperationLog, LogListParams } from '../types/user.types';
import * as userService from '../services/user.service';

interface UseUserLogsResult {
  state: UIState;
  data: OperationLog[];
  total: number;
  error: string | null;
  hasMore: boolean;
  loadLogs: (userId: string, params: LogListParams) => Promise<void>;
  loadMore: () => Promise<void>;
}

/**
 * 用户操作记录加载 Hook
 */
export function useUserLogs(userId: string): UseUserLogsResult {
  const [state, setState] = useState<UIState>('idle');
  const [data, setData] = useState<OperationLog[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const loadLogs = useCallback(
    async (uid: string, params: LogListParams) => {
      setState('loading');
      setError(null);

      const result = await userService.fetchUserLogs(uid, params);

      if (result.success && result.data) {
        const { list, total: totalCount } = result.data;

        if (list.length === 0 && params.page === 1) {
          setState('empty');
          setData([]);
          setTotal(0);
        } else {
          setState('success');
          setData(params.page === 1 ? list : [...data, ...list]);
          setTotal(totalCount);
          setCurrentPage(params.page);
        }
      } else {
        setState('error');
        setError(result.error?.message || '加载失败');
      }
    },
    [data]
  );

  const loadMore = useCallback(async () => {
    const nextPage = currentPage + 1;
    await loadLogs(userId, { page: nextPage, pageSize: 10 });
  }, [userId, currentPage, loadLogs]);

  const hasMore = data.length < total;

  return {
    state,
    data,
    total,
    error,
    hasMore,
    loadLogs,
    loadMore,
  };
}
