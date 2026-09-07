import { describe, expect, it } from 'vitest';
import {
  applyFilterChange,
  applyPageChange,
  createDefaultQuery,
  hasActiveFilter,
  parseQueryFromParams,
  resolvePageAfterRemoval,
  serializeQueryToParams,
} from '@/logic/ticketQuery.logic.ts';

describe('ticketQuery.logic', () => {
  it('should_fallback_to_defaults_when_url_params_are_invalid', () => {
    const query = parseQueryFromParams({
      page: '-3',
      pageSize: '999',
      status: 'deleted',
      priority: '',
      sortBy: 'nickname',
      sortOrder: 'sideways',
    });

    expect(query.page).toBe(1);
    expect(query.pageSize).toBe(10);
    expect(query.status).toBe('');
    expect(query.sortBy).toBe('createdAt');
    expect(query.sortOrder).toBe('desc');
  });

  it('should_round_trip_query_through_url_serialization', () => {
    const original = {
      ...createDefaultQuery(),
      page: 4,
      pageSize: 50,
      keyword: '白屏',
      status: 'processing' as const,
      priority: 'urgent' as const,
      assigneeId: 'u-02',
      sortBy: 'priority' as const,
      sortOrder: 'asc' as const,
    };

    expect(parseQueryFromParams(serializeQueryToParams(original))).toEqual(original);
  });

  it('should_omit_default_values_from_url', () => {
    expect(serializeQueryToParams(createDefaultQuery())).toEqual({});
  });

  it('should_reset_to_first_page_when_filter_changes', () => {
    const current = { ...createDefaultQuery(), page: 7 };
    expect(applyFilterChange(current, { keyword: '导出' }).page).toBe(1);
  });

  it('should_reset_to_first_page_when_page_size_changes', () => {
    const current = { ...createDefaultQuery(), page: 7 };
    expect(applyPageChange(current, 7, 50).page).toBe(1);
    expect(applyPageChange(current, 3, 10).page).toBe(3);
  });

  it('should_report_active_filter_only_when_condition_present', () => {
    expect(hasActiveFilter(createDefaultQuery())).toBe(false);
    expect(hasActiveFilter({ ...createDefaultQuery(), keyword: 'a' })).toBe(true);
    // 排序不算筛选条件，否则"重置筛选"会连排序一起清掉。
    expect(hasActiveFilter({ ...createDefaultQuery(), sortOrder: 'asc' })).toBe(false);
  });

  it('should_step_back_a_page_when_last_row_of_last_page_is_removed', () => {
    const query = { ...createDefaultQuery(), page: 3, pageSize: 10 };
    expect(resolvePageAfterRemoval(query, 21)).toBe(2);
    expect(resolvePageAfterRemoval(query, 25)).toBe(3);
  });
});
