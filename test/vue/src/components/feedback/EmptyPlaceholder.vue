<template>
  <div class="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
    <a-empty>
      <template #description>
        <p class="text-sm font-medium text-[var(--color-text-1)]">{{ title }}</p>
        <p v-if="description" class="mt-1 text-xs text-[var(--color-text-3)]">
          {{ description }}
        </p>
      </template>
    </a-empty>
    <a-button v-if="actionText" type="primary" class="mt-2" @click="emit('action')">
      {{ actionText }}
    </a-button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  description?: string;
  actionText?: string;
}

withDefaults(defineProps<Props>(), {
  description: '',
  actionText: '',
});

const emit = defineEmits<{
  action: [];
}>();
</script>
