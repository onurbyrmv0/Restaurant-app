<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 w-80">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm flex items-center gap-2 text-sm font-semibold w-full"
        :class="{
          'bg-green-500/90 text-white': toast.type === 'success',
          'bg-red-500/90 text-white': toast.type === 'error',
          'bg-blue-500/90 text-white': toast.type === 'info',
          'bg-brand-primary/90 text-white': toast.type === 'cart',
        }"
      >
        <!-- Icon -->
        <span v-if="toast.type === 'success'">✓</span>
        <span v-else-if="toast.type === 'error'">✕</span>
        <span v-else-if="toast.type === 'info'">ℹ</span>
        <span v-else-if="toast.type === 'cart'">🛒</span>
        <!-- Message -->
        <span class="flex-1">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const toasts = ref([])
let counter = 0

function show(message, type = 'info', duration = 2000) {
  const id = ++counter
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, duration)
}

defineExpose({ show })
</script>

<style scoped>
.toast-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>
