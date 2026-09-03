import { describe, expect, it } from 'vitest';
import { toStandardError } from '@/services/errorMapper';

describe('errorMapper', () => {
  it('should_mark_server_error_retryable', () => {
    const error = toStandardError(503, null);
    expect(error.type).toBe('network');
    expect(error.retryable).toBe(true);
  });

  it('should_prefer_business_message_from_payload', () => {
    const error = toStandardError(409, {
      success: false,
      error: { code: 'CODE_TAKEN', message: '该工单编号已存在，请更换后重试' },
    });

    expect(error.code).toBe('CODE_TAKEN');
    expect(error.message).toBe('该工单编号已存在，请更换后重试');
    expect(error.retryable).toBe(false);
  });

  it('should_mark_rate_limited_retryable', () => {
    expect(toStandardError(429, null).retryable).toBe(true);
  });

  it('should_not_retry_client_errors', () => {
    expect(toStandardError(403, null).retryable).toBe(false);
    expect(toStandardError(404, null).retryable).toBe(false);
  });

  it('should_produce_user_readable_message_without_technical_terms', () => {
    const error = toStandardError(500, { stack: 'Error: at handler' });
    expect(error.message).not.toContain('500');
    expect(error.message).not.toContain('Error');
  });
});
