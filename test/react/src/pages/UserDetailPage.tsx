// 用户详情页
// 职责：组装详情展示和操作记录，管理页面状态

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserDetailInfo } from '../components/UserDetailInfo';
import { OperationLogList } from '../components/OperationLogList';
import { ErrorPlaceholder } from '../components/ErrorPlaceholder';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { UserFormModal } from '../components/UserFormModal';
import { useUserDetail } from '../hooks/useUserDetail';
import { useUserLogs } from '../hooks/useUserLogs';
import { useUserFormSubmit } from '../hooks/useUserFormSubmit';
import type { UserFormData } from '../types/user.types';

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 用户详情加载
  const {
    state: detailState,
    data: userData,
    error: detailError,
    loadUserDetail,
    refreshUserDetail,
  } = useUserDetail();

  // 操作记录加载
  const {
    state: logsState,
    data: logsData,
    error: logsError,
    hasMore,
    loadLogs,
    loadMore,
  } = useUserLogs(id || '');

  // 表单提交
  const {
    isSubmitting: isFormSubmitting,
    error: formSubmitError,
    validationErrors: formValidationErrors,
    submitUpdate,
    clearError: clearFormError,
  } = useUserFormSubmit();

  // 编辑弹窗状态
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // 初始加载
  useEffect(() => {
    if (id) {
      loadUserDetail(id);
      loadLogs(id, { page: 1, pageSize: 10 });
    }
  }, [id]);

  // 打开编辑弹窗
  const handleEdit = useCallback(() => {
    setIsEditModalVisible(true);
    clearFormError();
  }, [clearFormError]);

  // 关闭编辑弹窗
  const handleEditCancel = useCallback(() => {
    setIsEditModalVisible(false);
    clearFormError();
  }, [clearFormError]);

  // 处理编辑提交
  const handleEditSubmit = useCallback(
    async (formData: UserFormData): Promise<boolean> => {
      if (!id) return false;

      const success = await submitUpdate(id, formData);

      if (success) {
        setIsEditModalVisible(false);
        await refreshUserDetail();
        alert('保存成功');
      }

      return success;
    },
    [id, submitUpdate, refreshUserDetail]
  );

  // 返回列表
  const handleBackToList = useCallback(() => {
    navigate('/users');
  }, [navigate]);

  // 加载更多操作记录
  const handleLoadMoreLogs = useCallback(() => {
    loadMore();
  }, [loadMore]);

  // 详情加载中
  if (detailState === 'loading') {
    return (
      <div className="user-detail-page">
        <LoadingSkeleton />
      </div>
    );
  }

  // 详情加载失败
  if (detailState === 'error') {
    return (
      <div className="user-detail-page">
        <ErrorPlaceholder
          message={detailError || '用户不存在或已删除'}
          onRetry={() => id && loadUserDetail(id)}
          onBack={handleBackToList}
        />
      </div>
    );
  }

  // 详情加载成功
  if (detailState === 'success' && userData) {
    return (
      <div className="user-detail-page">
        <div className="page-header">
          <button className="btn-back" onClick={handleBackToList}>
            ← 返回列表
          </button>
        </div>

        <div className="page-content">
          {/* 用户基本信息 */}
          <UserDetailInfo user={userData} onEdit={handleEdit} />

          {/* 操作记录 */}
          <div className="operation-logs-section">
            {logsState === 'loading' && logsData.length === 0 && (
              <div className="logs-loading">加载操作记录中...</div>
            )}

            {logsState === 'error' && logsData.length === 0 && (
              <div className="logs-error">
                <p>{logsError || '操作记录加载失败'}</p>
                <button onClick={() => id && loadLogs(id, { page: 1, pageSize: 10 })}>
                  重试
                </button>
              </div>
            )}

            {(logsState === 'success' || logsState === 'empty' || logsData.length > 0) && (
              <OperationLogList
                logs={logsData}
                hasMore={hasMore}
                isLoading={logsState === 'loading'}
                onLoadMore={handleLoadMoreLogs}
              />
            )}
          </div>
        </div>

        {/* 编辑弹窗 */}
        <UserFormModal
          visible={isEditModalVisible}
          editingUserId={id}
          onSubmit={handleEditSubmit}
          onCancel={handleEditCancel}
          isSubmitting={isFormSubmitting}
          submitError={formSubmitError || undefined}
          validationErrors={formValidationErrors}
        />
      </div>
    );
  }

  return null;
};
