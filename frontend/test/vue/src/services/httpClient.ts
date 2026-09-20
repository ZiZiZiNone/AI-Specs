import type { Result } from '@/types/Result.types.ts';
import {
  CANCELED_ERROR,
  NETWORK_ERROR,
  TIMEOUT_ERROR,
  toStandardError,
} from '@/services/errorMapper.ts';
import { MockNetworkError, sendMockRequest } from '@/services/mock/mockTransport.ts';

/**
 * 唯一的请求出口。统一承担超时、指数退避重试、取消与错误归一，
 * 业务 service 只描述"调哪个接口、返回什么类型"。
 */

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RETRY = 3;
const RETRY_BASE_DELAY_MS = 300;

export interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
  /** 幂等性无法保证的写操作不参与自动重试，避免重复创建。 */
  retryable?: boolean;
}

interface SuccessPayload<T> {
  success: true;
  data: T;
}

function toStringParams(
  params: RequestOptions['params'],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === '') continue;
    result[key] = String(value);
  }
  return result;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * 超时用独立 controller 实现，并与调用方 signal 联动：
 * 二者任一触发都要中断底层请求，否则超时后请求仍在后台占用连接。
 */
function withTimeout(
  timeoutMs: number,
  externalSignal?: AbortSignal,
): { signal: AbortSignal; isTimeout: () => boolean; dispose: () => void } {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', onExternalAbort, { once: true });

  return {
    signal: controller.signal,
    isTimeout: () => timedOut,
    dispose: () => {
      clearTimeout(timer);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    },
  };
}

async function attemptOnce<T>(
  method: string,
  path: string,
  options: RequestOptions,
): Promise<Result<T>> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const guard = withTimeout(timeoutMs, options.signal);

  try {
    const response = await sendMockRequest(
      method,
      path,
      toStringParams(options.params),
      options.body,
      guard.signal,
    );

    if (response.status >= 400) {
      return { success: false, error: toStandardError(response.status, response.payload) };
    }
    return {
      success: true,
      data: (response.payload as SuccessPayload<T>).data,
    };
  } catch (error) {
    if (isAbortError(error)) {
      return { success: false, error: guard.isTimeout() ? TIMEOUT_ERROR : CANCELED_ERROR };
    }
    if (error instanceof MockNetworkError) {
      return { success: false, error: NETWORK_ERROR };
    }
    return {
      success: false,
      error: {
        code: 'UNKNOWN',
        message: '操作失败，请稍后重试或联系管理员',
        type: 'client',
        details: error,
        retryable: false,
      },
    };
  } finally {
    guard.dispose();
  }
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<Result<T>> {
  const allowRetry = options.retryable ?? method === 'GET';
  let lastResult = await attemptOnce<T>(method, path, options);

  for (let attempt = 1; allowRetry && attempt < MAX_RETRY; attempt += 1) {
    if (lastResult.success || !lastResult.error.retryable) break;
    if (options.signal?.aborted) return { success: false, error: CANCELED_ERROR };

    await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
    lastResult = await attemptOnce<T>(method, path, options);
  }

  return lastResult;
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, options?: RequestOptions) => request<T>('POST', path, options),
  put: <T>(path: string, options?: RequestOptions) => request<T>('PUT', path, options),
  patch: <T>(path: string, options?: RequestOptions) => request<T>('PATCH', path, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, options),
};
