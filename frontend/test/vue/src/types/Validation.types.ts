/** 校验规则契约，结构取自 rules/form-validation.md。 */

export interface ValidationRule<T = unknown> {
  required?: boolean;
  pattern?: RegExp;
  min?: number;
  max?: number;
  validator?: (value: T) => boolean;
  message: string;
}

export type ValidationRules<TValues> = {
  [K in keyof TValues]?: ValidationRule<TValues[K]>[];
};

/** 字段名 → 错误信息；无错误的字段不出现在对象中。 */
export type ValidationErrors<TValues> = Partial<Record<keyof TValues, string>>;
