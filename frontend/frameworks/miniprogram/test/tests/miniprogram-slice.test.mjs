import test from 'node:test';
import assert from 'node:assert/strict';

import { createMiniRequestClient } from '@/services/request.mjs';
import { createMiniPagination } from '@/logic/pagination.mjs';
import { createNavigator } from '@/utils/navigate.mjs';

test('miniprogram request coalesces concurrent 401 into single wx.login refresh and replays once', async () => {
  let token = 'expired';
  let refreshCount = 0;
  const wxApi = {
    request({ header, success, complete }) {
      setTimeout(() => {
        if (header.Authorization !== 'Bearer fresh') {
          success({ statusCode: 401, data: { code: 40101, message: 'expired' } });
        } else {
          success({ statusCode: 200, data: { code: 0, data: { ok: true } } });
        }
        complete?.();
      }, 5);
      return { abort() {} };
    },
  };

  const client = createMiniRequestClient({
    wxApi,
    getToken: () => token,
    refreshToken: async () => {
      refreshCount += 1;
      await new Promise((r) => setTimeout(r, 15));
      token = 'fresh';
      return true;
    },
  });

  const [r1, r2, r3] = await Promise.all([
    client({ url: '/a' }),
    client({ url: '/b' }),
    client({ url: '/c' }),
  ]);
  assert.equal(refreshCount, 1, 'concurrent 401s must trigger exactly one refresh');
  assert.equal(r1.ok, true);
  assert.equal(r2.ok, true);
  assert.equal(r3.ok, true);
});

test('miniprogram pagination sets loadingMore before async fetch, blocks re-entry, and writes 2D page patch', async () => {
  const patches = [];
  const pager = createMiniPagination(async (page) => {
    await new Promise((r) => setTimeout(r, 15));
    return { ok: true, data: { items: [{ id: `p${page}-1` }], page: { page, totalPages: 2 } } };
  });

  const [a, b] = await Promise.all([
    pager.loadNext((p) => patches.push(p)),
    pager.loadNext((p) => patches.push(p)),
  ]);
  assert.equal(a.ok, true);
  assert.equal(b.skipped, true, 'concurrent onReachBottom must be blocked');
  assert.equal(patches[0].loadingMore, true, 'loadingMore must be set before awaiting fetch');
  assert.deepEqual(patches[1]['listPages[0]'], [{ id: 'p1-1' }]);
  assert.equal(pager.data.hasMore, true);
});

test('miniprogram navigateSafe falls back to redirectTo at 10-layer stack and blocks unauthenticated cold start', async () => {
  const calls = [];
  const wxApi = {
    navigateTo: (o) => calls.push(['navigateTo', o.url]),
    redirectTo: (o) => calls.push(['redirectTo', o.url]),
  };

  const navFull = createNavigator({
    wxApi,
    getCurrentPagesFn: () => new Array(10).fill({}),
    ensureAppReady: async () => {},
    isLoggedIn: () => true,
  });
  const mode1 = await navFull('/pages/detail/index?id=1', { requiresAuth: true });
  assert.equal(mode1, 'redirectTo:stack_full');

  const navGuest = createNavigator({
    wxApi,
    getCurrentPagesFn: () => [{}],
    ensureAppReady: async () => {},
    isLoggedIn: () => false,
  });
  const mode2 = await navGuest('/pages/order/index', { requiresAuth: true });
  assert.equal(mode2, 'redirectTo:login');
  assert.equal(calls[1][0], 'redirectTo');
});
