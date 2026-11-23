/**
 * 单飞请求守卫：发起新请求前中断上一在途请求，并结合单调序号防止乱序响应覆盖。
 */
export function createRequestGuard() {
  let activeController = null;
  let latestToken = 0;

  function start() {
    if (activeController) {
      activeController.abort();
    }
    const controller = new AbortController();
    activeController = controller;
    const token = ++latestToken;

    return {
      signal: controller.signal,
      isStale: () => token !== latestToken,
      done: () => {
        if (activeController === controller) {
          activeController = null;
        }
      },
    };
  }

  function abortAll() {
    if (activeController) {
      activeController.abort();
      activeController = null;
    }
    latestToken += 1;
  }

  return { start, abortAll };
}
