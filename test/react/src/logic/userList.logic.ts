// 用户列表 Logic
// 职责：列表查询参数管理、URL 参数同步、筛选条件处理

import type { UserListParams, UserRole, UserStatus, SortBy, SortOrder } from '../types/user.types';

/**
 * 默认查询参数
 */
export const DEFAULT_LIST_PARAMS: UserListParams = {
  page: 1,
  pageSize: 10,
  keyword: '',
  role: undefined,
  status: undefined,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/**
 * 页面大小选项
 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50];

/**
 * 从 URL 参数解析列表查询参数
 */
export function parseListParamsFromURL(searchParams: URLSearchParams): UserListParams {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
  const keyword = searchParams.get('keyword') || '';
  const role = searchParams.get('role') as UserRole | undefined;
  const status = searchParams.get('status') as UserStatus | undefined;
  const sortBy = (searchParams.get('sortBy') as SortBy) || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') as SortOrder) || 'desc';

  return {
    page: isNaN(page) || page < 1 ? 1 : page,
    pageSize: PAGE_SIZE_OPTIONS.includes(pageSize) ? pageSize : 10,
    keyword: keyword.trim(),
    role: role && ['admin', 'user', 'guest'].includes(role) ? role : undefined,
    status: status && ['active', 'inactive'].includes(status) ? status : undefined,
    sortBy: ['createdAt', 'name'].includes(sortBy) ? sortBy : 'createdAt',
    sortOrder: ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc',
  };
}

/**
 * 将列表查询参数转换为 URL 参数
 */
export function buildURLSearchParams(params: UserListParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  searchParams.set('page', params.page.toString());
  searchParams.set('pageSize', params.pageSize.toString());

  if (params.keyword) {
    searchParams.set('keyword', params.keyword);
  }

  if (params.role) {
    searchParams.set('role', params.role);
  }

  if (params.status) {
    searchParams.set('status', params.status);
  }

  if (params.sortBy) {
    searchParams.set('sortBy', params.sortBy);
  }

  if (params.sortOrder) {
    searchParams.set('sortOrder', params.sortOrder);
  }

  return searchParams;
}

/**
 * 更新筛选条件（重置页码到第一页）
 */
export function updateFilterParams(
  currentParams: UserListParams,
  updates: Partial<Omit<UserListParams, 'page' | 'pageSize'>>
): UserListParams {
  return {
    ...currentParams,
    ...updates,
    page: 1, // 筛选条件变化时重置到第一页
  };
}

/**
 * 更新分页参数
 */
export function updatePaginationParams(
  currentParams: UserListParams,
  page: number,
  pageSize?: number
): UserListParams {
  return {
    ...currentParams,
    page,
    pageSize: pageSize !== undefined ? pageSize : currentParams.pageSize,
  };
}

/**
 * 更新排序参数
 */
export function updateSortParams(
  currentParams: UserListParams,
  sortBy: SortBy,
  sortOrder: SortOrder
): UserListParams {
  return {
    ...currentParams,
    sortBy,
    sortOrder,
    page: 1, // 排序变化时重置到第一页
  };
}

/**
 * 清空筛选条件
 */
export function resetFilterParams(currentParams: UserListParams): UserListParams {
  return {
    ...currentParams,
    keyword: '',
    role: undefined,
    status: undefined,
    page: 1,
  };
}

/**
 * 检查是否有筛选条件
 */
export function hasActiveFilters(params: UserListParams): boolean {
  return !!(params.keyword || params.role || params.status);
}

/**
 * 计算分页信息
 */
export function calculatePagination(total: number, page: number, pageSize: number) {
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    totalPages,
    hasNextPage,
    hasPrevPage,
    isFirstPage: page === 1,
    isLastPage: page === totalPages || totalPages === 0,
  };
}
