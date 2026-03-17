
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="$emit('close')"></div>
        
        <div class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-zoom-in">
          <div class="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 class="font-black text-xl text-slate-800">Masa Dəyişdir</h3>
              <p class="text-sm text-slate-500 font-medium">Cari Masa: {{ currentTableNumber }}</p>
            </div>
            <button @click="$emit('close')" class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div class="p-8">
            <div class="mb-6">
              <label class="block text-xs font-bold text-slate-500 mb-4 uppercase text-center">Hədəf Masa Seçin</label>
              <div class="grid grid-cols-4 gap-3 max-h-[300px] overflow-y-auto p-1">
                <button
                  v-for="tableId in tables"
                  :key="tableId"
                  class="aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all"
                  :class="[
                    String(tableId) === String(currentTableNumber)
                      ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      : selectedTable === tableId
                        ? 'border-primary bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                        : isTableBusy(tableId)
                          ? 'border-amber-100 bg-amber-50 text-amber-600 opacity-60'
                          : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-primary/30 hover:bg-white'
                  ]"
                  :disabled="String(tableId) === String(currentTableNumber)"
                  @click="selectedTable = tableId"
                >
                  <span class="text-xs font-bold">MASA</span>
                  <span class="text-2xl font-black">{{ tableId }}</span>
                  <span v-if="isTableBusy(tableId)" class="text-[8px] font-black uppercase">Məşğul</span>
                </button>
              </div>
            </div>

            <div v-if="error" class="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-medium mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">error</span>
              {{ error }}
            </div>

            <button
              class="w-full py-4 rounded-xl font-black text-white text-lg shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              :class="selectedTable ? 'bg-primary hover:bg-primary-dark shadow-primary/25' : 'bg-slate-300 cursor-not-allowed'"
              :disabled="!selectedTable || loading"
              @click="handleTransfer"
            >
              <template v-if="loading">
                <div class="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                TRANSFER EDİLİR...
              </template>
              <template v-else>
                <span class="material-symbols-outlined">move_up</span>
                TRANSFER ET
              </template>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useOrders } from '../composables/useOrders.js'

const props = defineProps({
  visible: Boolean,
  currentTableNumber: [String, Number]
})

const emit = defineEmits(['close', 'success'])

const { orders, tableStats, transferOrder } = useOrders()
const selectedTable = ref(null)
const loading = ref(false)
const error = ref(null)

const tables = Array.from({ length: 12 }, (_, i) => i + 1)

function isTableBusy(tableId) {
  // Check if there are active orders for this table
  return orders.value.some(o => 
    String(o.tableNumber) === String(tableId) && 
    !['completed', 'paid', 'closed'].includes(o.status)
  )
}

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
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }
</style>
