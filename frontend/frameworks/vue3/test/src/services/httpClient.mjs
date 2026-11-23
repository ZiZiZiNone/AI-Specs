/**
 * 统一 HTTP 客户端：双层校验 HTTP 状态码与业务 code===0，支持超时守卫与可中断指数退避重试。
 */

export function delayWithSignal(ms, signal) {
  if (signal?.aborted) {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    const onAbort = () => {
      clearTimeout(timer);
      resolve(false);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve(true);
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export function withTimeout(timeoutMs, externalSignal) {
  const controller = new AbortController();
  if (externalSignal?.aborted) {
    controller.abort();
    return { signal: controller.signal, isTimeout: () => false, dispose: () => {} };
  }
  let timedOut = false;
  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', onExternalAbort, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    isTimeout: () => timedOut,
    dispose: () => {
      clearTimeout(timer);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    },
  };
}

function mapResponseOutcome(resp, payload, canRetry) {
  if (resp.status >= 400) {
    if ([429, 502, 503, 504].includes(resp.status) && canRetry) {
      return { retry: true };
    }
    return {
      ok: false,
      error: {
        kind: 'HTTP_ERROR', status: resp.status,
        code: payload?.code ?? resp.status,
        message: payload?.message ?? '服务暂时不可用，请稍后重试',
      },
    };
  }
  if (payload?.code !== 0) {
    return {
      ok: false,
      error: {
        kind: 'BIZ_ERROR', status: resp.status,
        code: payload?.code ?? -1,
        message: payload?.message ?? '操作未成功，请检查后重试',
      },
    };
  }
  return { ok: true, data: payload.data, requestId: payload.requestId ?? '' };
}

function mapCaughtError(signal, timeoutGuard, canRetry) {
  if (signal?.aborted && !timeoutGuard.isTimeout()) {
    return { ok: false, error: { kind: 'CANCELED', code: 'CANCELED', message: '请求已取消' } };
  }
  if (canRetry) {
    return { retry: true };
  }
  const kind = timeoutGuard.isTimeout() ? 'TIMEOUT' : 'NETWORK_ERROR';
  const message = kind === 'TIMEOUT' ? '请求超时，请稍后重试' : '网络连接异常，请稍后重试';
  return { ok: false, error: { kind, code: kind, message } };
}

export async function requestJson({
  fetchImpl, url, method = 'GET', body, signal, timeoutMs = 5000, maxRetries = 2, baseDelayMs = 20,
}) {
  const upperMethod = method.toUpperCase();
  const allowedRetries = upperMethod === 'GET' ? maxRetries : 0;

  for (let attempt = 0; attempt <= allowedRetries; attempt++) {
    if (signal?.aborted) {
      return { ok: false, error: { kind: 'CANCELED', code: 'CANCELED', message: '请求已取消' } };
    }
    const timeoutGuard = withTimeout(timeoutMs, signal);
    const canRetry = attempt < allowedRetries;
    let outcome;
    try {
      const resp = await fetchImpl(url, { method: upperMethod, body, signal: timeoutGuard.signal });
      outcome = mapResponseOutcome(resp, await resp.json(), canRetry);
    } catch {
      outcome = mapCaughtError(signal, timeoutGuard, canRetry);
    } finally {
      timeoutGuard.dispose();
    }
    if (!outcome.retry) return outcome;

    const shouldContinue = await delayWithSignal(baseDelayMs * (2 ** attempt), signal);
    if (!shouldContinue || signal?.aborted) {
      return { ok: false, error: { kind: 'CANCELED', code: 'CANCELED', message: '请求已取消' } };
    }
  }
  return { ok: false, error: { kind: 'UNKNOWN', code: 'UNKNOWN', message: '未知错误' } };
}
