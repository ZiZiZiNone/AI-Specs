// 用户列表页
// 职责：组装组件、管理页面级状态、处理 URL 参数同步

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserFilter } from '../components/UserFilter';
import { UserTable } from '../components/UserTable';
import { Pagination } from '../components/Pagination';
import { EmptyPlaceholder } from '../components/EmptyPlaceholder';
import { ErrorPlaceholder } from '../components/ErrorPlaceholder';
import { TableLoadingSkeleton } from '../components/LoadingSkeleton';
import { UserFormModal } from '../components/UserFormModal';
import { useUserList } from '../hooks/useUserList';
import { useUserFormSubmit } from '../hooks/useUserFormSubmit';
import * as userListLogic from '../logic/userList.logic';
import * as userService from '../services/user.service';
import type { UserListParams, UserFormData, SortBy, SortOrder } from '../types/user.types';

export const UserListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 从 URL 解析查询参数
  const listParams = userListLogic.parseListParamsFromURL(searchParams);

  // 使用列表加载 Hook
  const { state, data, total, error, loadUsers, refreshUsers } = useUserList(listParams);

  // 使用表单提交 Hook
  const {
    isSubmitting: isFormSubmitting,
    error: formSubmitError,
    validationErrors: formValidationErrors,
    submitCreate,
    submitUpdate,
    clearError: clearFormError,
  } = useUserFormSubmit();

  // 表单弹窗状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | undefined>(undefined);

  // 初始加载和参数变化时重新加载
  useEffect(() => {
    loadUsers(listParams);
  }, [searchParams]); // 依赖 searchParams 而不是 listParams，避免重复渲染

  // 更新 URL 参数
  const updateURLParams = useCallback(
    (newParams: UserListParams) => {
      const newSearchParams = userListLogic.buildURLSearchParams(newParams);
      setSearchParams(newSearchParams);
    },
    [setSearchParams]
  );

  // 处理筛选变化
  const handleFilterChange = useCallback(
    (filters: { keyword: string; role?: string; status?: string }) => {
      const newParams = userListLogic.updateFilterParams(listParams, filters);
      updateURLParams(newParams);
    },
    [listParams, updateURLParams]
  );

  // 处理重置筛选
  const handleResetFilter = useCallback(() => {
    const newParams = userListLogic.resetFilterParams(listParams);
    updateURLParams(newParams);
  }, [listParams, updateURLParams]);

  // 处理分页变化
  const handlePageChange = useCallback(
    (page: number) => {
      const newParams = userListLogic.updatePaginationParams(listParams, page);
      updateURLParams(newParams);
    },
    [listParams, updateURLParams]
  );

  // 处理页面大小变化
  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      const newParams = userListLogic.updatePaginationParams(listParams, 1, pageSize);
      updateURLParams(newParams);
    },
    [listParams, updateURLParams]
  );

  // 处理排序变化
  const handleSortChange = useCallback(
    (sortBy: SortBy, sortOrder: SortOrder) => {
      const newParams = userListLogic.updateSortParams(listParams, sortBy, sortOrder);
      updateURLParams(newParams);
    },
    [listParams, updateURLParams]
  );

  // 打开新增用户弹窗
  const handleCreate = useCallback(() => {
    setEditingUserId(undefined);
    setIsModalVisible(true);
    clearFormError();
  }, [clearFormError]);

  // 打开编辑用户弹窗
  const handleEdit = useCallback(
    (userId: string) => {
      setEditingUserId(userId);
      setIsModalVisible(true);
      clearFormError();
    },
    [clearFormError]
  );

  // 关闭表单弹窗
  const handleModalCancel = useCallback(() => {
    setIsModalVisible(false);
    setEditingUserId(undefined);
    clearFormError();
  }, [clearFormError]);

  // 处理表单提交
  const handleFormSubmit = useCallback(
    async (formData: UserFormData): Promise<boolean> => {
      let success = false;

      if (editingUserId) {
        success = await submitUpdate(editingUserId, formData);
      } else {
        success = await submitCreate(formData);
      }

      if (success) {
        setIsModalVisible(false);
        setEditingUserId(undefined);
        await refreshUsers();
        alert('操作成功');
      }

      return success;
    },
    [editingUserId, submitCreate, submitUpdate, refreshUsers]
  );

  // 查看用户详情
  const handleView = useCallback(
    (userId: string) => {
      navigate(`/users/${userId}`);
    },
    [navigate]
  );

  // 删除用户
  const handleDelete = useCallback(
    async (userId: string) => {
      const confirmed = window.confirm('确定要删除该用户吗？此操作无法撤销。');
      if (!confirmed) return;

      const result = await userService.deleteUser(userId);

      if (result.success) {
        alert('删除成功');
        await refreshUsers();
      } else {
        alert(result.error?.message || '删除失败');
      }
    },
    [refreshUsers]
  );

  // 切换用户状态
  const handleToggleStatus = useCallback(
    async (userId: string, currentStatus: 'active' | 'inactive') => {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const action = newStatus === 'active' ? '启用' : '禁用';
      const confirmed = window.confirm(`确定要${action}该用户吗？`);
      if (!confirmed) return;

      const result = await userService.toggleUserStatus(userId, newStatus);

      if (result.success) {
        alert(`${action}成功`);
        await refreshUsers();
      } else {
        alert(result.error?.message || `${action}失败`);
      }
    },
    [refreshUsers]
  );

  return (
    <div className="user-list-page">
      <div className="page-header">
        <h1>用户管理</h1>
        <button className="btn-create" onClick={handleCreate}>
          新增用户
        </button>
      </div>

      {/* 筛选器 */}
      <UserFilter
        keyword={listParams.keyword || ''}
        role={listParams.role}
        status={listParams.status}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilter}
      />

      {/* 列表内容 */}
      <div className="page-content">
        {state === 'loading' && <TableLoadingSkeleton />}

        {state === 'error' && (
          <ErrorPlaceholder
            message={error || '加载失败，请稍后重试'}
            onRetry={refreshUsers}
          />
        )}

        {state === 'empty' && (
          <EmptyPlaceholder
            message={
              userListLogic.hasActiveFilters(listParams)
                ? '未找到符合条件的用户'
                : '暂无用户数据'
            }
            actionText={
              userListLogic.hasActiveFilters(listParams) ? '清空筛选' : '新增用户'
            }
            onAction={
              userListLogic.hasActiveFilters(listParams)
                ? handleResetFilter
                : handleCreate
            }
          />
        )}

        {state === 'success' && (
          <>
            <UserTable
              data={data}
              sortBy={listParams.sortBy}
              sortOrder={listParams.sortOrder}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onSort={handleSortChange}
            />

            <Pagination
              current={listParams.page}
              pageSize={listParams.pageSize}
              total={total}
              pageSizeOptions={userListLogic.PAGE_SIZE_OPTIONS}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </>
        )}
      </div>

      {/* 表单弹窗 */}
      <UserFormModal
        visible={isModalVisible}
        editingUserId={editingUserId}
        onSubmit={handleFormSubmit}
        onCancel={handleModalCancel}
        isSubmitting={isFormSubmitting}
        submitError={formSubmitError || undefined}
        validationErrors={formValidationErrors}
      />
    </div>
  );
};
