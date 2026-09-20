// 用户表单组件（第一部分）
// 职责：展示表单字段，收集输入，触发验证，通过回调上报提交事件

import React, { useState, useEffect, useCallback } from 'react';
import type { UserFormData, UserRole, UserStatus, ValidationError } from '../types/user.types';
import {
  validateField,
  validateFile,
  getCharacterCount,
  shouldShowError,
} from '../logic/userValidation.logic';
import * as userService from '../services/user.service';

interface UserFormProps {
  initialData?: Partial<UserFormData>;
  editingUserId?: string;
  onSubmit: (formData: UserFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitError?: string;
  validationErrors?: ValidationError[];
}

export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  editingUserId,
  onSubmit,
  onCancel,
  isSubmitting,
  submitError,
  validationErrors = [],
}) => {
  // 表单数据状态
  const [formData, setFormData] = useState<Partial<UserFormData>>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    role: initialData?.role || undefined,
    status: initialData?.status || 'active',
    department: initialData?.department || '',
    avatar: initialData?.avatar || '',
    remark: initialData?.remark || '',
  });

  // 字段错误状态
  const [fieldErrors, setFieldErrors] = useState<Map<string, string>>(new Map());

  // 已触摸的字段（失焦过的字段）
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // 是否已提交过
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // 部门搜索相关
  const [departmentOptions, setDepartmentOptions] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [isDepartmentLoading, setIsDepartmentLoading] = useState(false);

  // 手机号异步验证状态
  const [isPhoneValidating, setIsPhoneValidating] = useState(false);

  // 头像上传状态
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  // 更新提交后的验证错误
  useEffect(() => {
    if (validationErrors.length > 0) {
      const errorMap = new Map<string, string>();
      validationErrors.forEach((error) => {
        errorMap.set(error.field, error.message);
      });
      setFieldErrors(errorMap);
      setHasSubmitted(true);
    }
  }, [validationErrors]);

  // 处理字段变化
  const handleFieldChange = useCallback(
    (fieldName: keyof UserFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [fieldName]: value }));

      // onChange 实时验证（如果已经显示过错误）
      if (shouldShowError(fieldName, touchedFields, hasSubmitted)) {
        const error = validateField(fieldName, value, formData);
        setFieldErrors((prev) => {
          const newErrors = new Map(prev);
          if (error) {
            newErrors.set(fieldName, error.message);
          } else {
            newErrors.delete(fieldName);
          }
          return newErrors;
        });
      }
    },
    [touchedFields, hasSubmitted, formData]
  );

  // 处理字段失焦
  const handleFieldBlur = useCallback(
    async (fieldName: keyof UserFormData) => {
      setTouchedFields((prev) => new Set(prev).add(fieldName));

      const value = formData[fieldName];
      const error = validateField(fieldName, value, formData);

      setFieldErrors((prev) => {
        const newErrors = new Map(prev);
        if (error) {
          newErrors.set(fieldName, error.message);
        } else {
          newErrors.delete(fieldName);
        }
        return newErrors;
      });

      // 手机号失焦时异步验证唯一性
      if (fieldName === 'phone' && value && !error) {
        await validatePhoneUniqueness(value as string);
      }
    },
    [formData]
  );

  // 异步验证手机号唯一性
  const validatePhoneUniqueness = useCallback(
    async (phone: string) => {
      setIsPhoneValidating(true);

      const result = await userService.checkPhoneAvailability({
        phone,
        excludeId: editingUserId,
      });

      setIsPhoneValidating(false);

      if (result.success && result.data) {
        if (!result.data.available) {
          setFieldErrors((prev) => {
            const newErrors = new Map(prev);
            newErrors.set('phone', '该手机号已被使用');
            return newErrors;
          });
        }
      }
    },
    [editingUserId]
  );

  // 搜索部门（防抖已在组件内实现）
  const searchDepartments = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setDepartmentOptions([]);
      return;
    }

    setIsDepartmentLoading(true);

    const result = await userService.searchDepartments(keyword);

    setIsDepartmentLoading(false);

    if (result.success && result.data) {
      setDepartmentOptions(result.data);
    }
  }, []);

  // 部门搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.department) {
        searchDepartments(formData.department);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.department, searchDepartments]);

  // 处理头像上传
  const handleAvatarUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 验证文件
      const fileError = validateFile(file);
      if (fileError) {
        setFieldErrors((prev) => {
          const newErrors = new Map(prev);
          newErrors.set('avatar', fileError.message);
          return newErrors;
        });
        return;
      }

      setIsAvatarUploading(true);
      setFieldErrors((prev) => {
        const newErrors = new Map(prev);
        newErrors.delete('avatar');
        return newErrors;
      });

      const result = await userService.uploadAvatar(file);

      setIsAvatarUploading(false);

      if (result.success && result.data) {
        handleFieldChange('avatar', result.data.url);
      } else {
        setFieldErrors((prev) => {
          const newErrors = new Map(prev);
          newErrors.set('avatar', result.error?.message || '上传失败');
          return newErrors;
        });
      }
    },
    [handleFieldChange]
  );

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);

    // 转换为完整的 UserFormData
    const completeFormData: UserFormData = {
      name: formData.name || '',
      email: formData.email || '',
      phone: formData.phone || '',
      role: formData.role || 'user',
      status: formData.status || 'active',
      department: formData.department,
      avatar: formData.avatar,
      remark: formData.remark,
    };

    onSubmit(completeFormData);
  };

  // 检查是否有未保存的修改
  const hasUnsavedChanges = (): boolean => {
    if (!initialData) return true;

    return Object.keys(formData).some((key) => {
      const fieldKey = key as keyof UserFormData;
      return formData[fieldKey] !== initialData[fieldKey];
    });
  };

  // 处理取消
  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      const confirmed = window.confirm('有未保存的修改，确定要关闭吗？');
      if (!confirmed) return;
    }

    onCancel();
  };

  // 获取字段错误信息
  const getFieldError = (fieldName: string): string | undefined => {
    if (!shouldShowError(fieldName, touchedFields, hasSubmitted)) {
      return undefined;
    }
    return fieldErrors.get(fieldName);
  };

  return (
    <form onSubmit={handleSubmit} className="user-form">
      {/* 表单级错误 */}
      {submitError && <div className="form-error">{submitError}</div>}

      {/* 姓名字段 */}
      <div className="form-field">
        <label className="form-label required">
          姓名
          <span className="char-count">
            {getCharacterCount(formData.name)} / 20
          </span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          onBlur={() => handleFieldBlur('name')}
          className={getFieldError('name') ? 'input-error' : ''}
          disabled={isSubmitting}
          maxLength={20}
        />
        {getFieldError('name') && (
          <div className="field-error">{getFieldError('name')}</div>
        )}
      </div>

      {/* 邮箱字段 */}
      <div className="form-field">
        <label className="form-label required">邮箱</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          onBlur={() => handleFieldBlur('email')}
          className={getFieldError('email') ? 'input-error' : ''}
          disabled={isSubmitting}
        />
        {getFieldError('email') && (
          <div className="field-error">{getFieldError('email')}</div>
        )}
      </div>

      {/* 手机号字段 */}
      <div className="form-field">
        <label className="form-label required">
          手机号
          {isPhoneValidating && <span className="validating-indicator"> 验证中...</span>}
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => handleFieldChange('phone', e.target.value)}
          onBlur={() => handleFieldBlur('phone')}
          className={getFieldError('phone') ? 'input-error' : ''}
          disabled={isSubmitting}
          maxLength={11}
        />
        {getFieldError('phone') && (
          <div className="field-error">{getFieldError('phone')}</div>
        )}
      </div>

      {/* 角色字段 */}
      <div className="form-field">
        <label className="form-label required">角色</label>
        <select
          value={formData.role || ''}
          onChange={(e) => handleFieldChange('role', e.target.value as UserRole)}
          onBlur={() => handleFieldBlur('role')}
          className={getFieldError('role') ? 'input-error' : ''}
          disabled={isSubmitting}
        >
          <option value="">请选择角色</option>
          <option value="admin">管理员</option>
          <option value="user">普通用户</option>
          <option value="guest">访客</option>
        </select>
        {getFieldError('role') && (
          <div className="field-error">{getFieldError('role')}</div>
        )}
      </div>

      {/* 状态字段 */}
      <div className="form-field">
        <label className="form-label required">状态</label>
        <select
          value={formData.status || 'active'}
          onChange={(e) => handleFieldChange('status', e.target.value as UserStatus)}
          onBlur={() => handleFieldBlur('status')}
          className={getFieldError('status') ? 'input-error' : ''}
          disabled={isSubmitting}
        >
          <option value="active">启用</option>
          <option value="inactive">禁用</option>
        </select>
        {getFieldError('status') && (
          <div className="field-error">{getFieldError('status')}</div>
        )}
      </div>

      {/* 部门字段（异步搜索） */}
      <div className="form-field">
        <label className="form-label">
          部门
          {isDepartmentLoading && <span className="loading-indicator"> 加载中...</span>}
        </label>
        <input
          type="text"
          value={formData.department}
          onChange={(e) => handleFieldChange('department', e.target.value)}
          placeholder="输入部门名称搜索"
          disabled={isSubmitting}
          list="department-options"
        />
        <datalist id="department-options">
          {departmentOptions.map((dept) => (
            <option key={dept.id} value={dept.name} />
          ))}
        </datalist>
      </div>

      {/* 头像字段 */}
      <div className="form-field">
        <label className="form-label">头像</label>
        {formData.avatar && (
          <div className="avatar-preview">
            <img src={formData.avatar} alt="头像预览" />
          </div>
        )}
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleAvatarUpload}
          disabled={isSubmitting || isAvatarUploading}
        />
        {isAvatarUploading && <div className="upload-progress">上传中...</div>}
        {getFieldError('avatar') && (
          <div className="field-error">{getFieldError('avatar')}</div>
        )}
        <div className="field-hint">仅支持 JPG、PNG 格式，文件大小不超过 2MB</div>
      </div>

      {/* 备注字段 */}
      <div className="form-field">
        <label className="form-label">
          备注
          <span className="char-count">
            {getCharacterCount(formData.remark)} / 200
          </span>
        </label>
        <textarea
          value={formData.remark}
          onChange={(e) => handleFieldChange('remark', e.target.value)}
          onBlur={() => handleFieldBlur('remark')}
          className={getFieldError('remark') ? 'input-error' : ''}
          disabled={isSubmitting}
          maxLength={200}
          rows={4}
        />
        {getFieldError('remark') && (
          <div className="field-error">{getFieldError('remark')}</div>
        )}
      </div>

      {/* 表单操作按钮 */}
      <div className="form-actions">
        <button
          type="button"
          onClick={handleCancel}
          className="btn-cancel"
          disabled={isSubmitting}
        >
          取消
        </button>
        <button
          type="submit"
          className="btn-submit"
          disabled={isSubmitting || isPhoneValidating || isAvatarUploading}
        >
          {isSubmitting ? '提交中...' : editingUserId ? '保存' : '创建'}
        </button>
      </div>
    </form>
  );
};
