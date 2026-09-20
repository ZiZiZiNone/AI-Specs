/**
 * 请求结果与错误的统一契约。
 * 结构取自 rules/error-handling.md 的 StandardError，Service 层负责归一，
 * 上层只消费结构化结果，不感知 axios/fetch 差异。
 */

export type ErrorType = 'network' | 'business' | 'client';

export interface StandardError {
  code: string;
  message: string;
  type: ErrorType;
  details?: unknown;
  retryable: boolean;
}

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: StandardError };

export interface PageQuery {
  page: number;
  pageSize: number;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
