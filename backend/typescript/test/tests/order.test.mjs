import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_IDEMPOTENCY_TTL, DomainError, MemoryOrderStore, OrderService } from '../src/orderService.mjs';

test('Node/TS backend order service enforces scoped idempotency, TTL, pageSize clamp, and sort whitelist', () => {
  let now = 1763884800;
  const store = new MemoryOrderStore();
  const svc = new OrderService(store, store, () => now);

  const o1 = svc.create({ userId: 'u1', itemId: 'sku-1', quantity: 2, unitPriceCents: 500, idempotencyKey: 'k1' });
  const o2 = svc.create({ userId: 'u2', itemId: 'sku-1', quantity: 1, unitPriceCents: 500, idempotencyKey: 'k1' });
  assert.notEqual(o1.id, o2.id);

  assert.equal(svc.create({ userId: 'u1', itemId: 'sku-1', quantity: 2, unitPriceCents: 500, idempotencyKey: 'k1' }).id, o1.id);
  assert.throws(
    () => svc.create({ userId: 'u1', itemId: 'sku-1', quantity: 2, unitPriceCents: 500, couponCode: 'VIP', idempotencyKey: 'k1' }),
    (err) => err instanceof DomainError && err.errorCode === 40901,
  );

  now += DEFAULT_IDEMPOTENCY_TTL + 60;
  const o3 = svc.create({ userId: 'u1', itemId: 'sku-1', quantity: 2, unitPriceCents: 500, idempotencyKey: 'k1' });
  assert.notEqual(o3.id, o1.id);

  const list = svc.list({ userId: 'u1', page: 1, pageSize: 500 });
  assert.equal(list.page.pageSize, 100);
  assert.throws(() => svc.list({ userId: 'u1', sortBy: 'evil' }), (err) => err instanceof DomainError && err.errorCode === 40001);
});
