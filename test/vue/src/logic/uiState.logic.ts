import type { UIState } from '@/types/UIState.types';

/**
 * success 与 empty 的判定收敛到一处。
 * 依据 rules/ui-states.md：数组长度为 0 判 empty，否则 success。
 * 单独成文件是因为列表、详情、处理记录三处都要用，避免各自写一份 if 判断。
 */
export function resolveListState(list: readonly unknown[]): UIState {
  return list.length > 0 ? 'success' : 'empty';
}

export function resolveDetailState(detail: unknown): UIState {
  return detail === null || detail === undefined ? 'empty' : 'success';
}

/** 翻页取回空页时不能退回 empty，否则用户会看到内容突然消失。 */
export function resolvePagedState(list: readonly unknown[], page: number): UIState {
  if (list.length > 0) return 'success';
  return page > 1 ? 'success' : 'empty';
}
