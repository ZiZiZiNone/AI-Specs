// 用户管理系统类型定义

/**
 * 用户角色枚举
 */
export type UserRole = 'admin' | 'user' | 'guest';

/**
 * 用户状态枚举
 */
export type UserStatus = 'active' | 'inactive';

/**
 * UI 状态枚举
 */
export type UIState = 'idle' | 'loading' | 'success' | 'error' | 'empty';

/**
 * 排序字段
 */
export type SortBy = 'createdAt' | 'name';

/**
 * 排序方向
 */
export type SortOrder = 'asc' | 'desc';

/**
 * 用户实体
 */
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  department?: string;
  remark?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 用户列表查询参数
 */
export interface UserListParams {
  page: number;
  pageSize: number;
  keyword?: string;
  role?: UserRole;
  status?: UserStatus;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
}

/**
 * 分页响应数据
 */
export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 用户表单数据
 */
export interface UserFormData {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  avatar?: string;
  remark?: string;
}

/**
 * 部门选项
 */
export interface Department {
  id: string;
  name: string;
}

/**
 * 操作记录
 */
export interface OperationLog {
  id: string;
  type: string;
  time: string;
  operator: string;
  description: string;
}

/**
 * 操作记录列表参数
 */
export interface LogListParams {
  page: number;
  pageSize: number;
}

/**
 * 标准 API 响应
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * API 错误对象
 */
export interface ApiError {
  code: string;
  message: string;
  type: 'network' | 'business' | 'client';
  details?: any;
  retryable: boolean;
}

/**
 * 表单验证错误
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * 上传响应
 */
export interface UploadResponse {
  url: string;
}

/**
 * 手机号验证请求
 */
export interface CheckPhoneRequest {
  phone: string;
  excludeId?: string;
}

/**
 * 手机号验证响应
 */
export interface CheckPhoneResponse {
  available: boolean;
}
