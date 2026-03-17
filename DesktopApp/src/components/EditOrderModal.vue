<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

        <!-- Modal -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 class="text-lg font-bold text-slate-900">Sifarişi Redaktə Et</h3>
            <button
              class="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              @click="$emit('close')"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-5 space-y-5">
            <!-- Order Info -->
            <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div class="bg-primary/10 text-primary p-2 rounded-lg">
                <span class="material-symbols-outlined">table_restaurant</span>
              </div>
              <div>
                <div class="font-bold text-slate-900">Masa {{ order?.tableNumber }}</div>
                <div class="text-xs text-slate-500">#{{ order?.id?.slice(0, 8) }}</div>
              </div>
            </div>

            <!-- Status Change -->
            <div>
              <label class="text-sm font-semibold text-slate-700 block mb-2">Status</label>
              <div class="grid grid-cols-1 gap-2">
                <button
                  v-for="status in statuses"
                  :key="status.value"
                  class="flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 text-left"
                  :class="localStatus === status.value
                    ? `${status.activeBg} ${status.activeText} ${status.activeBorder}`
                    : 'border-slate-100 text-slate-500 hover:border-slate-200'"
                  @click="localStatus = status.value"
                >
                  <span class="material-symbols-outlined">{{ status.icon }}</span>
                  {{ status.label }}
                </button>
              </div>
            </div>

            <!-- Notes -->
            <div>
              <label class="text-sm font-semibold text-slate-700 block mb-2">Qeyd</label>
              <textarea
                v-model="localNotes"
                class="w-full p-3 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                rows="3"
                placeholder="Sifariş haqqında qeyd yazın..."
              ></textarea>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
            <button
              class="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors active:scale-95"
              @click="$emit('close')"
            >
              Ləğv et
            </button>
            <button
              class="px-6 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark transition-colors active:scale-95 shadow-md shadow-primary/20"
              @click="saveChanges"
            >
              Yadda saxla
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  order: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save'])

const localStatus = ref('')
const localNotes = ref('')

const statuses = [
  { value: 'new', label: 'Yeni', icon: 'fiber_new', activeBg: 'bg-red-50', activeText: 'text-red-600', activeBorder: 'border-red-300' },
  { value: 'preparing', label: 'Hazırlanır', icon: 'skillet', activeBg: 'bg-blue-50', activeText: 'text-blue-700', activeBorder: 'border-blue-300' },
  { value: 'done', label: 'Təhvil verildi / Ödəniş Gözləyir', icon: 'person_check', activeBg: 'bg-amber-50', activeText: 'text-amber-700', activeBorder: 'border-amber-300' },
  { value: 'paid', label: 'Tamamlandı', icon: 'check_circle', activeBg: 'bg-green-50', activeText: 'text-green-600', activeBorder: 'border-green-300' },
]

watch(() => props.order, (newOrder) => {
  if (newOrder) {
    localStatus.value = newOrder.status || 'new'
    localNotes.value = newOrder.notes || ''
  }
}, { immediate: true })

watch(() => props.visible, (isVisible) => {
  if (isVisible && props.order) {
    localStatus.value = props.order.status || 'new'
    localNotes.value = props.order.notes || ''
  }
})

function saveChanges() {
  emit('save', {
    status: localStatus.value,
    notes: localNotes.value,
  })
}
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
