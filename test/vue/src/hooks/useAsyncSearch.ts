import { onScopeDispose, ref, shallowRef } from 'vue';

/**
 * 防抖 + 竞态保护的异步搜索。搜索型下拉框（处理人）与唯一性校验都用它。
 * 组件自身的交互功能可直连 Service（core-principles P2 允许例外）。
 */

export interface AsyncSearchOptions {
  delayMs?: number;
}

export function useAsyncSearch<T>(
  search: (keyword: string, signal: AbortSignal) => Promise<T | null>,
  options: AsyncSearchOptions = {},
) {
  const delayMs = options.delayMs ?? 300;
  const result = shallowRef<T | null>(null);
  const isSearching = ref(false);

  let timer: ReturnType<typeof setTimeout> | null = null;
  let controller: AbortController | null = null;

  function cancel(): void {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    controller?.abort();
    controller = null;
    isSearching.value = false;
  }

  function trigger(keyword: string): void {
    // 新输入立即废弃上一次的定时器与在途请求，保证结果与最后一次输入对应。
    if (timer !== null) clearTimeout(timer);
    controller?.abort();

    isSearching.value = true;
    timer = setTimeout(async () => {
      const current = new AbortController();
      controller = current;

      const data = await search(keyword, current.signal);

      if (current.signal.aborted) return;
      result.value = data;
      isSearching.value = false;
    }, delayMs);
  }

  onScopeDispose(cancel);

  return { result, isSearching, trigger, cancel };
}
