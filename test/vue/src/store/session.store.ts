import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { SessionUser } from '@/types/Session.types';
import type { UIState } from '@/types/UIState.types';
import { fetchSession } from '@/services/session.service';

/**
 * 当前用户与权限。跨页面共享且需响应式，按 rules/store.md 决策树第 4 条进 Store。
 * Store 只做状态读写；权限判定在 ticketPermission.logic.ts。
 */
export const useSessionStore = defineStore('session', () => {
  const user = ref<SessionUser | null>(null);
  const state = ref<UIState>('idle');
  const errorMessage = ref('');

  async function loadSession(): Promise<void> {
    state.value = 'loading';
    const result = await fetchSession();

    if (!result.success) {
      state.value = 'error';
      errorMessage.value = result.error.message;
      return;
    }

    user.value = result.data;
    state.value = 'success';
    errorMessage.value = '';
  }

  return { user, state, errorMessage, loadSession };
});
