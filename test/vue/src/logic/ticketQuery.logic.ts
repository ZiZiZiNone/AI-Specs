import type {
  SortOrder,
  TicketListQuery,
  TicketPriority,
  TicketSortField,
  TicketStatus,
} from '@/types/Ticket.types';

/**
 * 列表查询参数的规范化与 URL 序列化。
 * 筛选条件按 rules/store.md 决策树第 3 条存 URL，所以序列化规则必须
 * 与解析规则严格互逆，这里成对实现并一起测试。
 */

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;

const STATUS_VALUES: readonly TicketStatus[] = ['open', 'processing', 'closed'];
const PRIORITY_VALUES: readonly TicketPriority[] = ['low', 'medium', 'high', 'urgent'];
const SORT_FIELDS: readonly TicketSortField[] = ['createdAt', 'priority', 'code'];

export function createDefaultQuery(): TicketListQuery {
  return {
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    keyword: '',
    status: '',
    priority: '',
    assigneeId: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };
}

function toPositiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function pickEnum<T extends string>(
  raw: string | undefined,
  allowed: readonly T[],
  fallback: T | '',
): T | '' {
  return allowed.includes(raw as T) ? (raw as T) : fallback;
}

/** 从 URL 查询参数解析；任何非法值退回默认值，不抛错、不污染请求。 */
export function parseQueryFromParams(
  params: Record<string, string | undefined>,
): TicketListQuery {
  const defaults = createDefaultQuery();
  const pageSize = toPositiveInt(params.pageSize, defaults.pageSize);

  return {
    page: toPositiveInt(params.page, defaults.page),
    pageSize: (PAGE_SIZE_OPTIONS as readonly number[]).includes(pageSize)
      ? pageSize
      : defaults.pageSize,
    keyword: (params.keyword ?? '').trim(),
    status: pickEnum(params.status, STATUS_VALUES, ''),
    priority: pickEnum(params.priority, PRIORITY_VALUES, ''),
    assigneeId: (params.assigneeId ?? '').trim(),
    sortBy: pickEnum(params.sortBy, SORT_FIELDS, defaults.sortBy) || defaults.sortBy,
    sortOrder: params.sortOrder === 'asc' ? 'asc' : 'desc',
  };
}

/** 只输出与默认值不同的项，保持 URL 简短可读。 */
export function serializeQueryToParams(
  query: TicketListQuery,
): Record<string, string> {
  const defaults = createDefaultQuery();
  const params: Record<string, string> = {};

  if (query.page !== defaults.page) params.page = String(query.page);
  if (query.pageSize !== defaults.pageSize) params.pageSize = String(query.pageSize);
  if (query.keyword) params.keyword = query.keyword;
  if (query.status) params.status = query.status;
  if (query.priority) params.priority = query.priority;
  if (query.assigneeId) params.assigneeId = query.assigneeId;
  if (query.sortBy !== defaults.sortBy) params.sortBy = query.sortBy;
  if (query.sortOrder !== defaults.sortOrder) params.sortOrder = query.sortOrder;

  return params;
}

/**
 * 改动筛选条件必须回到第 1 页，否则会停在一个不存在的页码上看到空列表。
 * 只有翻页与改 pageSize 例外。
 */
export function applyFilterChange(
  current: TicketListQuery,
  patch: Partial<Omit<TicketListQuery, 'page'>>,
): TicketListQuery {
  return { ...current, ...patch, page: 1 };
}

export function applyPageChange(
  current: TicketListQuery,
  page: number,
  pageSize: number,
): TicketListQuery {
  const isPageSizeChanged = pageSize !== current.pageSize;
  return { ...current, pageSize, page: isPageSizeChanged ? 1 : page };
}

export function applySortChange(
  current: TicketListQuery,
  sortBy: TicketSortField,
  sortOrder: SortOrder,
): TicketListQuery {
  return { ...current, sortBy, sortOrder, page: 1 };
}

export function hasActiveFilter(query: TicketListQuery): boolean {
  return Boolean(query.keyword || query.status || query.priority || query.assigneeId);
}

/** 删除末页最后一条后应退回上一页，避免停在空页。 */
export function resolvePageAfterRemoval(
  query: TicketListQuery,
  totalBeforeRemoval: number,
): number {
  const totalAfter = Math.max(0, totalBeforeRemoval - 1);
  const lastPage = Math.max(1, Math.ceil(totalAfter / query.pageSize));
  return Math.min(query.page, lastPage);
}
