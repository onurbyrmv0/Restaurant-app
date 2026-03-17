<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('cancel')"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

        <!-- Dialog -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up">
          <!-- Icon -->
          <div
            class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            :class="iconBgClass"
          >
            <span class="material-symbols-outlined text-2xl" :class="iconTextClass">
              {{ icon }}
            </span>
          </div>

          <!-- Content -->
          <h3 class="text-lg font-bold text-center text-slate-900 mb-2">{{ title }}</h3>
          <p class="text-sm text-slate-500 text-center mb-6">{{ message }}</p>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              id="confirm-cancel-btn"
              class="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors active:scale-95"
              @click="$emit('cancel')"
            >
              {{ cancelText }}
            </button>
            <button
              id="confirm-ok-btn"
              class="flex-1 py-3 rounded-xl font-bold text-white transition-colors active:scale-95"
              :class="confirmBtnClass"
              @click="$emit('confirm')"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: 'Təsdiq' },
  message: { type: String, default: '' },
  icon: { type: String, default: 'warning' },
  variant: { type: String, default: 'danger' }, // danger, warning, info
  confirmText: { type: String, default: 'Təsdiq et' },
  cancelText: { type: String, default: 'Ləğv et' },
})

defineEmits(['confirm', 'cancel'])

const iconBgClass = computed(() => ({
  danger: 'bg-red-100',
  warning: 'bg-yellow-100',
  info: 'bg-blue-100',
  success: 'bg-green-100',
}[props.variant] || 'bg-slate-100'))

const iconTextClass = computed(() => ({
  danger: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
  success: 'text-green-600',
}[props.variant] || 'text-slate-600'))

const confirmBtnClass = computed(() => ({
  danger: 'bg-red-500 hover:bg-red-600',
  warning: 'bg-yellow-500 hover:bg-yellow-600',
  info: 'bg-blue-500 hover:bg-blue-600',
  success: 'bg-green-500 hover:bg-green-600',
}[props.variant] || 'bg-primary hover:bg-primary-dark'))
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
