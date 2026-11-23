import test from 'node:test';
import assert from 'node:assert/strict';
import { createEffectGuard, createServerActionGuard } from '@/serverActionGuard.mjs';

test('Next.js Server Action guard enforces auth, validation, and resource ownership (ABAC)', async () => {
  let currentActor = null;
  const action = createServerActionGuard({
    getSession: async () => currentActor,
    validateInput: (raw) => (raw?.orderId ? { ok: true, data: raw } : { ok: false, message: 'missing orderId' }),
    canOperate: async (actor, data) => actor.id === data.ownerId,
    handler: async (_actor, data) => ({ canceled: data.orderId }),
  });

  assert.equal((await action({ orderId: 'o1', ownerId: 'u1' }))?.error?.code, 40101);

  currentActor = { id: 'u2' };
  assert.equal((await action({ orderId: '', ownerId: 'u1' }))?.error?.code, 40001);
  assert.equal((await action({ orderId: 'o1', ownerId: 'u1' }))?.error?.code, 40301);

  currentActor = { id: 'u1' };
  const ok = await action({ orderId: 'o1', ownerId: 'u1' });
  assert.deepEqual(ok, { ok: true, data: { canceled: 'o1' } });
});

test('React effect guard aborts previous request on re-run and on unmount cleanup', () => {
  const guard = createEffectGuard();
  const r1 = guard.begin();
  const r2 = guard.begin();
  assert.equal(r1.signal.aborted, true);
  assert.equal(r1.isCurrent(), false);
  assert.equal(r2.isCurrent(), true);

  r2.cleanup();
  assert.equal(r2.signal.aborted, true);
});
