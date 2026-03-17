<template>
  <aside class="w-24 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6 shrink-0 z-20 shadow-lg">
    <!-- Brand Logo -->
    <div class="px-3 mb-2">
      <div class="size-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
        <img src="/logo.jpg" alt="Logo" class="w-full h-full object-cover"/>
      </div>
    </div>

    <!-- POS Button (Special) -->

    <div class="px-2 w-full mb-2">
      <button
        class="w-full aspect-square rounded-2xl bg-primary text-white flex flex-col items-center justify-center gap-1 shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all active:scale-95 group relative"
        @click="showPOS"
        title="Yeni Sifariş (POS)"
      >
        <span class="material-symbols-outlined text-2xl">add_shopping_cart</span>
        <span class="text-[9px] font-black uppercase tracking-tighter">Yeni</span>
        
        <!-- Tooltip -->
        <div class="absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
          <span class="font-semibold">Sürətli Sifariş (F2)</span>
        </div>
      </button>
    </div>

    <!-- Nav Items -->
    <nav class="flex-1 flex flex-col gap-3 w-full px-2">
      <button
        v-for="nav in navItems"
        :key="nav.id"
        class="flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 group relative"
        :class="activeNav === nav.id
          ? 'bg-primary/10 text-primary translate-x-1 shadow-sm'
          : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'"
        @click="activeNav = nav.id"
      >
        <!-- Active Indicator Line -->
        <div 
          v-if="activeNav === nav.id"
          class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"
        ></div>

        <span 
          class="material-symbols-outlined text-3xl transition-transform group-hover:scale-110"
          :class="{ 'font-variation-fill': activeNav === nav.id }"
        >{{ nav.icon }}</span>
        
        <span class="text-[10px] font-bold mt-1 tracking-wide">{{ nav.label }}</span>
        
        <!-- Badge -->
        <span
          v-if="nav.id === 'orders' && activeOrderCount > 0 && activeNav !== 'orders'"
          class="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm"
        >
          {{ activeOrderCount > 9 ? '9+' : activeOrderCount }}
        </span>

        <!-- Shortcut Tooltip -->
        <div class="absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg flex flex-col gap-0.5">
          <span class="font-semibold">{{ nav.label }}</span>
          <span class="text-slate-400 font-mono text-[10px]">{{ nav.shortcut }}</span>
        </div>
      </button>
    </nav>
    
    <!-- System Status (Bottom) -->
    <div class="mt-auto mb-4 flex flex-col items-center gap-3 w-full px-2">
      <!-- Fullscreen Toggle -->
      <button
        @click="toggleFullscreen"
        class="group relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors border cursor-pointer"
        :class="isFullscreen
          ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
          : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600'"
      >
        <span class="material-symbols-outlined text-xl">
          {{ isFullscreen ? 'fullscreen_exit' : 'fullscreen' }}
        </span>
        
        <!-- Tooltip -->
        <div class="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
          {{ isFullscreen ? 'Normal rejim' : 'Tam ekran' }}
          <span class="ml-1 text-slate-400 font-mono">F11</span>
        </div>
      </button>

      <!-- Sync Status -->
      <div 
        class="group relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors cursor-help border"
        :class="isOnline 
          ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' 
          : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'"
      >
        <span class="material-symbols-outlined text-xl">{{ isOnline ? 'wifi' : 'wifi_off' }}</span>
        
        <!-- Status Dot -->
        <div class="absolute w-2.5 h-2.5 rounded-full top-1.5 right-1.5 border-2 border-white"
             :class="isOnline ? 'bg-green-500' : 'bg-red-500'"></div>
        
        <!-- Tooltip -->
        <div class="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
          Sistem: {{ isOnline ? 'Onlayn' : 'Oflayn' }}
        </div>
      </div>

      
      <div class="text-[10px] text-slate-300 font-mono mt-2 select-none">v1.0</div>
    </div>
  </aside>
</template>

<script setup>
import { useOrders } from '../composables/useOrders.js'
import { ref, inject, onMounted, onUnmounted } from 'vue'

const { activeNav, activeOrderCount } = useOrders()

// Fullscreen from parent (App.vue)
const isFullscreen = inject('isFullscreen', ref(false))
const toggleFullscreen = inject('toggleFullscreen', () => {})
const showPOS = inject('showPOS', () => {})

// Online/Offline Status
const isOnline = ref(navigator.onLine)

function updateStatus() {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', updateStatus)
  window.addEventListener('offline', updateStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateStatus)
  window.removeEventListener('offline', updateStatus)
})

const navItems = [
  { id: 'orders', icon: 'receipt_long', label: 'Sifariş', shortcut: 'Ctrl + 1' },
  { id: 'tables', icon: 'table_restaurant', label: 'Masa', shortcut: 'Ctrl + 2' },
  { id: 'menu', icon: 'restaurant_menu', label: 'Menyu', shortcut: 'Ctrl + 3' },
  { id: 'reports', icon: 'analytics', label: 'Hesabat', shortcut: 'Ctrl + 4' },
  { id: 'settings', icon: 'settings', label: 'Ayarlar', shortcut: 'Ctrl + 5' },
]
</script>

<style scoped>
.font-variation-fill {
  font-variation-settings: 'FILL' 1;
}
</style>
