import type { TicketDetail, TicketFormValues } from '@/types/Ticket.types.ts';
import { registerHandler } from '@/services/mock/mockTransport.ts';
import { MOCK_ASSIGNEES, MOCK_SESSION, mockDb } from '@/services/mock/mockDb.ts';
import { queryTickets } from '@/services/mock/mockQuery.ts';

/** 假后端路由表。仅在开发环境注册，注册一次。 */

const ok = (data: unknown) => ({ status: 200, payload: { success: true, data } });
const fail = (status: number, code: string, message: string) => ({
  status,
  payload: { success: false, error: { code, message } },
});

function resolveAssignee(assigneeId: string) {
  return MOCK_ASSIGNEES.find((item) => item.id === assigneeId) ?? null;
}

let isRegistered = false;

export function setupMockServer(): void {
  if (isRegistered) return;
  isRegistered = true;

  registerHandler('GET', '/api/session', () => ok(MOCK_SESSION));

  registerHandler('GET', '/api/users', ({ params }) => {
    const keyword = (params.keyword ?? '').trim();
    const matched = keyword
      ? MOCK_ASSIGNEES.filter((item) => item.name.includes(keyword))
      : MOCK_ASSIGNEES;
    return ok(matched);
  });

  registerHandler('GET', '/api/tickets', ({ params }) => {
    const { list, total } = queryTickets({
      page: Number(params.page ?? 1),
      pageSize: Number(params.pageSize ?? 10),
      keyword: params.keyword ?? '',
      status: (params.status ?? '') as never,
      priority: (params.priority ?? '') as never,
      assigneeId: params.assigneeId ?? '',
      sortBy: (params.sortBy ?? 'createdAt') as never,
      sortOrder: params.sortOrder === 'asc' ? 'asc' : 'desc',
    });
    return ok({
      list,
      total,
      page: Number(params.page ?? 1),
      pageSize: Number(params.pageSize ?? 10),
    });
  });

  registerHandler('GET', '/api/tickets/:id', ({ params }) => {
    const detail = mockDb.getTicket(params.id);
    if (!detail) return fail(404, 'TICKET_NOT_FOUND', '工单不存在或已删除');
    return ok(detail);
  });

  registerHandler('GET', '/api/tickets/:id/logs', ({ params }) => {
    if (!mockDb.getTicket(params.id)) {
      return fail(404, 'TICKET_NOT_FOUND', '工单不存在或已删除');
    }
    const page = Number(params.page ?? 1);
    const pageSize = Number(params.pageSize ?? 10);
    const all = mockDb.getLogs(params.id);
    const start = (page - 1) * pageSize;
    return ok({ list: all.slice(start, start + pageSize), total: all.length, page, pageSize });
  });

  registerHandler('POST', '/api/tickets/check-code', ({ body }) => {
    const { code, excludeId } = (body ?? {}) as { code?: string; excludeId?: string };
    if (!code) return fail(400, 'CODE_REQUIRED', '缺少工单编号');
    return ok({ isTaken: mockDb.isCodeTaken(code, excludeId ?? '') });
  });

  registerHandler('POST', '/api/tickets', ({ body }) => {
    const values = body as Omit<TicketFormValues, 'id'>;
    if (mockDb.isCodeTaken(values.code, '')) {
      return fail(409, 'CODE_TAKEN', '该工单编号已存在，请更换后重试');
    }
    const now = new Date().toISOString();
    const detail: TicketDetail = {
      id: mockDb.nextId(),
      code: values.code,
      title: values.title,
      status: values.status,
      priority: values.priority,
      assignee: resolveAssignee(values.assigneeId),
      createdAt: now,
      updatedAt: now,
      description: values.description,
      contactPhone: values.contactPhone,
      attachments: values.attachments,
      needsFollowUp: values.needsFollowUp,
      followUpAt: values.followUpAt,
    };
    mockDb.saveTicket(detail);
    return ok(detail);
  });

  registerHandler('PUT', '/api/tickets/:id', ({ params, body }) => {
    const existing = mockDb.getTicket(params.id);
    if (!existing) return fail(404, 'TICKET_NOT_FOUND', '工单不存在或已删除');

    const values = body as Omit<TicketFormValues, 'id'>;
    if (mockDb.isCodeTaken(values.code, params.id)) {
      return fail(409, 'CODE_TAKEN', '该工单编号已存在，请更换后重试');
    }

    const updated: TicketDetail = {
      ...existing,
      ...values,
      assignee: resolveAssignee(values.assigneeId),
      updatedAt: new Date().toISOString(),
    };
    mockDb.saveTicket(updated);
    return ok(updated);
  });

  registerHandler('PATCH', '/api/tickets/:id/status', ({ params, body }) => {
    const existing = mockDb.getTicket(params.id);
    if (!existing) return fail(404, 'TICKET_NOT_FOUND', '工单不存在或已删除');

    const { status } = (body ?? {}) as { status?: TicketDetail['status'] };
    if (!status) return fail(400, 'STATUS_REQUIRED', '缺少目标状态');

    const updated = { ...existing, status, updatedAt: new Date().toISOString() };
    mockDb.saveTicket(updated);
    return ok(updated);
  });

  registerHandler('PATCH', '/api/tickets/:id/priority', ({ params, body }) => {
    const existing = mockDb.getTicket(params.id);
    if (!existing) return fail(404, 'TICKET_NOT_FOUND', '工单不存在或已删除');

    const { priority } = (body ?? {}) as { priority?: TicketDetail['priority'] };
    if (!priority) return fail(400, 'PRIORITY_REQUIRED', '缺少目标优先级');

    // 用固定 id 制造一个稳定的失败点，便于人工验证乐观更新回滚。
    if (params.id === '13') {
      return fail(409, 'PRIORITY_LOCKED', '该工单优先级已被他人锁定，请刷新后重试');
    }

    const updated = { ...existing, priority, updatedAt: new Date().toISOString() };
    mockDb.saveTicket(updated);
    return ok(updated);
  });

  registerHandler('DELETE', '/api/tickets/:id', ({ params }) => {
    if (!mockDb.deleteTicket(params.id)) {
      return fail(404, 'TICKET_NOT_FOUND', '工单不存在或已删除');
    }
    return ok({ id: params.id });
  });

  registerHandler('POST', '/api/upload', ({ body }) => {
    const file = (body ?? {}) as { name?: string; size?: number };
    return ok({
      id: `att-${Date.now()}`,
      name: file.name ?? 'attachment',
      size: file.size ?? 0,
      url: 'blob:mock-attachment',
    });
  });
}
