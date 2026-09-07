<template>
  <div class="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
    <IconExclamationCircleFill class="text-4xl text-[rgb(var(--danger-6))]" />
    <p class="max-w-md text-sm text-[var(--color-text-2)]">{{ message }}</p>
    <div class="mt-1 flex gap-2">
      <a-button type="primary" @click="emit('retry')">{{ retryText }}</a-button>
      <a-button v-if="backText" @click="emit('back')">{{ backText }}</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconExclamationCircleFill } from '@arco-design/web-vue/es/icon';

interface Props {
  message: string;
  retryText?: string;
  backText?: string;
}

withDefaults(defineProps<Props>(), {
  retryText: '重试',
  backText: '',
});

const emit = defineEmits<{
  retry: [];
  back: [];
}>();
</script>
