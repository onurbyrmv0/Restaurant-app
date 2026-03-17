<template>
  <section class="w-1/3 min-w-[360px] border-r border-slate-200 flex flex-col bg-white">
    <!-- Header -->
    <div class="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col gap-3">
      <div class="flex justify-between items-center">
        <h2 class="font-bold text-slate-700 flex items-center gap-2 text-sm">
          <span class="material-symbols-outlined text-sm">list_alt</span>
          SİFARİŞLƏR
        </h2>
        <div class="flex items-center gap-2">
          <span class="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
            {{ activeOrderCount }} AKTİV
          </span>
        </div>
      </div>

      <!-- Date Range Toggle -->
      <div class="flex bg-slate-100 p-1 rounded-lg">
        <button 
          class="flex-1 py-1 px-2 text-[10px] font-bold rounded-md transition-all flex items-center justify-center gap-1.5"
          :class="!showArchive ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          @click="showArchive = false"
        >
          <span class="material-symbols-outlined text-xs">today</span>
          BUGÜN
        </button>
        <button 
          class="flex-1 py-1 px-2 text-[10px] font-bold rounded-md transition-all flex items-center justify-center gap-1.5"
          :class="showArchive ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          @click="showArchive = true"
        >
          <span class="material-symbols-outlined text-xs">history</span>
          ARXİV
        </button>
      </div>

      <!-- Archive Date Filter -->
      <div v-if="showArchive" class="flex items-center gap-2 animate-zoom-in">
        <div class="relative flex-1">
          <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">event</span>
          <input 
            type="date" 
            v-model="archiveDate"
            class="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
        <button 
          v-if="archiveDate"
          @click="archiveDate = ''"
          class="p-1.5 rounded-lg bg-slate-200/50 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all flex items-center"
          title="Təmizlə"
        >
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="px-4 pt-3 pb-1 flex gap-1.5 overflow-x-auto no-scrollbar">
      <button
        v-for="filter in filters"
        :key="filter.value"
        class="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap"
        :class="activeFilter === filter.value
          ? 'bg-primary text-white'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
        @click="activeFilter = filter.value"
      >
        {{ filter.label }}
      </button>
    </div>

    <!-- Orders List -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
        <div class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <p class="text-sm font-medium">Sifarişlər yüklənir...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex flex-col items-center justify-center h-full text-red-400 gap-2 p-4">
        <span class="material-symbols-outlined text-3xl">error</span>
        <p class="text-sm font-medium text-center">{{ error }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredOrders.length === 0" class="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
        <span class="material-symbols-outlined text-4xl opacity-40">receipt_long</span>
        <p class="text-sm font-medium">
          {{ activeFilter === 'all' ? 'Hələ sifariş yoxdur' : 'Bu filtrdə sifariş yoxdur' }}
        </p>
        <p class="text-xs text-slate-400">
          {{ archiveDate ? `${archiveDate} tarixində sifariş tapılmadı` : (showArchive ? 'Sistemdə heç bir köhnə sifariş tapılmadı' : 'Bu gün hələ sifariş qeydə alınmayıb') }}
        </p>
      </div>

      <!-- Orders -->
      <OrderCard
        v-else
        v-for="(order, index) in filteredOrders"
        :key="order.id"
        :order="order"
        :is-selected="order.id === selectedOrderId"
        :style="{ animationDelay: `${index * 80}ms` }"
        class="animate-fade-in-up"
        @select="selectOrder"
      />
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import OrderCard from './OrderCard.vue'
import { useOrders } from '../composables/useOrders.js'

const { orders, selectedOrderId, activeOrderCount, selectOrder, isLoading, error } = useOrders()

const activeFilter = ref('all')
const showArchive = ref(false)
const archiveDate = ref('')

const filters = [
  { value: 'all', label: 'Hamısı' },
  { value: 'new', label: 'Yeni' },
  { value: 'preparing', label: 'Hazırlanır' },
  { value: 'completed', label: 'Tamamlandı' },
]

const filteredOrders = computed(() => {
  let list = orders.value

  // Apply Today/Archive Filter
  if (!showArchive.value) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    list = list.filter(o => {
      if (!o.createdAt) return true 
      let orderDate
      if (o.createdAt.toDate) {
        orderDate = o.createdAt.toDate()
      } else if (o.createdAt.seconds) {
        orderDate = new Date(o.createdAt.seconds * 1000)
      } else {
        orderDate = new Date(o.createdAt)
      }
      return orderDate >= today
    })
  } else if (archiveDate.value) {
    // Specific date filtering for Archive
    const selectedDate = new Date(archiveDate.value)
    selectedDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(selectedDate)
    nextDay.setDate(nextDay.getDate() + 1)

    list = list.filter(o => {
      if (!o.createdAt) return false
      let orderDate
      if (o.createdAt.toDate) {
        orderDate = o.createdAt.toDate()
      } else if (o.createdAt.seconds) {
        orderDate = new Date(o.createdAt.seconds * 1000)
      } else {
        orderDate = new Date(o.createdAt)
      }
      return orderDate >= selectedDate && orderDate < nextDay
    })
  }

  // Apply Category/Status Filter
  if (activeFilter.value === 'all') return list
  if (activeFilter.value === 'completed') {
    return list.filter(o => ['completed', 'paid', 'closed', 'done'].includes(o.status))
  }
  return list.filter(o => o.status === activeFilter.value)
})
</script>
