export interface MiniApiError {
  kind: 'CANCELED' | 'NETWORK_ERROR' | 'UNAUTHORIZED' | 'HTTP_ERROR' | 'BIZ_ERROR';
  code: string | number;
  message: string;
}

export type MiniApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: MiniApiError };
