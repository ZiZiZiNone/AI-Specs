import type { Result } from '@/types/Result.types';
import type { TicketAssignee } from '@/types/Ticket.types';
import { httpClient } from './httpClient';
import type { RequestContext } from './ticket.service';

export function searchAssignees(
  keyword: string,
  context: RequestContext = {},
): Promise<Result<TicketAssignee[]>> {
  return httpClient.get('/api/users', {
    params: { keyword },
    signal: context.signal,
  });
}
