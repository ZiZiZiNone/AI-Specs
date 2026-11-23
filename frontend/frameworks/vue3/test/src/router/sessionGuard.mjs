/**
 * 异步会话单飞加载与路由守卫：等待会话就绪后再裁决访问权限。
 */

export function createSessionStore(fetchSession) {
  let user = null;
  let loaded = false;
  let inFlight = null;

  async function ensureLoaded() {
    if (loaded) return user;
    if (!inFlight) {
      inFlight = Promise.resolve()
        .then(() => fetchSession())
        .then((u) => {
          user = u;
          loaded = true;
          return user;
        })
        .finally(() => {
          inFlight = null;
        });
    }
    return inFlight;
  }

  function reset() {
    user = null;
    loaded = false;
    inFlight = null;
  }

  return { get user() { return user; }, get loaded() { return loaded; }, ensureLoaded, reset };
}

export function createAuthGuard(session, canAccessRoute) {
  return async function beforeEach(to) {
    await session.ensureLoaded();
    if (to.meta?.requiresAuth && !session.user) {
      return { name: 'login', query: { redirect: to.fullPath } };
    }
    if (!canAccessRoute(session.user, to.name)) {
      return { name: 'forbidden' };
    }
    return true;
  };
}
