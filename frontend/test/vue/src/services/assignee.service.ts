import type { Result } from '@/types/Result.types.ts';
import type { TicketAssignee } from '@/types/Ticket.types.ts';
import { httpClient } from '@/services/httpClient.ts';
import type { RequestContext } from '@/services/ticket.service.ts';

export function searchAssignees(
  keyword: string,
  context: RequestContext = {},
): Promise<Result<TicketAssignee[]>> {
  return httpClient.get('/api/users', {
    params: { keyword },
    signal: context.signal,
  });
}
