<template>
  <div class="pb-20 min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-30 safe-top">
      <div class="px-4 h-16 flex items-center justify-between">
        <h1 class="text-xl font-bold tracking-tight">Sifarişlər</h1>
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {{ myOrders.length }} aktiv
          </span>
        </div>
      </div>
    </header>

    <section class="px-4 py-4 space-y-3">
      <!-- Empty state -->
      <div v-if="myOrders.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg class="h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
          </svg>
        </div>
        <h3 class="font-bold text-gray-400 text-lg">Aktiv sifariş yoxdur</h3>
        <p class="text-sm text-gray-400 mt-1">Masalara keçib sifariş əlavə edin</p>
      </div>

      <!-- Real Order Cards from Firestore -->
      <div
        v-for="order in myOrders"
        :key="order.id"
        class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <!-- Order Header -->
        <div class="p-4 flex items-center justify-between border-b border-gray-50">
          <div class="flex items-center gap-3">
            <!-- Financial Status Coloring -->
            <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors border shadow-sm"
              :class="getOrderPaymentStatus(order).class"
            >
              <span class="text-sm font-black uppercase">
                {{ order.tableNumber }}
              </span>
            </div>
            <div>
              <h3 class="font-bold text-gray-800">Masa {{ order.tableNumber }}</h3>
              <p class="text-xs text-gray-400 flex items-center gap-1">
                <span>{{ formatTime(order.createdAt) }}</span>
                <span v-if="order.waiterName" class="font-medium text-gray-500">• {{ order.waiterName }}</span>
              </p>
            </div>
          </div>
          <!-- Financial Status Badge -->
          <span
            class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm"
            :class="getOrderPaymentStatus(order).class"
          >
            {{ getOrderPaymentStatus(order).label }}
          </span>
        </div>

        <!-- Order Items -->
        <div class="px-4 py-3 space-y-3">
          <div
            v-for="(item, index) in order.items"
            :key="index"
            class="flex flex-col text-sm border-b border-gray-50 last:border-0 pb-3 last:pb-0 mb-1 last:mb-0"
          >
            <div class="flex justify-between items-center gap-2">
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <span class="text-gray-800 font-bold shrink-0">{{ item.quantity }}x</span> 
                <span class="text-gray-700 truncate">{{ item.name }}</span>
              </div>
              <span class="text-gray-500 font-semibold shrink-0">{{ currencySymbol }}{{ (item.price * item.quantity).toFixed(2) }}</span>
            </div>
            <!-- Note -->
            <div v-if="item.note || item.addedBy" class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 ml-6">
              <p v-if="item.note" class="text-xs text-orange-500 font-medium italic flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                {{ item.note }}
              </p>
              <span v-if="item.addedBy" class="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                {{ item.addedBy }}
              </span>
            </div>
            <!-- Status Toggle Button (Large & Touchable) -->
            <button 
              @click="toggleItemStatus(order.id, index, item.status)"
              class="mt-2 ml-6 self-start text-xs font-black px-5 py-2.5 rounded-xl uppercase border-2 transition-all active:scale-90 min-h-[44px] min-w-[120px] shadow-sm"
              :class="getItemStatusDetails(item.status || 'new').class"
            >
              {{ getItemStatusDetails(item.status || 'new').label }}
            </button>
          </div>

          <div class="flex justify-between pt-2 border-t border-gray-100 mt-2">
            <span class="font-bold text-gray-800 text-sm italic opacity-50">Ödəniləcək:</span>
            <span class="font-bold text-brand-primary">{{ currencySymbol }}{{ ((order.totalPrice || 0) - (order.paidAmount || 0)).toFixed(2) }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="px-4 py-4 flex gap-3 border-t border-gray-100 uppercase">
          <!-- Transfer Button -->
          <button
            v-if="!['paid', 'completed', 'closed'].includes(order.status)"
            @click="openTransfer(order)"
            class="flex-1 py-4 bg-gray-50 text-gray-600 border-2 border-gray-200 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 font-black text-xs min-h-[52px]"
            title="Masanı Dəyiş"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            MASANI DƏYİŞ
          </button>
          
          <div v-if="order.status === 'paid' || order.status === 'completed'" class="flex-1 py-4 bg-green-50 text-green-700 font-black text-sm rounded-2xl text-center border-2 border-green-200 flex items-center justify-center min-h-[52px]">
            TAM ÖDƏNİLDİ ✅
          </div>
        </div>
      </div>
    </section>
    
    <!-- Transfer Order Modal -->
    <TransferOrderModal
      :visible="showTransferModal"
      :current-table-number="activeOrderForTransfer?.tableNumber"
      @close="showTransferModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/appStore'
import TransferOrderModal from '../components/TransferOrderModal.vue'

const { 
  state, 
  updateOrderStatus, 
  updateItemStatus, 
  currencySymbol,
  getOrderPaymentStatus,
  getItemStatusDetails
} = useAppStore()

// Ofisiant yalnız öz sifarişlərini görsün
const myOrders = computed(() => {
  if (!state.currentUser?.id) return []
  return state.orders.filter(o => o.waiterId === state.currentUser.id)
})

const showTransferModal = ref(false)
const activeOrderForTransfer = ref(null)

function openTransfer(order) {
  activeOrderForTransfer.value = order
  showTransferModal.value = true
}

function formatTime(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })
}

async function updateStatus(orderId, status) {
  try {
    await updateOrderStatus(orderId, status)
  } catch (e) {
    console.error(e)
  }
}

async function toggleItemStatus(orderId, itemIndex, currentStatus) {
  let nextStatus = 'new'
  if (currentStatus === 'new' || !currentStatus) nextStatus = 'preparing'
  else if (currentStatus === 'preparing') nextStatus = 'done'
  else if (currentStatus === 'done') return // Stop at 'done', no further change
  
  try {
    await updateItemStatus(orderId, itemIndex, nextStatus)
  } catch (e) {
    console.error('Item status update error:', e)
  }
}
</script>
