<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>

        <!-- content -->
        <div class="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-zoom-in">
          <!-- Header -->
          <div class="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 class="font-black text-xl text-slate-800">Ödəniş</h3>
              <p class="text-sm text-slate-500 font-medium">Masa {{ order?.tableNumber }}</p>
            </div>
            <button @click="$emit('close')" class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div class="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
            <!-- Payment Mode Selection -->
            <div class="flex p-1 bg-slate-100 rounded-xl">
              <button 
                v-for="mode in ['full', 'items', 'amount']"
                :key="mode"
                @click="paymentMode = mode"
                class="flex-1 py-2 text-xs font-bold rounded-lg transition-all"
                :class="paymentMode === mode ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
              >
                {{ mode === 'full' ? 'Hamısı' : mode === 'items' ? 'Məhsullar' : 'Məbləğ' }}
              </button>
            </div>

            <!-- Total Display -->
            <div class="text-center bg-slate-50 py-6 rounded-3xl border border-slate-100">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {{ order?.paidAmount > 0 ? 'Qalıq Balans' : 'Yekun Ödəniş' }}
              </p>
              <div class="text-4xl font-black text-slate-800">₼{{ payableTotal.toFixed(2) }}</div>
              <p v-if="paymentMode !== 'full'" class="text-[10px] text-slate-400 mt-1 font-bold">
                Cəmi borc: ₼{{ ((total || 0) - (order?.paidAmount || 0)).toFixed(2) }}
              </p>
            </div>

            <!-- Item Selection Mode -->
            <div v-if="paymentMode === 'items'" class="space-y-3 animate-fade-in">
              <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Ödəniləcək Məhsullar</label>
              <div class="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                <div 
                  v-for="item in availableItems" 
                  :key="item.originalIndex"
                  @click="!item.isPaid && toggleItemSelection(item.originalIndex)"
                  class="flex items-center justify-between p-3 rounded-xl border-2 transition-all"
                  :class="[
                    item.isPaid ? 'border-emerald-100 bg-emerald-50/50 cursor-default opacity-70' :
                    selectedItemIndices.includes(item.originalIndex) ? 'border-primary bg-primary/5 cursor-pointer' : 'border-slate-50 hover:border-slate-200 cursor-pointer'
                  ]"
                >
                  <div class="flex items-center gap-3">
                    <div v-if="!item.isPaid"
                      class="w-5 h-5 rounded border flex items-center justify-center transition-colors shadow-sm"
                      :class="selectedItemIndices.includes(item.originalIndex) ? 'bg-primary border-primary text-white' : 'border-slate-300 bg-white'"
                    >
                      <span v-if="selectedItemIndices.includes(item.originalIndex)" class="material-symbols-outlined text-[14px]">check</span>
                    </div>
                    <div v-else class="text-emerald-500">
                      <span class="material-symbols-outlined text-lg">check_circle</span>
                    </div>
                    <div>
                      <div class="text-xs font-bold text-slate-800" :class="{'text-emerald-700': item.isPaid}">{{ item.name }}</div>
                      <div class="text-[10px] text-slate-500">
                        {{ item.quantity }}x • ₼{{ item.price.toFixed(2) }}
                        <span v-if="item.isPaid" class="ml-2 text-emerald-600 font-black uppercase text-[8px]">Ödənilmiş</span>
                      </div>
                    </div>
                  </div>
                  <div class="text-sm font-black" :class="item.isPaid ? 'text-emerald-600' : 'text-slate-700'">₼{{ (item.price * item.quantity).toFixed(2) }}</div>
                </div>
              </div>
            </div>

            <!-- Amount Mode -->
            <div v-if="paymentMode === 'amount'" class="animate-fade-in space-y-4">
              <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-2">Ödəniləcək məbləğ</label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">₼</span>
                  <input
                    v-model.number="manualAmount"
                    type="number"
                    class="w-full pl-12 pr-4 py-5 bg-white border-2 rounded-3xl font-black text-3xl transition-all outline-none"
                    :class="manualAmount > (total - (order?.paidAmount || 0)) ? 'border-red-500 text-red-500 ring-4 ring-red-500/10' : 'border-slate-100 text-primary focus:border-primary focus:ring-4 focus:ring-primary/10'"
                    placeholder="0.00"
                  >
                  <p v-if="manualAmount > (total - (order?.paidAmount || 0))" class="text-[10px] text-red-500 font-bold mt-2 px-2 animate-pulse">
                    ⚠️ Məbləğ qalıq borcdan çox ola bilməz!
                  </p>
                </div>
              </div>
              
              <!-- Quick Split Buttons -->
              <div class="flex gap-2">
                <button 
                  v-for="btn in [{l:'Tam', f:1}, {l:'1/2', f:2}, {l:'1/3', f:3}, {l:'1/4', f:4}]" 
                  :key="btn.l"
                  @click="setQuickAmount(btn.f)"
                  class="flex-1 py-3 rounded-xl border-2 border-slate-100 bg-white text-xs font-black text-slate-600 hover:border-primary hover:text-primary transition-all active:scale-95 shadow-sm"
                >
                  {{ btn.l }}
                </button>
              </div>
            </div>

            <!-- Payment Method Selection -->
            <div>
              <label class="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest px-2">Ödəniş Üsulu</label>
              <div class="flex gap-4">
                <button
                  class="flex-1 py-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all"
                  :class="paymentMethod === 'cash' 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-500/10' 
                    : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'"
                  @click="paymentMethod = 'cash'"
                >
                  <span class="material-symbols-outlined text-2xl">payments</span>
                  <span class="font-bold text-[10px] uppercase">Nağd</span>
                </button>
                <button
                  class="flex-1 py-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all"
                  :class="paymentMethod === 'card' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg shadow-blue-500/10' 
                    : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'"
                  @click="paymentMethod = 'card'"
                >
                  <span class="material-symbols-outlined text-2xl">credit_card</span>
                  <span class="font-bold text-[10px] uppercase">Kart</span>
                </button>
              </div>
            </div>

            <div v-if="paymentMode === 'full'" class="animate-fade-in">
              <label class="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest px-2">Bəxşiş (Tip)</label>
              <div class="flex gap-2">
                <button
                  v-for="amount in [1, 2, 5]"
                  :key="amount"
                  class="flex-1 py-2 rounded-xl font-bold text-xs transition-all border-2"
                  :class="tipAmount === amount ? 'border-primary bg-primary text-white' : 'border-slate-100 bg-slate-50 text-slate-600'"
                  @click="tipAmount = amount"
                >
                  ₼{{ amount }}
                </button>
                <input
                  v-model.number="tipAmount"
                  type="number"
                  class="w-20 px-2 rounded-xl border-2 border-slate-100 font-bold text-xs text-center"
                  placeholder="Digər"
                >
              </div>
            </div>

            <!-- Received & Change (Only for Cash) -->
            <div v-if="paymentMethod === 'cash'" class="grid grid-cols-2 gap-4 pt-2 animate-fade-in">
              <div>
                <label class="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest px-2">Müştərinin verdiyi</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₼</span>
                  <input
                    v-model.number="amountPaid"
                    type="number"
                    class="w-full pl-7 pr-3 py-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-800 focus:border-primary transition-all"
                  >
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest px-2">Qaytarılacaq (Qalıq)</label>
                <div 
                  class="w-full px-4 py-3 rounded-xl font-bold text-sm border-2 flex items-center justify-between"
                  :class="changeAmount >= 0 ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'"
                >
                  <span>₼{{ Math.abs(changeAmount).toFixed(2) }}</span>
                  <span v-if="changeAmount < 0" class="text-[8px] font-black">ƏSKİK</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
            <button
               @click="$emit('close')"
               class="px-6 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors"
            >
              Ləğv
            </button>
            <button
              class="flex-1 py-4 rounded-xl font-black text-white shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              :class="canComplete ? 'bg-primary shadow-primary/25 hover:bg-primary-dark' : 'bg-slate-300 cursor-not-allowed shadow-none'"
              :disabled="!canComplete"
              @click="handleComplete"
            >
              <span class="material-symbols-outlined">check_circle</span>
              {{ paymentMode === 'full' ? 'TAM ÖDƏNİŞ' : 'QİSMİ ÖDƏNİŞ' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  order: Object,
  total: Number
})

