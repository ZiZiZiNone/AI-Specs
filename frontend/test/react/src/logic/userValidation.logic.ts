// 用户表单验证 Logic
// 职责：定义验证规则、执行验证逻辑，框架无关

import type { UserFormData, ValidationError } from '../types/user.types';

/**
 * 验证规则接口
 */
export interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
  min?: number;
  max?: number;
  validator?: (value: any, formData?: Partial<UserFormData>) => boolean;
  message: string;
}

/**
 * 字段验证规则映射
 */
export type FieldValidationRules = {
  [K in keyof UserFormData]?: ValidationRule[];
};

/**
 * 用户表单验证规则
 */
export const userFormValidationRules: FieldValidationRules = {
  name: [
    {
      required: true,
      message: '请输入姓名',
    },
    {
      min: 2,
      max: 20,
      message: '姓名长度为 2-20 个字符',
    },
  ],
  email: [
    {
      required: true,
      message: '请输入邮箱',
    },
    {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: '请输入正确的邮箱地址',
    },
  ],
  phone: [
    {
      required: true,
      message: '请输入手机号',
    },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号',
    },
  ],
  role: [
    {
      required: true,
      message: '请选择角色',
    },
  ],
  status: [
    {
      required: true,
      message: '请选择状态',
    },
  ],
  remark: [
    {
      max: 200,
      message: '备注最多 200 个字符',
    },
  ],
};

/**
 * 验证单个字段
 */
export function validateField(
  fieldName: keyof UserFormData,
  value: any,
  formData?: Partial<UserFormData>
): ValidationError | null {
  const rules = userFormValidationRules[fieldName];

  if (!rules) {
    return null;
  }

  for (const rule of rules) {
    // 必填验证
    if (rule.required) {
      if (value === undefined || value === null || value === '') {
        return {
          field: fieldName,
          message: rule.message,
        };
      }

      // 字符串类型去除空格后检查
      if (typeof value === 'string' && value.trim() === '') {
        return {
          field: fieldName,
          message: rule.message,
        };
      }
    }

    // 如果值为空且非必填，跳过后续验证
    if (value === undefined || value === null || value === '') {
      continue;
    }

    // 格式验证
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        return {
          field: fieldName,
          message: rule.message,
        };
      }
    }

    // 最小长度/值验证
    if (rule.min !== undefined) {
      if (typeof value === 'string' && value.length < rule.min) {
        return {
          field: fieldName,
          message: rule.message,
        };
      }
      if (typeof value === 'number' && value < rule.min) {
        return {
          field: fieldName,
          message: rule.message,
        };
      }
    }

    // 最大长度/值验证
    if (rule.max !== undefined) {
      if (typeof value === 'string' && value.length > rule.max) {
        return {
          field: fieldName,
          message: rule.message,
        };
      }
      if (typeof value === 'number' && value > rule.max) {
        return {
          field: fieldName,
          message: rule.message,
        };
      }
    }

    // 自定义验证器
    if (rule.validator) {
      if (!rule.validator(value, formData)) {
        return {
          field: fieldName,
          message: rule.message,
        };
      }
    }
  }

  return null;
}

/**
 * 验证整个表单
 */
export function validateForm(formData: Partial<UserFormData>): ValidationError[] {
  const errors: ValidationError[] = [];

  // 验证所有必填和已填写的字段
  const fieldsToValidate: (keyof UserFormData)[] = [
    'name',
    'email',
    'phone',
    'role',
    'status',
  ];

  // 添加可选字段（如果已填写）
  if (formData.remark !== undefined && formData.remark !== '') {
    fieldsToValidate.push('remark');
  }

  for (const fieldName of fieldsToValidate) {
    const value = formData[fieldName];
    const error = validateField(fieldName, value, formData);

    if (error) {
      errors.push(error);
    }
  }

  return errors;
}

/**
 * 验证文件类型和大小
 */
export function validateFile(file: File): ValidationError | null {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const maxSize = 2 * 1024 * 1024; // 2MB

  // 验证文件类型
  if (!allowedTypes.includes(file.type)) {
    return {
      field: 'avatar',
      message: '仅支持 JPG、PNG 格式的图片',
    };
  }

  // 验证文件大小
  if (file.size > maxSize) {
    return {
      field: 'avatar',
      message: '文件大小不能超过 2MB',
    };
  }

  return null;
}

/**
 * 获取字段的字符计数
 */
export function getCharacterCount(value: string | undefined): number {
  if (!value) {
    return 0;
  }
  return value.length;
}

/**
 * 检查字段是否应该显示错误
 * 规则：首次输入不显示错误，失焦后或提交后显示
 */
export function shouldShowError(
  fieldName: string,
  touchedFields: Set<string>,
  hasSubmitted: boolean
): boolean {
  return touchedFields.has(fieldName) || hasSubmitted;
}
