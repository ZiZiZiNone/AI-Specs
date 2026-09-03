import type { Result } from '@/types/Result.types';
import type { SessionUser } from '@/types/Session.types';
import { httpClient } from './httpClient';

export function fetchSession(): Promise<Result<SessionUser>> {
  return httpClient.get('/api/session');
}
