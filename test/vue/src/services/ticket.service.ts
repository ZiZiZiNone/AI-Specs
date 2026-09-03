import type { PageResult, Result } from '@/types/Result.types';
import type {
  Ticket,
  TicketDetail,
  TicketFormValues,
  TicketListQuery,
  TicketLog,
  TicketPriority,
  TicketStatus,
} from '@/types/Ticket.types';
import { httpClient } from './httpClient';

/** 工单接口访问。业务语义命名，参数拼装与类型收敛在此层。 */

export interface RequestContext {
  signal?: AbortSignal;
}

export function fetchTicketList(
  query: TicketListQuery,
  context: RequestContext = {},
): Promise<Result<PageResult<Ticket>>> {
  return httpClient.get('/api/tickets', {
    params: { ...query },
    signal: context.signal,
  });
}

export function fetchTicketDetail(
  id: string,
  context: RequestContext = {},
): Promise<Result<TicketDetail>> {
  return httpClient.get(`/api/tickets/${id}`, { signal: context.signal });
}

export function fetchTicketLogs(
  id: string,
  page: number,
  pageSize: number,
  context: RequestContext = {},
): Promise<Result<PageResult<TicketLog>>> {
  return httpClient.get(`/api/tickets/${id}/logs`, {
    params: { page, pageSize },
    signal: context.signal,
  });
}

/** 新增不参与自动重试：接口非幂等，重试会造成重复工单。 */
export function createTicket(
  values: Omit<TicketFormValues, 'id'>,
): Promise<Result<TicketDetail>> {
  return httpClient.post('/api/tickets', { body: values, retryable: false });
}

export function updateTicket(
  id: string,
  values: Omit<TicketFormValues, 'id'>,
): Promise<Result<TicketDetail>> {
  return httpClient.put(`/api/tickets/${id}`, { body: values, retryable: false });
}

export function updateTicketStatus(
  id: string,
  status: TicketStatus,
): Promise<Result<TicketDetail>> {
  return httpClient.patch(`/api/tickets/${id}/status`, { body: { status } });
}

export function updateTicketPriority(
  id: string,
  priority: TicketPriority,
): Promise<Result<TicketDetail>> {
  return httpClient.patch(`/api/tickets/${id}/priority`, { body: { priority } });
}

export function deleteTicket(id: string): Promise<Result<{ id: string }>> {
  return httpClient.delete(`/api/tickets/${id}`, { retryable: false });
}

export function checkTicketCode(
  code: string,
  excludeId: string,
  context: RequestContext = {},
): Promise<Result<{ isTaken: boolean }>> {
  return httpClient.post('/api/tickets/check-code', {
    body: { code, excludeId },
    signal: context.signal,
  });
}
