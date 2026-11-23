/**
 * Next.js Server Action 安全包装器：强制认证、细粒度资源归属（ABAC）与输入校验。
 */
export function createServerActionGuard({ getSession, validateInput, canOperate, handler }) {
  return async function executeAction(rawInput) {
    const actor = await getSession();
    if (!actor) {
      return { ok: false, error: { code: 40101, message: '请先登录' } };
    }
    const parsed = validateInput(rawInput);
    if (!parsed.ok) {
      return { ok: false, error: { code: 40001, message: parsed.message } };
    }
    const allowed = await canOperate(actor, parsed.data);
    if (!allowed) {
      return { ok: false, error: { code: 40301, message: '无权操作该资源' } };
    }
    const data = await handler(actor, parsed.data);
    return { ok: true, data };
  };
}

/**
 * React useEffect 异步竞态守卫：新请求先取消旧请求，unmount 清理回调中止当前请求。
 */
export function createEffectGuard() {
  let active = null;
  let seq = 0;

  function begin() {
    active?.abort();
    const controller = new AbortController();
    active = controller;
    const token = ++seq;
    return {
      signal: controller.signal,
      isCurrent: () => token === seq,
      cleanup: () => {
        controller.abort();
        if (active === controller) active = null;
      },
    };
  }

  return { begin };
}
