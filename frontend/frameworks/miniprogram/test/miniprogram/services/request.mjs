/**
 * 小程序请求封装：AbortSignal 绑定与解绑、并发 401 单飞续期重放，Service 层不直接弹窗。
 */

function executeWxRequest({ wxApi, options, token, signal }) {
  if (signal?.aborted) {
    return Promise.resolve({ ok: false, error: { kind: 'CANCELED', code: 'CANCELED', message: '请求已取消' } });
  }
  return new Promise((resolve) => {
    let task = null;
    const onAbort = () => task?.abort?.();
    signal?.addEventListener('abort', onAbort, { once: true });

    task = wxApi.request({
      ...options,
      header: { ...(options.header ?? {}), Authorization: token ? `Bearer ${token}` : '' },
      success: (res) => resolve({ ok: true, statusCode: res.statusCode, data: res.data }),
      fail: (err) => {
        const canceled = signal?.aborted || String(err?.errMsg ?? '').includes('abort');
        resolve({
          ok: false,
          error: canceled
            ? { kind: 'CANCELED', code: 'CANCELED', message: '请求已取消' }
            : { kind: 'NETWORK_ERROR', code: 'NETWORK_ERROR', message: '网络异常' },
        });
      },
      complete: () => signal?.removeEventListener('abort', onAbort),
    });
  });
}

export function createMiniRequestClient({ wxApi, getToken, refreshToken }) {
  let refreshingPromise = null;

  function ensureRefreshedToken() {
    if (!refreshingPromise) {
      refreshingPromise = Promise.resolve().then(() => refreshToken()).finally(() => { refreshingPromise = null; });
    }
    return refreshingPromise;
  }

  return async function request(options, { signal = undefined, retriedAuth = false } = {}) {
    const res = await executeWxRequest({ wxApi, options, token: getToken(), signal });
    if (!res.ok) return res;

    if (res.statusCode === 401 && !retriedAuth) {
      if (!(await ensureRefreshedToken())) {
        return { ok: false, error: { kind: 'UNAUTHORIZED', code: 40101, message: '登录已过期' } };
      }
      return request(options, { signal, retriedAuth: true });
    }
    if (res.statusCode >= 400 || res.data?.code !== 0) {
      return {
        ok: false,
        error: {
          kind: res.statusCode >= 400 ? 'HTTP_ERROR' : 'BIZ_ERROR',
          code: res.data?.code ?? res.statusCode,
          message: res.data?.message ?? '请求失败',
        },
      };
    }
    return { ok: true, data: res.data.data };
  };
}
