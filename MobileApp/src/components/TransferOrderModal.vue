
<template>
  <Transition name="fade">
    <div v-if="visible" class="fixed inset-0 bg-black/40 z-[100] flex items-end justify-center" @click.self="$emit('close')">
      <Transition name="slide-up">
        <div class="bg-white w-full rounded-t-[2.5rem] p-8 max-h-[80vh] flex flex-col shadow-2xl">
          <div class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
          
          <div class="flex justify-between items-center mb-6">
            <div>
              <h3 class="text-xl font-black text-gray-900">Masa Dəyişdir</h3>
              <p class="text-xs text-brand-primary font-bold uppercase tracking-wider mt-1">Cari Masa: {{ currentTableNumber }}</p>
            </div>
            <button @click="$emit('close')" class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
              </svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto pr-2 mb-6">
            <div class="grid grid-cols-4 gap-3">
              <button
                v-for="table in tables"
                :key="table.id"
                class="aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                :class="[
                  isCurrentTable(table.tableNumber)
                    ? 'border-gray-100 bg-gray-50 text-gray-300 opacity-50'
                    : isTableSelected(table.tableNumber)
                      ? 'border-brand-primary bg-brand-primary text-white shadow-lg shadow-orange-200'
                      : table.status === 'busy'
                        ? 'border-brand-rose/20 bg-brand-rose/5 text-brand-rose'
                        : 'border-gray-100 bg-gray-50 text-gray-600'
                ]"
                :disabled="isCurrentTable(table.tableNumber)"
                @click="selectedTable = table.tableNumber"
              >
                <span class="text-[10px] font-bold opacity-60">MASA</span>
                <span class="text-xl font-black">{{ table.tableNumber }}</span>
              </button>
            </div>
          </div>

          <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-500 rounded-xl text-xs font-bold flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
            </svg>
            {{ error }}
          </div>

          <button
            class="w-full py-4 rounded-2xl font-black text-white text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
            :class="selectedTable ? 'bg-brand-primary shadow-orange-200' : 'bg-gray-300'"
            :disabled="!selectedTable || loading"
            @click="handleTransfer"
          >
            <template v-if="loading">
              <svg class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>GÖNDƏRİLİR...</span>
            </template>
            <template v-else>
              <span>TRANSFER ET</span>
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M13 5l7 7-7 7M5 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
              </svg>
            </template>
          </button>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useAppStore } from '../stores/appStore'

const props = defineProps({
  visible: Boolean,
  currentTableNumber: [String, Number]
})

const emit = defineEmits(['close', 'success'])

const { state, transferOrder } = useAppStore()
const selectedTable = ref(null)
const loading = ref(false)
const error = ref(null)

const tables = computed(() => state.tables)

async function handleTransfer() {
  if (!selectedTable.value) return
  
  loading.value = true
  error.value = null
  
  try {
    await transferOrder(props.currentTableNumber, selectedTable.value)
    emit('success', selectedTable.value)
    emit('close')
  } catch (err) {
    error.value = err.message || 'Transfer zamanı xəta baş verdi.'
  } finally {
    loading.value = false
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    selectedTable.value = null
    error.value = null
  }
})

const isTableSelected = (tableNumber) => {
  return selectedTable.value !== null && String(selectedTable.value) === String(tableNumber)
}

const isCurrentTable = (tableNumber) => {
  return String(tableNumber) === String(props.currentTableNumber)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }
</style>
