// @vitest-environment jsdom
import { type App, createApp } from 'vue';
import { describe, expect, it } from 'vitest';
import { useRequestGuard } from '@/hooks/useRequestGuard';

/** composable 在最小 setup 宿主内测试；清理与竞态行为必须有断言。 */
function withSetup<T>(composable: () => T): [T, App] {
  let result!: T;
  const app = createApp({
    setup() {
      result = composable();
      return () => null;
    },
  });
  app.mount(document.createElement('div'));
  return [result, app];
}

describe('useRequestGuard', () => {
  it('should_abort_inflight_request_when_scope_disposed', () => {
    const [guard, app] = withSetup(() => useRequestGuard());
    const { signal } = guard.start();
    app.unmount();
    expect(signal.aborted).toBe(true);
  });

  it('should_mark_previous_result_stale_when_new_request_starts', () => {
    const [guard, app] = withSetup(() => useRequestGuard());
    const first = guard.start();
    guard.start();
    expect(first.isStale()).toBe(true);
    app.unmount();
  });

  it('should_abort_all_inflight_when_abort_all_called', () => {
    const [guard, app] = withSetup(() => useRequestGuard());
    const first = guard.start();
    const second = guard.start();
    guard.abortAll();
    expect(first.signal.aborted).toBe(true);
    expect(second.signal.aborted).toBe(true);
    app.unmount();
  });
});
