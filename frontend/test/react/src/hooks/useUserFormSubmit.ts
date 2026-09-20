// 用户表单提交 Hook
// 职责：封装表单提交的 UI 状态管理、调用验证 Logic 和 Service

import { useState, useCallback } from 'react';
import type { UserFormData, ValidationError } from '../types/user.types';
import * as userService from '../services/user.service';
import { validateForm } from '../logic/userValidation.logic';

interface UseUserFormSubmitResult {
  isSubmitting: boolean;
  error: string | null;
  validationErrors: ValidationError[];
  submitCreate: (formData: UserFormData) => Promise<boolean>;
  submitUpdate: (id: string, formData: UserFormData) => Promise<boolean>;
  clearError: () => void;
}

/**
 * 用户表单提交 Hook
 */
export function useUserFormSubmit(): UseUserFormSubmitResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const submitCreate = useCallback(async (formData: UserFormData): Promise<boolean> => {
    // 提交前完整验证
    const errors = validateForm(formData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return false;
    }

    setIsSubmitting(true);
    setError(null);
    setValidationErrors([]);

    const result = await userService.createUser(formData);

    setIsSubmitting(false);

    if (result.success) {
      return true;
    } else {
      setError(result.error?.message || '创建失败，请稍后重试');
      return false;
    }
  }, []);

  const submitUpdate = useCallback(
    async (id: string, formData: UserFormData): Promise<boolean> => {
      // 提交前完整验证
      const errors = validateForm(formData);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return false;
      }

      setIsSubmitting(true);
      setError(null);
      setValidationErrors([]);

      const result = await userService.updateUser(id, formData);

      setIsSubmitting(false);

      if (result.success) {
        return true;
      } else {
        setError(result.error?.message || '更新失败，请稍后重试');
        return false;
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
    setValidationErrors([]);
  }, []);

  return {
    isSubmitting,
    error,
    validationErrors,
    submitCreate,
    submitUpdate,
    clearError,
  };
}
