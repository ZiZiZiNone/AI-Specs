import type { TicketAssignee, TicketFormValues } from './Ticket.types';
import type { ValidationErrors } from './Validation.types';

/**
 * 表单弹窗的视图模型。
 * 表单状态由页面持有的 Hook 管理，弹窗保持纯展示（core-principles P2），
 * 聚合成一个对象是为了避免 props 数量突破 8 个上限
 * （protocol/decision-trees 组件拆分决策）。
 */
export interface TicketFormViewModel {
  values: TicketFormValues;
  errors: ValidationErrors<TicketFormValues>;
  isSubmitting: boolean;
  isCheckingCode: boolean;
  isDirty: boolean;
  formError: string;
  canAssign: boolean;
  initialAssignee: TicketAssignee | null;
}
