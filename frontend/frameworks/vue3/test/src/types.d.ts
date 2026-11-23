export interface RequestGuardToken {
  signal: AbortSignal;
  isStale: () => boolean;
  done: () => void;
}

export interface RequestGuard {
  start: () => RequestGuardToken;
  abortAll: () => void;
}

export interface TicketQuery {
  keyword: string;
  status: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface ApiError {
  kind: 'CANCELED' | 'HTTP_ERROR' | 'BIZ_ERROR' | 'TIMEOUT' | 'NETWORK_ERROR' | 'UNKNOWN';
  code: string | number;
  status?: number;
  message: string;
}

export type ApiResult<T> =
  | { ok: true; data: T; requestId: string }
  | { ok: false; error: ApiError };
