<template>
  <section v-if="selectedOrder" class="flex-1 flex flex-col bg-background-light overflow-hidden">
    <!-- Details Header -->
    <div :key="selectedOrder.id" class="p-6 flex justify-between items-center bg-white border-b border-slate-200 shrink-0 animate-slide-in-right">
      <div>
        <h2 class="text-2xl font-bold flex items-center gap-3 text-slate-900">
          Sifariş - Masa {{ selectedOrder.tableNumber }}
          <span 
            class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm"
            :class="getOrderPaymentStatus(selectedOrder).class"
          >
            {{ getOrderPaymentStatus(selectedOrder).label }}
          </span>
        </h2>
        <p class="text-slate-500 text-sm mt-0.5 space-x-2">
          <span v-if="formattedStartTime" class="flex items-center gap-1 inline-flex">
            <span class="material-symbols-outlined text-[14px]">schedule</span>
            {{ formattedStartTime }}
          </span>
          <span v-if="selectedOrder.server" class="flex items-center gap-1 inline-flex text-slate-400">
            • {{ selectedOrder.server }}
          </span>
        </p>
      </div>
      <div class="flex gap-2">
        <button
          class="p-2 border border-slate-200 rounded-lg hover:bg-amber-50 hover:border-amber-200 transition-colors text-slate-600 hover:text-amber-600"
          title="Masani dəyiş"
          @click="showTransferModal = true"
        >
          <span class="material-symbols-outlined">move_up</span>
        </button>
        <button
          id="edit-order-btn"
          class="p-2 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors text-slate-600 hover:text-blue-600"
          title="Redaktə et"
          @click="showEditModal = true"
        >
          <span class="material-symbols-outlined">edit</span>
        </button>
        <button
          id="delete-order-btn"
          class="p-2 border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors text-slate-500 hover:text-red-500"
          title="Sifarişi sil"
          @click="showDeleteConfirm = true"
        >
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>
    </div>

    <!-- Items Table -->
    <div :key="'items-' + selectedOrder.id" class="flex-1 overflow-y-auto p-6">
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
              <th class="px-6 py-3">Məhsul</th>
              <th class="px-6 py-3 text-center">Status</th>
              <th class="px-6 py-3 text-center">Say</th>
              <th class="px-6 py-3 text-right">Qiymət</th>
              <th class="px-6 py-3 text-right">Cəmi</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <tr
              v-for="(item, index) in selectedOrder.items"
              :key="index"
              class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors animate-fade-in-up"
              :style="{ animationDelay: `${index * 60}ms` }"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="font-medium text-slate-800">{{ item.name }}</div>
                  <span v-if="item.addedBy" class="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                    {{ item.addedBy }}
                  </span>
                  <span v-if="item.isPaid" class="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm animate-pulse-slow">
                    ÖDƏNİLİB
                  </span>
                </div>
                <div v-if="item.description" class="text-xs text-slate-400 mt-0.5">{{ item.description }}</div>
              </td>
              <td class="px-6 py-4 text-center">
                <span 
                  class="text-[9px] font-bold px-2 py-0.5 rounded uppercase"
                  :class="getStatusClasses(item.status || 'new')"
                >
                  {{ getStatusLabel(item.status || 'new') }}
                </span>
              </td>
              <td class="px-6 py-4 text-center text-slate-600">{{ item.quantity }}</td>
              <td class="px-6 py-4 text-right text-slate-600">₼{{ (item.price || 0).toFixed(2) }}</td>
              <td class="px-6 py-4 text-right font-semibold text-slate-800">₼{{ ((item.quantity || 0) * (item.price || 0)).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Notes Section -->
      <div
        v-if="selectedOrder.notes"
        class="mt-4 p-4 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs italic bg-white/60"
      >
        <span class="font-bold not-italic text-slate-700 mr-2">Qeyd:</span>
        {{ selectedOrder.notes }}
      </div>
    </div>

    <!-- Checkout Summary -->
    <div class="p-6 bg-white border-t border-slate-200 shrink-0">
      <div class="flex flex-col md:flex-row gap-8 items-start">
        <!-- Pricing Breakdown & Payment Info -->
        <div class="flex-1 w-full space-y-4">
          <div class="space-y-2">
             <div class="flex justify-between text-slate-500 text-sm">
              <span>Ara Cəm</span>
              <span class="font-semibold text-slate-700">₼{{ subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-slate-500 text-sm">
              <span>Vergi ({{ parseFloat(taxRate.toFixed(2)) }}%)</span>
              <span class="font-semibold text-slate-700">₼{{ tax.toFixed(2) }}</span>
            </div>
            <div v-if="serviceChargeRate > 0" class="flex justify-between text-slate-500 text-sm">
              <span>Xidmət haqqı ({{ parseFloat(serviceChargeRate.toFixed(2)) }}%)</span>
              <span class="font-semibold text-slate-700">₼{{ serviceCharge.toFixed(2) }}</span>
            </div>
            
            <div class="border-t border-slate-200 my-2"></div>

            <div v-if="selectedOrder.paidAmount > 0" class="space-y-2">
              <div class="flex justify-between text-emerald-600 text-sm font-bold">
                <span>Ödənilən məbləğ</span>
                <span>₼{{ selectedOrder.paidAmount.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-rose-600 text-lg font-black">
                <span>Qalıq məbləğ</span>
                <span>₼{{ (grandTotal - selectedOrder.paidAmount).toFixed(2) }}</span>
              </div>
            </div>
            <div v-else class="flex justify-between items-center">
              <span class="font-black text-slate-800 text-lg uppercase">Cəmi</span>
              <span class="font-black text-primary text-3xl">₼{{ grandTotal.toFixed(2) }}</span>
            </div>
          </div>

          <!-- Payment Details (Visible only when paid) -->
          <div v-if="isPaid" class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 text-sm animate-fade-in-up">
            <div class="flex justify-between items-center text-slate-500">
              <span>Müştəri Ödədi</span>
              <div class="flex items-center gap-2">
                <span 
                  class="text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1"
                  :class="selectedOrder.paymentMethod === 'card' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'"
                >
                  <span class="material-symbols-outlined text-[12px]">{{ selectedOrder.paymentMethod === 'card' ? 'credit_card' : 'payments' }}</span>
                  {{ selectedOrder.paymentMethod === 'card' ? 'Kart' : 'Nağd' }}
                </span>
                <span class="font-bold text-slate-700 text-base">₼{{ (selectedOrder.amountPaid || 0).toFixed(2) }}</span>
              </div>
            </div>
            
            <div v-if="(selectedOrder.tipAmount || 0) > 0" class="flex justify-between items-center text-emerald-600">
              <span class="flex items-center gap-1 font-medium"><span class="material-symbols-outlined text-[16px]">savings</span> Bəxşiş</span>
              <span class="font-bold">₼{{ (selectedOrder.tipAmount || 0).toFixed(2) }}</span>
            </div>
            
            <div class="pt-2 border-t border-dashed border-slate-200 flex justify-between items-center">
              <span class="text-slate-400 font-medium">Qaytarıldı (Qalıq)</span>
              <span class="font-black text-slate-600 text-lg">₼{{ (selectedOrder.changeAmount || 0).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-48 shrink-0">
          <button
            id="print-bill-btn"
            class="w-full sm:w-auto px-8 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors active:scale-95"
            @click="printBill"
          >
            <span class="material-symbols-outlined">print</span>
            ÇEK ÇAP ET
          </button>
          <button
            id="mark-paid-btn"
            class="w-full sm:w-auto px-10 py-4 rounded-xl font-black flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95"
            :class="isPaid
              ? 'bg-green-500 text-white shadow-green-500/25 cursor-default'
              : 'bg-primary text-white shadow-primary/25 hover:bg-primary-dark'"
            :disabled="isPaid"
            @click="handleMarkPaid"
          >
            <span class="material-symbols-outlined">
              {{ isPaid ? 'check_circle' : 'payments' }}
            </span>
            {{ isPaid ? 'TAMAMLANDI' : 'ÖDƏNİŞ ET' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog
      :visible="showDeleteConfirm"
      title="Sifarişi silmək?"
      :message="`Masa ${selectedOrder.tableNumber} üçün sifarişi silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`"
      icon="delete_forever"
      variant="danger"
      confirm-text="Sil"
      cancel-text="Ləğv et"
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false"
    />

    <!-- Payment Modal -->
    <PaymentModal
      :visible="showPaymentModal"
      :order="selectedOrder"
      :total="grandTotal"
      @close="showPaymentModal = false"
      @confirm="handlePaymentComplete"
    />

    <!-- Edit Order Modal -->
    <EditOrderModal
      :visible="showEditModal"
      :order="selectedOrder"
      @close="showEditModal = false"
      @save="handleEditSave"
    />

    <!-- Transfer Order Modal -->
    <TransferOrderModal
      :visible="showTransferModal"
      :current-table-number="selectedOrder.tableNumber"
      @close="showTransferModal = false"
    />
  </section>

  <!-- Empty State -->
  <section v-else class="flex-1 flex items-center justify-center bg-background-light">
    <div class="text-center text-slate-400">
      <span class="material-symbols-outlined text-6xl mb-4 block opacity-30">receipt_long</span>
      <p class="text-lg font-semibold">Detalları görmək üçün sifariş seçin</p>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useOrders } from '../composables/useOrders.js'
import ConfirmDialog from './ConfirmDialog.vue'
import EditOrderModal from './EditOrderModal.vue'
import PaymentModal from './PaymentModal.vue'
import TransferOrderModal from './TransferOrderModal.vue'

const {
  selectedOrder,
  subtotal,
  tax,
  serviceCharge,
  grandTotal,
  taxRate,
  serviceChargeRate,
  markAsPaid,
  deleteOrder,
  updateOrderStatus,
  updateOrderNotes,
  printBill,
  formatStartedAt,
  getOrderPaymentStatus,
} = useOrders()

const showDeleteConfirm = ref(false)
const showPaymentModal = ref(false)
const showEditModal = ref(false)
const showTransferModal = ref(false)

const formattedStartTime = computed(() => {
  if (!selectedOrder.value) return ''
  if (selectedOrder.value.startedAt) return selectedOrder.value.startedAt
  return formatStartedAt(selectedOrder.value.createdAt)
})

const isPaid = computed(() => {
  return ['paid', 'closed', 'completed'].includes(selectedOrder.value?.status)
})

function handleMarkPaid() {
  if (isPaid.value) return
  showPaymentModal.value = true
}

async function handlePaymentComplete(paymentData) {
  showPaymentModal.value = false
  await markAsPaid(paymentData)
}

async function handleDelete() {
  showDeleteConfirm.value = false
  if (selectedOrder.value) {
    await deleteOrder(selectedOrder.value.id)
  }
}

async function handleEditSave(changes) {
  showEditModal.value = false
  if (!selectedOrder.value) return

  const orderId = selectedOrder.value.id

  if (changes.status !== selectedOrder.value.status) {
    await updateOrderStatus(orderId, changes.status)
  }
  if (changes.notes !== selectedOrder.value.notes) {
    await updateOrderNotes(orderId, changes.notes)
  }
}

function getStatusClasses(status) {
  switch (status) {
    case 'new': return 'bg-red-50 text-red-600 border border-red-100'
    case 'preparing': return 'bg-blue-50 text-blue-600 border border-blue-100'
    case 'done': return 'bg-green-50 text-green-600 border border-green-100'
    default: return 'bg-slate-50 text-slate-500 border border-slate-100'
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'new': return 'Yeni'
    case 'preparing': return 'Hazırlanır'
    case 'done': return 'Təhvil'
    default: return status
  }
}
</script>
