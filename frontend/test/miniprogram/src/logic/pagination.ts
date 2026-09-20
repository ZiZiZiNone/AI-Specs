/** 分页 Logic（纯函数）。对应 frameworks/miniprogram/logic.md 的约定：
入参只收值与前状态快照，不碰 this/data；失败走 error 字段，不抛异常；
取消是预期行为，静默返回，不写 error 态。 */

export interface PageState<T> {
  list: T[]
  page: number
  loading: boolean
  finished: boolean
  error: string | null
}

export interface ListQuery {
  keyword: string
}

export type FetchResult<T> =
  | { ok: true; items: T[]; hasMore: boolean }
  | { ok: false; code: string }

const ERROR_MESSAGE: Record<string, string> = {
  TIMEOUT: '请求超时，请稍后重试',
  NETWORK: '网络异常，请检查后重试',
}

function toUserMessage(code: string): string {
  return ERROR_MESSAGE[code] ?? '加载失败，请稍后重试'
}

export function initialPage<T>(): PageState<T> {
  return { list: [], page: 1, loading: false, finished: false, error: null }
}

export function pickPage<T>(state: PageState<T>): PageState<T> {
  return {
    list: state.list,
    page: state.page,
    loading: state.loading,
    finished: state.finished,
    error: null,
  }
}

export async function loadMore<T>(
  state: PageState<T>,
  query: ListQuery,
  fetcher: (query: ListQuery, page: number) => Promise<FetchResult<T>>,
): Promise<PageState<T>> {
  if (state.loading || state.finished) return state
  const working: PageState<T> = { ...state, loading: true, error: null }
  const result = await fetcher(query, working.page)
  if (!result.ok) {
    if (result.code === 'CANCELED') return state
    return { ...working, loading: false, error: toUserMessage(result.code) }
  }
  return {
    list: [...working.list, ...result.items],
    page: working.page + 1,
    loading: false,
    finished: !result.hasMore,
    error: null,
  }
}
