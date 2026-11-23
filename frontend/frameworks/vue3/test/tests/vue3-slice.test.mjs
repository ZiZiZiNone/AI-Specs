import test from 'node:test';
import assert from 'node:assert/strict';

import { createRequestGuard } from '@/hooks/useRequestGuard.mjs';
import { requestJson } from '@/services/httpClient.mjs';
import { parseTicketQuery, serializeTicketQuery, applyQueryPatch, resolvePageAfterRemoval } from '@/logic/ticketQuery.logic.mjs';
import { createTicketFormController } from '@/logic/ticketValidation.logic.mjs';
import { createSessionStore, createAuthGuard } from '@/router/sessionGuard.mjs';

test('useRequestGuard aborts previous in-flight request and marks it stale', () => {
  const guard = createRequestGuard();
  const r1 = guard.start();
  assert.equal(r1.signal.aborted, false);

  const r2 = guard.start();
  assert.equal(r1.signal.aborted, true, 'first request must be aborted when second starts');
  assert.equal(r1.isStale(), true);
  assert.equal(r2.signal.aborted, false);
  assert.equal(r2.isStale(), false);

  guard.abortAll();
  assert.equal(r2.signal.aborted, true);
});

test('httpClient treats HTTP 200 with non-zero code as BIZ_ERROR and never retries POST', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return { status: 200, json: async () => ({ code: 10401, message: '优惠券已过期', data: null }) };
  };
  const res = await requestJson({ fetchImpl, url: '/api/v1/orders', method: 'POST' });
  assert.equal(res.ok, false);
  assert.equal(res.error.kind, 'BIZ_ERROR');
  assert.equal(res.error.code, 10401);
  assert.equal(calls, 1);
});

test('httpClient aborts retry backoff immediately when signal cancels', async () => {
  let calls = 0;
  const controller = new AbortController();
  const fetchImpl = async () => {
    calls += 1;
    setTimeout(() => controller.abort(), 10);
    return { status: 503, json: async () => ({ code: 50300, message: 'busy' }) };
  };
  const started = Date.now();
  const res = await requestJson({
    fetchImpl,
    url: '/api/v1/tickets',
    method: 'GET',
    signal: controller.signal,
    maxRetries: 2,
    baseDelayMs: 500,
  });
  const elapsed = Date.now() - started;
  assert.equal(res.ok, false);
  assert.equal(res.error.kind, 'CANCELED');
  assert.equal(calls, 1, 'must not issue second attempt after abort during backoff');
  assert.ok(elapsed < 250, `backoff was not interrupted promptly (${elapsed}ms)`);
});

test('httpClient short-circuits when external signal is already aborted', async () => {
  let calls = 0;
  const controller = new AbortController();
  controller.abort();
  const res = await requestJson({
    fetchImpl: async () => { calls += 1; return { status: 200, json: async () => ({ code: 0, data: {} }) }; },
    url: '/api/v1/tickets',
    signal: controller.signal,
  });
  assert.equal(res.ok, false);
  assert.equal(res.error.kind, 'CANCELED');
  assert.equal(calls, 0);
});

test('ticketQuery supports round-trip URL serialization, sort page reset, and batch removal page clamp', () => {
  const parsed = parseTicketQuery({ keyword: ['bug', 'other'], page: '3', pageSize: '500', sortBy: 'priority', sortOrder: 'asc' });
  assert.equal(parsed.keyword, 'bug');
  assert.equal(parsed.pageSize, 100);

  const roundTrip = parseTicketQuery(serializeTicketQuery(parsed));
  assert.deepEqual(roundTrip, parsed);

  const afterSort = applyQueryPatch(parsed, { sortOrder: 'desc' });
  assert.equal(afterSort.page, 1, 'changing sortOrder must reset page to 1');

  assert.equal(resolvePageAfterRemoval({ page: 3, pageSize: 20 }, 42, 3), 2);
  assert.equal(resolvePageAfterRemoval({ page: 1, pageSize: 20 }, 5, 5), 1);
});

test('ticketForm clears fixed errors, strips hidden fields, guards blur, and locks duplicate submit', async () => {
  let receivedPayload = null;
  let submitCalls = 0;
  const form = createTicketFormController(
    { title: '', description: 'desc', needCallback: false, contactPhone: '13800138000', attachments: ['a.png'] },
    async (payload) => {
      submitCalls += 1;
      receivedPayload = payload;
      await new Promise((r) => setTimeout(r, 20));
      return { id: 't-1' };
    },
  );

  // 未输入失焦不报错
  form.handleBlur('title');
  assert.equal(form.state.errors.title, undefined);

  // 首次提交触发错误
  const failRes = await form.submit();
  assert.equal(failRes.ok, false);
  assert.ok(form.state.errors.title);

  // 修复字段后再次并发提交：旧错彻底清除、隐藏字段 contactPhone 被剔除、并发只提交一次
  form.setField('title', '修复登录超时');
  const [p1, p2] = await Promise.all([form.submit(), form.submit()]);
  assert.equal(p1.ok, true);
  assert.equal(p2.skipped, true);
  assert.equal(submitCalls, 1);
  assert.deepEqual(form.state.errors, {});
  assert.equal('contactPhone' in receivedPayload, false, 'hidden field must not leak into payload');
  assert.deepEqual(receivedPayload.attachments, ['a.png']);
});

test('sessionGuard awaits single-flight ensureLoaded and prevents first-screen auth bypass', async () => {
  let fetchCount = 0;
  const session = createSessionStore(async () => {
    fetchCount += 1;
    await new Promise((r) => setTimeout(r, 15));
    return { id: 'u1', role: 'viewer' };
  });
  const guard = createAuthGuard(session, (user, routeName) => routeName !== 'admin' || user?.role === 'admin');

  const [r1, r2] = await Promise.all([
    guard({ name: 'admin', fullPath: '/admin', meta: { requiresAuth: true } }),
    guard({ name: 'tickets', fullPath: '/tickets', meta: { requiresAuth: true } }),
  ]);
  assert.equal(fetchCount, 1, 'concurrent navigations must share one single-flight session fetch');
  assert.deepEqual(r1, { name: 'forbidden' });
  assert.equal(r2, true);
});
