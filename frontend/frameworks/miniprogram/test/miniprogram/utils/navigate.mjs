/**
 * 小程序统一安全导航（10 层页面栈自动降级 redirectTo + 冷启动就绪门控）。
 */
export const MAX_PAGE_STACK = 10;

export function createNavigator({ wxApi, getCurrentPagesFn, ensureAppReady, isLoggedIn }) {
  return async function navigateSafe(url, { requiresAuth = false } = {}) {
    await ensureAppReady();
    if (requiresAuth && !isLoggedIn()) {
      wxApi.redirectTo({ url: `/pages/login/index?redirect=${encodeURIComponent(url)}` });
      return 'redirectTo:login';
    }
    const stackLen = getCurrentPagesFn().length;
    if (stackLen >= MAX_PAGE_STACK) {
      wxApi.redirectTo({ url });
      return 'redirectTo:stack_full';
    }
    wxApi.navigateTo({ url });
    return 'navigateTo';
  };
}
