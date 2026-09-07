import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { httpClient } from '@/services/httpClient.ts';
import { registerHandler, mockFaultConfig } from '@/services/mock/mockTransport.ts';

/** 验证重试、超时与非幂等写操作不重试这三条关键行为。 */

let getAttempts = 0;
let postAttempts = 0;

beforeEach(() => {
  mockFaultConfig.latencyMs = 0;
  getAttempts = 0;
  postAttempts = 0;

  registerHandler('GET', '/test/flaky', () => {
    getAttempts += 1;
    // 前两次 503，第三次成功：正好落在重试上限内。
    if (getAttempts < 3) return { status: 503, payload: null };
    return { status: 200, payload: { success: true, data: { attempts: getAttempts } } };
  });

  registerHandler('GET', '/test/always-500', () => {
    getAttempts += 1;
    return { status: 500, payload: null };
  });

  registerHandler('GET', '/test/forbidden', () => {
    getAttempts += 1;
    return { status: 403, payload: null };
  });

  registerHandler('POST', '/test/create', () => {
    postAttempts += 1;
    return { status: 503, payload: null };
  });

  registerHandler('GET', '/test/slow', async () => {
    await new Promise((resolve) => setTimeout(resolve, 60));
    return { status: 200, payload: { success: true, data: 'late' } };
  });
});

afterEach(() => {
  mockFaultConfig.latencyMs = 320;
});

describe('httpClient', () => {
  it('should_retry_retryable_error_and_succeed_within_limit', async () => {
    const result = await httpClient.get<{ attempts: number }>('/test/flaky');
    expect(result.success).toBe(true);
    expect(getAttempts).toBe(3);
  });

  it('should_stop_after_three_attempts_when_error_persists', async () => {
    const result = await httpClient.get('/test/always-500');
    expect(result.success).toBe(false);
    expect(getAttempts).toBe(3);
  });

  it('should_not_retry_non_retryable_error', async () => {
    const result = await httpClient.get('/test/forbidden');
    expect(result.success).toBe(false);
    expect(getAttempts).toBe(1);
  });

  it('should_not_retry_non_idempotent_write_even_when_error_is_retryable', async () => {
    const result = await httpClient.post('/test/create', { body: {} });
    expect(result.success).toBe(false);
    expect(postAttempts).toBe(1);
  });

  it('should_return_timeout_error_when_request_exceeds_limit', async () => {
    const result = await httpClient.get('/test/slow', { timeoutMs: 10, retryable: false });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('TIMEOUT');
  });

  it('should_return_canceled_error_when_signal_aborts', async () => {
    const controller = new AbortController();
    const pending = httpClient.get('/test/slow', { signal: controller.signal });
    controller.abort();

    const result = await pending;
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('CANCELED');
  });

  it('should_map_unknown_path_to_not_found', async () => {
    const result = await httpClient.get('/test/nowhere');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('NOT_FOUND');
  });
});
