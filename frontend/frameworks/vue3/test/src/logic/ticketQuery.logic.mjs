/**
 * 列表查询纯逻辑（URL 互逆编解码、排序/筛选回页、批量删除动态页码修正）。
 */
export const DEFAULT_QUERY = Object.freeze({
  keyword: '',
  status: '',
  page: 1,
  pageSize: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
});

function firstString(val) {
  if (Array.isArray(val)) return typeof val[0] === 'string' ? val[0] : '';
  return typeof val === 'string' ? val : '';
}

export function parseTicketQuery(rawQuery = {}) {
  const rawPage = Number.parseInt(firstString(rawQuery.page), 10);
  const rawSize = Number.parseInt(firstString(rawQuery.pageSize), 10);
  const sortOrder = firstString(rawQuery.sortOrder);
  return {
    keyword: firstString(rawQuery.keyword).trim(),
    status: firstString(rawQuery.status).trim(),
    page: Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : DEFAULT_QUERY.page,
    pageSize: Number.isFinite(rawSize) && rawSize >= 1 ? Math.min(rawSize, 100) : DEFAULT_QUERY.pageSize,
    sortBy: firstString(rawQuery.sortBy) || DEFAULT_QUERY.sortBy,
    sortOrder: sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : DEFAULT_QUERY.sortOrder,
  };
}

export function serializeTicketQuery(query) {
  const out = {};
  if (query.keyword) out.keyword = query.keyword;
  if (query.status) out.status = query.status;
  if (query.page !== DEFAULT_QUERY.page) out.page = String(query.page);
  if (query.pageSize !== DEFAULT_QUERY.pageSize) out.pageSize = String(query.pageSize);
  if (query.sortBy !== DEFAULT_QUERY.sortBy) out.sortBy = query.sortBy;
  if (query.sortOrder !== DEFAULT_QUERY.sortOrder) out.sortOrder = query.sortOrder;
  return out;
}

export function applyQueryPatch(current, patch) {
  const resetsPage =
    ('keyword' in patch && patch.keyword !== current.keyword) ||
    ('status' in patch && patch.status !== current.status) ||
    ('pageSize' in patch && patch.pageSize !== current.pageSize) ||
    ('sortBy' in patch && patch.sortBy !== current.sortBy) ||
    ('sortOrder' in patch && patch.sortOrder !== current.sortOrder);
  return {
    ...current,
    ...patch,
    page: resetsPage ? 1 : (patch.page ?? current.page),
  };
}

export function resolvePageAfterRemoval(currentQuery, totalBefore, removedCount) {
  const remaining = Math.max(0, totalBefore - removedCount);
  const maxPage = Math.max(1, Math.ceil(remaining / currentQuery.pageSize));
  return Math.min(currentQuery.page, maxPage);
}
