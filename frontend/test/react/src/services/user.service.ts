// 用户管理 Service 层
// 职责：唯一的接口访问入口，统一错误处理和数据转换

import axios, { AxiosError } from 'axios';
import type {
  ApiResponse,
  ApiError,
  User,
  UserListParams,
  PaginatedData,
  UserFormData,
  Department,
  OperationLog,
  LogListParams,
  UploadResponse,
  CheckPhoneRequest,
  CheckPhoneResponse,
} from '../types/user.types';

/**
 * 转换错误为标准错误对象
 */
function transformError(error: any): ApiError {
  // 网络错误
  if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
    return {
      code: 'NETWORK_ERROR',
      message: '网络连接失败，请检查网络后重试',
      type: 'network',
      retryable: true,
    };
  }

  // 超时错误
  if (error.code === 'ETIMEDOUT') {
    return {
      code: 'TIMEOUT',
      message: '请求超时，请稍后重试',
      type: 'network',
      retryable: true,
    };
  }

  // HTTP 错误
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    const status = axiosError.response?.status;

    // 业务错误（后端返回的错误）
    if (axiosError.response?.data?.error) {
      const backendError = axiosError.response.data.error;
      return {
        code: backendError.code || 'UNKNOWN_ERROR',
        message: backendError.message || '操作失败，请稍后重试',
        type: 'business',
        retryable: false,
        details: backendError,
      };
    }

    // HTTP 状态码错误
    if (status) {
      if (status >= 500) {
        return {
          code: 'SERVER_ERROR',
          message: '服务器错误，请稍后重试',
          type: 'network',
          retryable: true,
        };
      }

      if (status === 404) {
        return {
          code: 'NOT_FOUND',
          message: '请求的资源不存在',
          type: 'business',
          retryable: false,
        };
      }

      if (status === 403) {
        return {
          code: 'FORBIDDEN',
          message: '权限不足',
          type: 'business',
          retryable: false,
        };
      }

      if (status === 401) {
        return {
          code: 'UNAUTHORIZED',
          message: '登录已过期，请重新登录',
          type: 'business',
          retryable: false,
        };
      }
    }
  }

  // 未知错误
  return {
    code: 'UNKNOWN_ERROR',
    message: '操作失败，请稍后重试',
    type: 'client',
    retryable: false,
    details: error,
  };
}

/**
 * 获取用户列表
 */
export async function fetchUserList(
  params: UserListParams
): Promise<ApiResponse<PaginatedData<User>>> {
  try {
    const response = await axios.get<{ success: boolean; data: PaginatedData<User> }>(
      '/api/users',
      {
        params,
        timeout: 10000,
      }
    );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: transformError(error),
    };
  }
}

/**
 * 获取用户详情
 */
export async function fetchUserDetail(id: string): Promise<ApiResponse<User>> {
  try {
    const response = await axios.get<{ success: boolean; data: User }>(
      `/api/users/${id}`,
      {
        timeout: 10000,
      }
    );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: transformError(error),
    };
  }
}

/**
 * 创建用户
 */
export async function createUser(data: UserFormData): Promise<ApiResponse<User>> {
  try {
    const response = await axios.post<{ success: boolean; data: User }>(
      '/api/users',
      data,
      {
        timeout: 10000,
      }
    );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: transformError(error),
    };
  }
}

/**
 * 更新用户
 */
export async function updateUser(
  id: string,
  data: UserFormData
): Promise<ApiResponse<User>> {
  try {
    const response = await axios.put<{ success: boolean; data: User }>(
      `/api/users/${id}`,
      data,
      {
        timeout: 10000,
      }
    );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: transformError(error),
    };
  }
}

/**
 * 删除用户
 */
export async function deleteUser(id: string): Promise<ApiResponse<void>> {
  try {
    await axios.delete(`/api/users/${id}`, {
      timeout: 10000,
    });

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: transformError(error),
    };
  }
}

/**
 * 切换用户状态（启用/禁用）
 */
export async function toggleUserStatus(
  id: string,
  status: 'active' | 'inactive'
): Promise<ApiResponse<User>> {
  try {
    const response = await axios.patch<{ success: boolean; data: User }>(
      `/api/users/${id}/status`,
      { status },
      {
        timeout: 10000,
      }
    );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: transformError(error),
    };
  }
}

/**
 * 搜索部门列表
 */
export async function searchDepartments(
  keyword: string
): Promise<ApiResponse<Department[]>> {
  try {
    const response = await axios.get<{ success: boolean; data: Department[] }>(
      '/api/departments',
      {
        params: { keyword },
        timeout: 10000,
      }
    );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: transformError(error),
    };
  }
}

/**
 * 上传头像
 */
export async function uploadAvatar(file: File): Promise<ApiResponse<UploadResponse>> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<{ success: boolean; data: UploadResponse }>(
      '/api/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 上传超时设置为 30 秒
      }
    );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: transformError(error),
    };
  }
}

/**
 * 验证手机号唯一性
 */
export async function checkPhoneAvailability(
  request: CheckPhoneRequest
): Promise<ApiResponse<CheckPhoneResponse>> {
  try {
    const response = await axios.post<{ success: boolean; data: CheckPhoneResponse }>(
      '/api/users/check-phone',
      request,
      {
        timeout: 10000,
      }
    );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: transformError(error),
    };
  }
}

/**
 * 获取用户操作记录
 */
export async function fetchUserLogs(
  userId: string,
  params: LogListParams
): Promise<ApiResponse<PaginatedData<OperationLog>>> {
  try {
    const response = await axios.get<{ success: boolean; data: PaginatedData<OperationLog> }>(
      `/api/users/${userId}/logs`,
      {
        params,
        timeout: 10000,
      }
    );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: transformError(error),
    };
  }
}