const emit = defineEmits(['close', 'confirm'])

const paymentMode = ref('full') // 'full', 'items', 'amount'
const amountPaid = ref(0)
const tipAmount = ref(0)
const paymentMethod = ref(props.order?.paymentMethod || 'cash') 
const selectedItemIndices = ref([])
const manualAmount = ref(0)

const availableItems = computed(() => {
  return (props.order?.items || []).map((item, originalIndex) => ({
    ...item,
    originalIndex
  })) // Don't filter, we'll handle visual state in template
})

const payableTotal = computed(() => {
  const remainingTotal = Math.max(0, (props.total || 0) - (props.order?.paidAmount || 0))
  let billAmount = 0
  
  if (paymentMode.value === 'full') {
    billAmount = remainingTotal
  } else if (paymentMode.value === 'items') {
    const subtotal = selectedItemIndices.value.reduce((sum, originalIdx) => {
      const item = props.order?.items[originalIdx]
      return sum + (item ? item.price * item.quantity : 0)
    }, 0)
    
    const ratio = subtotal / (props.order?.subtotal || subtotal || 1)
    const tax = (props.order?.tax || 0) * ratio
    const service = (props.order?.serviceCharge || 0) * ratio
    billAmount = subtotal + tax + service
  } else if (paymentMode.value === 'amount') {
    billAmount = manualAmount.value || 0
  }
  
  // Safety Cap: Don't allow paying more than what's left on the bill
  const finalBillAmount = Math.min(billAmount, remainingTotal)
  
  return Number(finalBillAmount.toFixed(2)) + (tipAmount.value || 0)
})

