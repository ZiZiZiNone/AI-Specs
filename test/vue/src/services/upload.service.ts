import type { Result } from '@/types/Result.types.ts';
import type { TicketAttachment } from '@/types/Ticket.types.ts';
import { httpClient } from '@/services/httpClient.ts';

/** 上传细节（分片/凭证）由本层承担，UI 不感知（patterns/upload.md）。 */
export function uploadAttachment(file: File): Promise<Result<TicketAttachment>> {
  return httpClient.post('/api/upload', {
    body: { name: file.name, size: file.size, type: file.type },
    retryable: false,
    timeoutMs: 30_000,
  });
}
