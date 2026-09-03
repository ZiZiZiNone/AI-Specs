import { onScopeDispose, ref } from 'vue';

/**
 * 竞态与取消的统一处理。列表、详情、搜索都会遇到"旧请求晚于新请求返回"，
 * 单独封装避免每个 composable 重写一遍 requestId 比对。
 */
export function useRequestGuard() {
  const controllers = new Set<AbortController>();
  const latestToken = ref(0);

  function start(): { signal: AbortSignal; isStale: () => boolean } {
    const controller = new AbortController();
    controllers.add(controller);

    latestToken.value += 1;
    const token = latestToken.value;

    return {
      signal: controller.signal,
      // 期间又发起了新请求，本次结果作废，不写入状态。
      isStale: () => {
        controllers.delete(controller);
        return token !== latestToken.value;
      },
    };
  }

  /** 主动取消所有在途请求，用于切换目标或卸载。 */
  function abortAll(): void {
    for (const controller of controllers) controller.abort();
    controllers.clear();
    latestToken.value += 1;
  }

  onScopeDispose(abortAll);

  return { start, abortAll };
}
