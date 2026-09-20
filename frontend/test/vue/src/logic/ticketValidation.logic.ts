import type {
  ValidationErrors,
  ValidationRule,
  ValidationRules,
} from '@/types/Validation.types.ts';
import type { TicketDetail, TicketFormValues } from '@/types/Ticket.types.ts';

/**
 * 表单校验规则与执行。规则集中定义在此处（rules/form-validation.md），
 * 组件只负责在 change/blur/submit 时机调用并展示返回的错误。
 */

export const TITLE_MAX_LENGTH = 60;
export const DESCRIPTION_MAX_LENGTH = 200;
const CODE_PATTERN = /^TK-\d{6}$/;
const PHONE_PATTERN = /^1[3-9]\d{9}$/;

export function createEmptyFormValues(): TicketFormValues {
  return {
    id: '',
    code: '',
    title: '',
    status: 'open',
    priority: 'medium',
    assigneeId: '',
    contactPhone: '',
    description: '',
    attachments: [],
    needsFollowUp: false,
    followUpAt: null,
  };
}

/** 编辑回填：详情 → 表单值。转换集中在 Logic，页面不做字段搬运。 */
export function toFormValues(detail: TicketDetail): TicketFormValues {
  return {
    id: detail.id,
    code: detail.code,
    title: detail.title,
    status: detail.status,
    priority: detail.priority,
    assigneeId: detail.assignee?.id ?? '',
    contactPhone: detail.contactPhone,
    description: detail.description,
    attachments: [...detail.attachments],
    needsFollowUp: detail.needsFollowUp,
    followUpAt: detail.followUpAt,
  };
}

export const TICKET_FIELD_LABELS: Record<keyof TicketFormValues, string> = {
  id: 'ID',
  code: '工单编号',
  title: '标题',
  status: '状态',
  priority: '优先级',
  assigneeId: '处理人',
  contactPhone: '联系电话',
  description: '问题描述',
  attachments: '附件',
  needsFollowUp: '需要回访',
  followUpAt: '回访时间',
};

/**
 * 字段顺序 = 表单视觉顺序，提交失败时按此顺序聚焦第一个错误字段。
 * 单独维护而不是依赖 Object.keys，因为对象键顺序不该成为 UI 行为的依据。
 */
export const TICKET_FIELD_ORDER: readonly (keyof TicketFormValues)[] = [
  'code',
  'title',
  'priority',
  'assigneeId',
  'contactPhone',
  'description',
  'followUpAt',
  'attachments',
];

export const ticketValidationRules: ValidationRules<TicketFormValues> = {
  code: [
    { required: true, message: '请输入工单编号' },
    { pattern: CODE_PATTERN, message: '工单编号格式为 TK- 加 6 位数字，如 TK-000123' },
  ],
  title: [
    { required: true, message: '请输入标题' },
    { min: 4, max: TITLE_MAX_LENGTH, message: `标题长度为 4-${TITLE_MAX_LENGTH} 个字符` },
  ],
  contactPhone: [
    { required: true, message: '请输入联系电话' },
    { pattern: PHONE_PATTERN, message: '请输入正确的手机号' },
  ],
  description: [
    { required: true, message: '请输入问题描述' },
    { max: DESCRIPTION_MAX_LENGTH, message: `问题描述不超过 ${DESCRIPTION_MAX_LENGTH} 个字符` },
  ],
  assigneeId: [{ required: true, message: '请选择处理人' }],
  followUpAt: [{ required: true, message: '请选择回访时间' }],
  attachments: [
    {
      validator: (value) => (value ?? []).length <= 3,
      message: '最多上传 3 个附件',
    },
  ],
};

/**
 * 可见字段集合。needsFollowUp 关闭时 followUpAt 隐藏，
 * 隐藏字段不参与校验（rules/form-validation.md 动态表单）。
 */
export function resolveVisibleFields(
  values: TicketFormValues,
): readonly (keyof TicketFormValues)[] {
  return TICKET_FIELD_ORDER.filter((field) => {
    if (field === 'followUpAt') return values.needsFollowUp;
    return true;
  });
}

/** 依赖关系：被依赖字段变化时，需要重新校验的字段。 */
export function resolveDependentFields(
  changed: keyof TicketFormValues,
): readonly (keyof TicketFormValues)[] {
  return changed === 'needsFollowUp' ? ['followUpAt'] : [];
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function measureLength(value: unknown): number | null {
  if (typeof value === 'string') return value.trim().length;
  if (Array.isArray(value)) return value.length;
  return null;
}

function checkRule(value: unknown, rule: ValidationRule<never>): string | null {
  if (rule.required && isEmptyValue(value)) return rule.message;

  // 非必填字段留空时跳过后续规则，否则空值会撞上格式校验报错。
  if (isEmptyValue(value)) return null;

  if (rule.pattern && !rule.pattern.test(String(value))) return rule.message;

  const length = measureLength(value);
  if (length !== null) {
    if (rule.min !== undefined && length < rule.min) return rule.message;
    if (rule.max !== undefined && length > rule.max) return rule.message;
  }

  if (rule.validator && !rule.validator(value as never)) return rule.message;

  return null;
}

/** 单字段校验，返回首个命中的错误信息。 */
export function validateField(
  values: TicketFormValues,
  field: keyof TicketFormValues,
): string | null {
  if (!resolveVisibleFields(values).includes(field)) return null;

  const rules = ticketValidationRules[field];
  if (!rules) return null;

  for (const rule of rules) {
    const error = checkRule(values[field], rule as ValidationRule<never>);
    if (error) return error;
  }
  return null;
}

/** 全量校验，仅覆盖可见字段。提交前调用。 */
export function validateForm(
  values: TicketFormValues,
): ValidationErrors<TicketFormValues> {
  const errors: ValidationErrors<TicketFormValues> = {};
  for (const field of resolveVisibleFields(values)) {
    const error = validateField(values, field);
    if (error) errors[field] = error;
  }
  return errors;
}

/** 提交失败时要聚焦的字段，按视觉顺序取第一个出错的。 */
export function resolveFirstErrorField(
  errors: ValidationErrors<TicketFormValues>,
): keyof TicketFormValues | null {
  return TICKET_FIELD_ORDER.find((field) => Boolean(errors[field])) ?? null;
}

export function hasValidationError(
  errors: ValidationErrors<TicketFormValues>,
): boolean {
  return Object.values(errors).some(Boolean);
}

/** 提交载荷：剔除隐藏字段的残留值，避免把上次填的回访时间带给后端。 */
export function toSubmitPayload(values: TicketFormValues): Omit<TicketFormValues, 'id'> {
  return {
    code: values.code.trim(),
    title: values.title.trim(),
    status: values.status,
    priority: values.priority,
    assigneeId: values.assigneeId,
    contactPhone: values.contactPhone.trim(),
    description: values.description.trim(),
    attachments: values.attachments,
    needsFollowUp: values.needsFollowUp,
    followUpAt: values.needsFollowUp ? values.followUpAt : null,
  };
}
