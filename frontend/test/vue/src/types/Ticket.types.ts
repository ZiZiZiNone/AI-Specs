export type TicketStatus = 'open' | 'processing' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketSortField = 'createdAt' | 'priority' | 'code';
export type SortOrder = 'asc' | 'desc';

export interface TicketAssignee {
  id: string;
  name: string;
}

export interface TicketAttachment {
  id: string;
  name: string;
  size: number;
  url: string;
}

export interface Ticket {
  id: string;
  code: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee: TicketAssignee | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDetail extends Ticket {
  description: string;
  contactPhone: string;
  attachments: TicketAttachment[];
  needsFollowUp: boolean;
  followUpAt: string | null;
}

export interface TicketLog {
  id: string;
  action: string;
  operatorName: string;
  createdAt: string;
  remark: string;
}

/** 表单字段值。id 为空表示新增，非空表示编辑。 */
export interface TicketFormValues {
  id: string;
  code: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string;
  contactPhone: string;
  description: string;
  attachments: TicketAttachment[];
  needsFollowUp: boolean;
  followUpAt: string | null;
}

export interface TicketListQuery {
  page: number;
  pageSize: number;
  keyword: string;
  status: TicketStatus | '';
  priority: TicketPriority | '';
  assigneeId: string;
  sortBy: TicketSortField;
  sortOrder: SortOrder;
}