const changeAmount = computed(() => {
  return (amountPaid.value || 0) - payableTotal.value
})

const canComplete = computed(() => {
  if (paymentMethod.value === 'card') return payableTotal.value > 0
  return amountPaid.value >= payableTotal.value && payableTotal.value > 0
})

function toggleItemSelection(originalIdx) {
  const index = selectedItemIndices.value.indexOf(originalIdx)
  if (index > -1) {
    selectedItemIndices.value.splice(index, 1)
  } else {
    selectedItemIndices.value.push(originalIdx)
  }
}

function setQuickAmount(factor) {
  const remainingTotal = (props.total || 0) - (props.order?.paidAmount || 0)
  manualAmount.value = Number((remainingTotal / factor).toFixed(2))
}

function handleComplete() {
  if (!canComplete.value) return
  
  // finalizeApplied is what actually goes towards the bill (without tips)
  const tip = tipAmount.value || 0
  const finalizeApplied = payableTotal.value - tip
  const finalizeChange = paymentMethod.value === 'card' ? 0 : changeAmount.value

  emit('confirm', {
    amountPaid: finalizeApplied, 
    rawReceived: amountPaid.value, 
    tipAmount: tip,
    changeAmount: finalizeChange,
    finalTotal: payableTotal.value,
    paymentMethod: paymentMethod.value,
    isPartial: paymentMode.value !== 'full',
    paidItemIndices: paymentMode.value === 'items' ? selectedItemIndices.value : []
  })
}

// Reset and auto-fill when opening or changing mode
watch([() => props.visible, paymentMode], ([visible, mode]) => {
  if (visible) {
    const remainingTotal = (props.total || 0) - (props.order?.paidAmount || 0)
    if (mode === 'amount') {
       manualAmount.value = remainingTotal
    }
    if (mode === 'full') {
       selectedItemIndices.value = []
    }
  } else {
    // Reset on close
    tipAmount.value = 0
    amountPaid.value = 0
    selectedItemIndices.value = []
    manualAmount.value = 0
  }
}, { immediate: true })

// Auto-populate amountPaid when payableTotal changes
watch(payableTotal, (newTotal) => {
  amountPaid.value = newTotal
}, { immediate: true })

// Sync payment method for card
watch(paymentMethod, (newMethod) => {
  if (newMethod === 'card') {
    amountPaid.value = payableTotal.value
  }
})
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }
</style>
