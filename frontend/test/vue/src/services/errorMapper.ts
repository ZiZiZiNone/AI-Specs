import type { StandardError } from '@/types/Result.types.ts';

/**
 * 错误归一。所有分支收敛到 StandardError（rules/error-handling.md），
 * 上层据 retryable 决定是否重试，据 message 直接展示给用户。
 */

const HTTP_MESSAGES: Record<number, { code: string; message: string }> = {
  400: { code: 'BAD_REQUEST', message: '请求参数有误，请检查后重试' },
  401: { code: 'UNAUTHORIZED', message: '登录状态已过期，请重新登录' },
  403: { code: 'FORBIDDEN', message: '没有执行该操作的权限' },
  404: { code: 'NOT_FOUND', message: '请求的内容不存在或已删除' },
  409: { code: 'CONFLICT', message: '数据已被他人修改，请刷新后重试' },
  429: { code: 'RATE_LIMITED', message: '操作过于频繁，请稍后重试' },
};

export const TIMEOUT_ERROR: StandardError = {
  code: 'TIMEOUT',
  message: '请求超时，请检查网络后重试',
  type: 'network',
  retryable: true,
};

export const CANCELED_ERROR: StandardError = {
  code: 'CANCELED',
  message: '请求已取消',
  type: 'client',
  retryable: false,
};

export const NETWORK_ERROR: StandardError = {
  code: 'NETWORK_UNAVAILABLE',
  message: '网络连接失败，请检查网络后重试',
  type: 'network',
  retryable: true,
};

/** 后端业务错误体：{ success:false, error:{ code, message } }。 */
interface BusinessErrorPayload {
  error?: { code?: string; message?: string };
}

function readBusinessError(payload: unknown): { code: string; message: string } | null {
  const error = (payload as BusinessErrorPayload | null)?.error;
  if (!error?.code || !error.message) return null;
  return { code: error.code, message: error.message };
}

export function toStandardError(status: number, payload: unknown): StandardError {
  // 5xx 视为服务端临时故障，可重试。
  if (status >= 500) {
    return {
      code: 'SERVER_ERROR',
      message: '服务暂时不可用，请稍后重试',
      type: 'network',
      details: payload,
      retryable: true,
    };
  }

  const business = readBusinessError(payload);
  if (business) {
    return {
      code: business.code,
      message: business.message,
      type: 'business',
      details: payload,
      retryable: status === 429,
    };
  }

  const mapped = HTTP_MESSAGES[status];
  if (mapped) {
    return {
      ...mapped,
      type: 'business',
      details: payload,
      retryable: status === 429,
    };
  }

  return {
    code: `HTTP_${status}`,
    message: '操作失败，请稍后重试或联系管理员',
    type: 'business',
    details: payload,
    retryable: false,
  };
}
