import type { Result } from '@/types/Result.types.ts';
import type { SessionUser } from '@/types/Session.types.ts';
import { httpClient } from '@/services/httpClient.ts';

export function fetchSession(): Promise<Result<SessionUser>> {
  return httpClient.get('/api/session');
}
