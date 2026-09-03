import type {
  Ticket,
  TicketAssignee,
  TicketDetail,
  TicketLog,
  TicketPriority,
  TicketStatus,
} from '@/types/Ticket.types';
import type { SessionUser } from '@/types/Session.types';

/**
 * 内存假后端，仅为让链路可运行（无真实后端）。
 * 数据是构造的假数据，不代表任何真实业务数值。
 */

const STATUSES: TicketStatus[] = ['open', 'processing', 'closed'];
const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

export const MOCK_ASSIGNEES: TicketAssignee[] = [
  { id: 'u-01', name: '陈亦然' },
  { id: 'u-02', name: '林向舟' },
  { id: 'u-03', name: '赵灵犀' },
  { id: 'u-04', name: '孙照野' },
  { id: 'u-05', name: '周纾遥' },
];

export const MOCK_SESSION: SessionUser = {
  id: 'u-01',
  name: '陈亦然',
  permissions: ['ticket:create', 'ticket:edit', 'ticket:close', 'ticket:assign'],
};

const TITLE_SEEDS = [
  '登录页验证码无法刷新',
  '导出报表缺少上月数据',
  '移动端表单提交后白屏',
  '批量导入提示编码错误',
  '消息推送延迟超过十分钟',
  '权限变更后菜单未刷新',
  '附件预览在 Safari 下失败',
  '搜索结果排序与预期不符',
];

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

function buildDetail(index: number): TicketDetail {
  const status = STATUSES[index % STATUSES.length];
  const priority = PRIORITIES[index % PRIORITIES.length];
  const assignee = index % 7 === 0 ? null : MOCK_ASSIGNEES[index % MOCK_ASSIGNEES.length];
  const createdAt = new Date(2026, 0, 1 + (index % 240), 9, index % 60).toISOString();

  return {
    id: String(index),
    code: `TK-${pad(index, 6)}`,
    title: `${TITLE_SEEDS[index % TITLE_SEEDS.length]}（#${index}）`,
    status,
    priority,
    assignee,
    createdAt,
    updatedAt: createdAt,
    description: '用户反馈的问题描述占位文本，用于验证详情展示与表单回填。',
    contactPhone: `138${pad((index * 137) % 100000000, 8)}`,
    attachments: [],
    needsFollowUp: index % 4 === 0,
    followUpAt: index % 4 === 0 ? new Date(2026, 1, 1 + (index % 28)).toISOString() : null,
  };
}

const tickets = new Map<string, TicketDetail>();
for (let i = 1; i <= 137; i += 1) {
  tickets.set(String(i), buildDetail(i));
}

const logs = new Map<string, TicketLog[]>();
function ensureLogs(ticketId: string): TicketLog[] {
  const existing = logs.get(ticketId);
  if (existing) return existing;

  const count = (Number(ticketId) % 5) * 6;
  const created: TicketLog[] = Array.from({ length: count }, (_, i) => ({
    id: `${ticketId}-log-${i + 1}`,
    action: ['创建工单', '分派处理人', '补充描述', '调整优先级', '关闭工单'][i % 5],
    operatorName: MOCK_ASSIGNEES[i % MOCK_ASSIGNEES.length].name,
    createdAt: new Date(2026, 2, 1 + (i % 27), 10, i % 60).toISOString(),
    remark: '操作说明占位文本。',
  }));
  logs.set(ticketId, created);
  return created;
}

/** 列表项是详情的子集，显式挑字段而不是解构剔除，避免 noUnusedLocals 报错。 */
function toListItem(detail: TicketDetail): Ticket {
  return {
    id: detail.id,
    code: detail.code,
    title: detail.title,
    status: detail.status,
    priority: detail.priority,
    assignee: detail.assignee,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
  };
}

export const mockDb = {
  listTickets(): TicketDetail[] {
    return [...tickets.values()];
  },
  getTicket(id: string): TicketDetail | undefined {
    return tickets.get(id);
  },
  saveTicket(detail: TicketDetail): void {
    tickets.set(detail.id, detail);
  },
  deleteTicket(id: string): boolean {
    return tickets.delete(id);
  },
  nextId(): string {
    return String(Math.max(0, ...[...tickets.keys()].map(Number)) + 1);
  },
  isCodeTaken(code: string, excludeId: string): boolean {
    return [...tickets.values()].some(
      (item) => item.code === code && item.id !== excludeId,
    );
  },
  getLogs(ticketId: string): TicketLog[] {
    return ensureLogs(ticketId);
  },
  toListItem,
};
