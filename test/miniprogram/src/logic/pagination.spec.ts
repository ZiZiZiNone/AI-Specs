import { describe, expect, test } from '@jest/globals'
import {
  initialPage,
  loadMore,
  type FetchResult,
  type ListQuery,
} from './pagination'

/** 纯函数进出，无框架；成功/失败 error 字段/取消三态全覆盖。 */

const query: ListQuery = { keyword: '' }

function ok<T>(items: T[], hasMore: boolean): Promise<FetchResult<T>> {
  return Promise.resolve({ ok: true, items, hasMore })
}

function fail<T>(code: string): Promise<FetchResult<T>> {
  return Promise.resolve({ ok: false, code })
}

describe('pagination', () => {
  test('should_append_items_and_advance_page_when_fetch_succeeds', async () => {
    const next = await loadMore(initialPage<string>(), query, () => ok(['a', 'b'], true))
    expect(next.list).toEqual(['a', 'b'])
    expect(next.page).toBe(2)
    expect(next.loading).toBe(false)
    expect(next.finished).toBe(false)
    expect(next.error).toBeNull()
  })

  test('should_keep_old_list_and_set_error_when_fetch_fails', async () => {
    const first = await loadMore(initialPage<string>(), query, () => ok(['a'], true))
    const next = await loadMore(first, query, () => fail<string>('TIMEOUT'))
    expect(next.list).toEqual(['a'])
    expect(next.page).toBe(2)
    expect(next.loading).toBe(false)
    expect(next.error).toBe('请求超时，请稍后重试')
  })

  test('should_return_state_unchanged_when_request_canceled', async () => {
    const state = await loadMore(initialPage<string>(), query, () => ok(['a'], true))
    const next = await loadMore(state, query, () => fail<string>('CANCELED'))
    expect(next).toBe(state)
  })

  test('should_mark_finished_when_no_more_pages', async () => {
    const next = await loadMore(initialPage<string>(), query, () => ok(['a'], false))
    expect(next.finished).toBe(true)
    const again = await loadMore(next, query, () => ok(['b'], false))
    expect(again).toBe(next)
  })

  test('should_ignore_load_more_when_loading', async () => {
    const loading = { ...initialPage<string>(), loading: true }
    const next = await loadMore(loading, query, () => ok(['a'], true))
    expect(next).toBe(loading)
  })
})
