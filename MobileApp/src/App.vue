<template>
  <div class="max-w-md mx-auto min-h-screen bg-gray-50 relative select-none">
    <!-- Loading Screen -->
    <div v-if="state.loading" class="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center">
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary to-orange-400 flex items-center justify-center mb-4 animate-pulse shadow-lg shadow-orange-200">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 6v6l4 2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
      </div>
      <p class="text-gray-500 font-semibold text-sm animate-pulse">Yüklənir...</p>
    </div>

    <!-- App Content -->
    <template v-else>
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
      <BottomNav v-if="state.currentUser" />
    </template>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import BottomNav from './components/BottomNav.vue'
import { useAppStore } from './stores/appStore'

const { state, initStore, destroyStore } = useAppStore()

onMounted(() => {
  initStore()

  // Initialize dark mode from localStorage
  if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark')
  }
})


onUnmounted(() => {
  destroyStore()
})
</script>
