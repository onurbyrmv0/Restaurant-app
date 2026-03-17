<template>
  <div class="h-screen flex bg-background-light text-slate-900 overflow-hidden">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col h-full overflow-hidden">
      <AppHeader />
      
      <main class="flex-1 flex overflow-hidden relative">
        <!-- Orders View: List + Details -->
        <template v-if="activeNav === 'orders'">
          <OrdersPanel />
          <OrderDetails />
        </template>

        <!-- Other Views -->
        <TablesView v-else-if="activeNav === 'tables'" class="w-full h-full" />
        <MenuView v-else-if="activeNav === 'menu'" class="w-full h-full" />
        <ReportsView v-else-if="activeNav === 'reports'" class="w-full h-full" />
        <SettingsView v-else-if="activeNav === 'settings'" class="w-full h-full" />
      </main>
    </div>

    <!-- Keyboard Shortcut Toast -->
    <Transition name="shortcut-toast">
      <div 
        v-if="shortcutToast" 
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-slate-900/90 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium pointer-events-none"
      >
        <span class="bg-white/15 px-2 py-0.5 rounded-md font-mono text-xs">{{ shortcutToast.key }}</span>
        <span>{{ shortcutToast.action }}</span>
      </div>
    </Transition>

    <!-- Fullscreen Indicator -->
    <Transition name="fade">
      <div 
        v-if="showFullscreenHint"
        class="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-slate-900/80 backdrop-blur-sm text-white px-5 py-2 rounded-full shadow-xl text-xs font-medium pointer-events-none flex items-center gap-2"
      >
        <span class="material-symbols-outlined text-sm">fullscreen</span>
        Tam ekran · <span class="font-mono bg-white/15 px-1.5 py-0.5 rounded">Esc</span> çıxmaq üçün
      </div>
    </Transition>
    
    <!-- Global Create Order Modal (POS) -->
    <CreateOrderModal 
      :visible="showPOSModal"
      @close="showPOSModal = false"
      @success="handleOrderSuccess"
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, provide } from 'vue'
import Sidebar from './components/Sidebar.vue'
import AppHeader from './components/AppHeader.vue'
import OrdersPanel from './components/OrdersPanel.vue'
import OrderDetails from './components/OrderDetails.vue'
import TablesView from './components/TablesView.vue'
import MenuView from './components/MenuView.vue'
import ReportsView from './components/ReportsView.vue'
import SettingsView from './components/SettingsView.vue'
import CreateOrderModal from './components/CreateOrderModal.vue'
import { useOrders } from './composables/useOrders.js'

const { activeNav, printBill } = useOrders()

// ── POS Modal State ──
const showPOSModal = ref(false)
provide('showPOS', () => showPOSModal.value = true)

function handleOrderSuccess() {
  // If we are already on orders nav, it will auto-update
  activeNav.value = 'orders'
}

// ── Fullscreen State ──
const isFullscreen = ref(false)
const showFullscreenHint = ref(false)
let fullscreenHintTimer = null

// ── Shortcut Toast ──
const shortcutToast = ref(null)
let toastTimer = null

function showShortcutToast(key, action) {
  shortcutToast.value = { key, action }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    shortcutToast.value = null
  }, 1200)
}

// ── Fullscreen Toggle ──
async function toggleFullscreen() {
  if (window.electronAPI) {
    isFullscreen.value = await window.electronAPI.toggleFullscreen()
  } else {
    // Browser fallback
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      isFullscreen.value = true
    } else {
      await document.exitFullscreen()
      isFullscreen.value = false
    }
  }

  if (isFullscreen.value) {
    showFullscreenHint.value = true
    clearTimeout(fullscreenHintTimer)
    fullscreenHintTimer = setTimeout(() => {
      showFullscreenHint.value = false
    }, 3000)
  } else {
    showFullscreenHint.value = false
  }
}

// ── Keyboard Shortcuts ──
function handleKeydown(e) {
  // F11 — Toggle fullscreen
  if (e.key === 'F11') {
    e.preventDefault()
    toggleFullscreen()
    showShortcutToast('F11', isFullscreen.value ? 'Tam ekrandan çıxıldı' : 'Tam ekran rejimi')
    return
  }

  // F2 — Open POS
  if (e.key === 'F2') {
    e.preventDefault()
    showPOSModal.value = true
    showShortcutToast('F2', 'Yeni Sifariş (POS)')
    return
  }

  // Escape — Exit fullscreen (if in fullscreen)
  if (e.key === 'Escape' && isFullscreen.value) {
    e.preventDefault()
    if (window.electronAPI) {
      window.electronAPI.exitFullscreen()
    } else if (document.fullscreenElement) {
      document.exitFullscreen()
    }
    isFullscreen.value = false
    showFullscreenHint.value = false
    return
  }

  // Ctrl+Key shortcuts
  if (e.ctrlKey && !e.shiftKey && !e.altKey) {
    // Ctrl+1-5 — Navigate tabs
    const navMap = {
      '1': { id: 'orders', label: 'Sifarişlər' },
      '2': { id: 'tables', label: 'Masalar' },
      '3': { id: 'menu', label: 'Menyu' },
      '4': { id: 'reports', label: 'Hesabatlar' },
      '5': { id: 'settings', label: 'Ayarlar' },
    }

    if (navMap[e.key]) {
      e.preventDefault()
      activeNav.value = navMap[e.key].id
      showShortcutToast(`Ctrl+${e.key}`, navMap[e.key].label)
      return
    }

    // Ctrl+P — Print bill
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault()
      if (activeNav.value === 'orders') {
        printBill()
        showShortcutToast('Ctrl+P', 'Çek çap edilir...')
      } else {
        showShortcutToast('Ctrl+P', 'Çap üçün Sifarişlər tabına keçin')
      }
      return
    }
  }
}

// ── Provide to child components ──
provide('isFullscreen', isFullscreen)
provide('toggleFullscreen', toggleFullscreen)

// ── Lifecycle ──
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)

  // Initialize dark mode from localStorage
  if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark')
  }

  // Electron fullscreen state listener
  if (window.electronAPI?.onFullscreenChanged) {
    window.electronAPI.onFullscreenChanged((state) => {
      isFullscreen.value = state
      if (!state) showFullscreenHint.value = false
    })
  }
})


onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  clearTimeout(toastTimer)
  clearTimeout(fullscreenHintTimer)
})
</script>

<style>
/* Shortcut toast animation */
.shortcut-toast-enter-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.shortcut-toast-leave-active {
  transition: all 0.3s ease-in;
}
.shortcut-toast-enter-from {
  opacity: 0;
  transform: translate(-50%, 12px);
}
.shortcut-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}

/* Fade animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
