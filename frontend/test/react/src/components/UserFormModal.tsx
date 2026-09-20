// 用户表单弹窗组件
// 职责：展示弹窗容器，加载编辑时的用户数据，管理表单状态

import React, { useEffect, useState } from 'react';
import { UserForm } from './UserForm';
import { LoadingSkeleton } from './LoadingSkeleton';
import type { UserFormData, User } from '../types/user.types';
import * as userService from '../services/user.service';

interface UserFormModalProps {
  visible: boolean;
  editingUserId?: string;
  onSubmit: (formData: UserFormData) => Promise<boolean>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitError?: string;
  validationErrors?: Array<{ field: string; message: string }>;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  visible,
  editingUserId,
  onSubmit,
  onCancel,
  isSubmitting,
  submitError,
  validationErrors,
}) => {
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [initialData, setInitialData] = useState<Partial<UserFormData> | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 编辑模式：加载用户详情
  useEffect(() => {
    if (visible && editingUserId) {
      loadUserDetail(editingUserId);
    } else if (visible && !editingUserId) {
      // 新增模式：清空初始数据
      setInitialData(undefined);
      setLoadError(null);
    }
  }, [visible, editingUserId]);

  const loadUserDetail = async (userId: string) => {
    setIsLoadingDetail(true);
    setLoadError(null);

    const result = await userService.fetchUserDetail(userId);

    setIsLoadingDetail(false);

    if (result.success && result.data) {
      const user = result.data;
      setInitialData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        department: user.department,
        avatar: user.avatar,
        remark: user.remark,
      });
    } else {
      setLoadError(result.error?.message || '加载用户信息失败');
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingUserId ? '编辑用户' : '新增用户'}</h2>
          <button className="modal-close" onClick={onCancel}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {isLoadingDetail ? (
            <LoadingSkeleton />
          ) : loadError ? (
            <div className="load-error">
              <p>{loadError}</p>
              <button onClick={() => loadUserDetail(editingUserId!)}>重试</button>
            </div>
          ) : (
            <UserForm
              initialData={initialData}
              editingUserId={editingUserId}
              onSubmit={onSubmit}
              onCancel={onCancel}
              isSubmitting={isSubmitting}
              submitError={submitError}
              validationErrors={validationErrors}
            />
          )}
        </div>
      </div>
    </div>
  );
};
