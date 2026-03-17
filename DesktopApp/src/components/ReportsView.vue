<template>
  <section class="flex-1 flex flex-col bg-background-light overflow-hidden p-6">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-6">
        <div>
          <h2 class="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span class="material-symbols-outlined text-primary">analytics</span>
            Günün Hesabatı
          </h2>
          <p class="text-sm text-slate-500 mt-1">Satış göstəriciləri</p>
        </div>
        
        <!-- Date Picker -->
        <div class="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-xl shadow-sm">
          <span class="material-symbols-outlined text-slate-400">calendar_today</span>
          <input 
            type="date" 
            v-model="selectedDate" 
            @change="handleDateChange"
            class="outline-none text-slate-700 font-medium"
          />
        </div>
      </div>

      <button 
        @click="exportExcel"
        class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-600/20 active:scale-95 transition-all"
        :disabled="loading || dailyOrders.length === 0"
      >
        <span class="material-symbols-outlined">download</span>
        Excel İxrac Et
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- Total Revenue -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
          <span class="material-symbols-outlined">payments</span>
        </div>
        <div class="flex-1">
          <p class="text-sm text-slate-500 font-medium">Ümumi Gəlir</p>
          <h3 class="text-2xl font-black text-slate-900">₼{{ totalRevenue.toFixed(2) }}</h3>
          <div class="flex gap-4 mt-2 border-t border-slate-50 pt-2">
            <div class="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
              <span class="material-symbols-outlined text-[12px]">payments</span>
              NAĞD: ₼{{ cashRevenue.toFixed(2) }}
            </div>
            <div class="text-[10px] font-bold text-blue-600 flex items-center gap-1">
              <span class="material-symbols-outlined text-[12px]">credit_card</span>
              KART: ₼{{ cardRevenue.toFixed(2) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Total Tips -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
          <span class="material-symbols-outlined">savings</span>
        </div>
        <div>
          <p class="text-sm text-slate-500 font-medium">Bəxşişlər</p>
          <h3 class="text-2xl font-black text-slate-900">₼{{ totalTips.toFixed(2) }}</h3>
        </div>
      </div>

      <!-- Total Orders -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
          <span class="material-symbols-outlined">receipt_long</span>
        </div>
        <div>
          <p class="text-sm text-slate-500 font-medium">Ödəniş Sayı</p>
          <h3 class="text-2xl font-black text-slate-900">{{ totalOrders }}</h3>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <SalesChart :hourly-data="hourlySales" />
      <TopItemsChart :items="topItems" />
    </div>

    <!-- Transactions Table -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 class="font-bold text-slate-800 text-sm">Son Tranzaksiyalar</h3>
        <span class="text-[10px] font-black uppercase text-slate-400">Gələn Ödənişlər</span>
      </div>
      
      <div class="flex-1 overflow-y-auto max-h-[500px]">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white sticky top-0 z-10">
                <th class="px-6 py-3">Vaxt</th>
                <th class="px-6 py-3">Masa</th>
                <th class="px-6 py-3 text-right">Məbləğ</th>
                <th class="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="text-sm divide-y divide-slate-50">
              <tr v-if="loading" class="animate-pulse">
                <td colspan="4" class="px-6 py-8 text-center text-slate-400">Yüklənir...</td>
              </tr>
              <tr v-else-if="dailyOrders.length === 0">
                <td colspan="4" class="px-6 py-8 text-center text-slate-400">Bu gün üçün ödəniş yoxdur.</td>
              </tr>
              <tr 
                v-for="order in dailyOrders" 
                :key="order.id"
                class="hover:bg-slate-50 transition-colors"
              >
                <td class="px-6 py-4 text-slate-600 py-4 text-xs">
                  {{ order.displayDate ? new Date(order.displayDate).toLocaleTimeString('az-AZ', {hour: '2-digit', minute:'2-digit'}) : '--:--' }}
                </td>
                <td class="px-6 py-4 font-bold text-slate-800 text-xs">Masa {{ order.tableNumber }}</td>
                <td class="px-6 py-4 text-right font-black text-slate-800 text-sm">₼{{ (order.total || 0).toFixed(2) }}</td>
                <td class="px-6 py-4 text-center">
                  <span 
                    class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase"
                    :class="order.status === 'completed' || order.status === 'closed' || order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'"
                  >
                    {{ order.status === 'completed' || order.status === 'closed' || order.status === 'paid' ? 'Tam' : 'Hissəvi' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useReport } from '../composables/useReport.js'
import SalesChart from './SalesChart.vue'
import TopItemsChart from './TopItemsChart.vue'

// Get today's date in YYYY-MM-DD format using local time
const now = new Date()
const year = now.getFullYear()
const month = String(now.getMonth() + 1).padStart(2, '0')
const day = String(now.getDate()).padStart(2, '0')
const todayStr = `${year}-${month}-${day}`

const selectedDate = ref(todayStr)

const { 
  loading, 
  totalRevenue, 
  cashRevenue,
  cardRevenue,
  totalTips,
  totalOrders, 
  dailyOrders,
  outOfStockItems,
  hourlySales,
  topItems,
  fetchDailyReport, 
  exportToExcel: exportExcel 
} = useReport()

function handleDateChange() {
  if (selectedDate.value) {
    // Create date object from string (YYYY-MM-DD)
    const [year, month, day] = selectedDate.value.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day)
    fetchDailyReport(dateObj)
  }
}

onMounted(() => {
  fetchDailyReport()
})
</script>
