<template>
  <nav class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 safe-bottom z-40">
    <div class="flex h-16 items-center justify-around px-2">
      <!-- Tables -->
      <router-link
        to="/"
        class="flex flex-col items-center gap-1 transition-colors duration-200 relative"
        :class="isActive('/') ? 'text-brand-primary' : 'text-gray-400'"
      >
        <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 3a1 1 0 00-1 1v16a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1H4zm2 2h4v4H6V5zm0 6h4v4H6v-4zm0 6h4v2H6v-2zm6-12h6v4h-6V5zm6 6v4h-6v-4h6zm0 6v2h-6v-2h6z" />
        </svg>
        <span class="text-[10px] font-bold uppercase">Masalar</span>
        <!-- Busy table indicator -->
        <span
          v-if="busyCount > 0"
          class="absolute -top-1 -right-2 w-4 h-4 bg-green-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center"
        >{{ busyCount }}</span>
      </router-link>

      <!-- Orders -->
      <router-link
        to="/orders"
        class="flex flex-col items-center gap-1 transition-colors duration-200 relative"
        :class="isActive('/orders') ? 'text-brand-primary' : 'text-gray-400'"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
        </svg>
        <span class="text-[10px] font-bold uppercase">Sifarişlər</span>
        <!-- Order count badge -->
        <span
          v-if="orderCount > 0"
          class="absolute -top-1 -right-2 w-4 h-4 bg-blue-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center"
        >{{ orderCount }}</span>
      </router-link>

      <!-- Settings -->
      <router-link
        to="/settings"
        class="flex flex-col items-center gap-1 transition-colors duration-200"
        :class="isActive('/settings') ? 'text-brand-primary' : 'text-gray-400'"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
        </svg>
        <span class="text-[10px] font-bold uppercase">Ayarlar</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/appStore'

const route = useRoute()
const { state, busyCount } = useAppStore()

const orderCount = computed(() => state.orders.length)

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
