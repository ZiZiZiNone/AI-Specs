<script setup lang="ts">
import { onMounted } from 'vue';
import { useSessionStore } from '@/store/session.store';
import ErrorPlaceholder from '@/components/feedback/ErrorPlaceholder.vue';

/**
 * 应用外壳。会话加载失败时不渲染业务页面：
 * 权限未知的情况下渲染操作按钮会给出错误的可用性暗示。
 */
const session = useSessionStore();

onMounted(() => {
  void session.loadSession();
});
</script>

<template>
  <div class="min-h-full">
    <div v-if="session.state === 'loading' || session.state === 'idle'" class="p-6">
      <a-skeleton animation>
        <a-skeleton-line :rows="6" :line-height="32" :line-spacing="18" />
      </a-skeleton>
    </div>

    <ErrorPlaceholder
      v-else-if="session.state === 'error'"
      :message="session.errorMessage"
      @retry="session.loadSession()"
    />

    <RouterView v-else />
  </div>
</template>
