<template>
  <div class="pb-20 min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-30 safe-top">
      <div class="px-4 h-16 flex items-center justify-between">
        <h1 class="text-xl font-bold tracking-tight">Ayarlar</h1>
        <button @click="handleLogout" class="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
          Çıxış
        </button>
      </div>
    </header>

    <section class="px-4 py-6 space-y-4">
      <!-- Profile Card -->
      <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-gradient-to-br from-brand-primary to-orange-400 flex items-center justify-center text-xl font-bold text-white shadow-md uppercase">
          {{ state.currentUser?.nick?.substring(0, 2) || 'OF' }}
        </div>
        <div class="flex-1">
          <h3 class="font-bold text-lg text-gray-900 capitalize">{{ state.currentUser?.nick || 'Ofisiant' }}</h3>
          <p class="text-sm text-gray-500 capitalize">{{ state.currentUser?.role || 'Waiter' }}</p>
        </div>
        <span class="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">Aktiv</span>
      </div>

      <!-- Statistics -->
      <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 class="font-bold text-gray-800 mb-3">📊 Statistika</h3>
        <div class="grid grid-cols-3 gap-3">
          <div class="text-center">
            <p class="text-2xl font-bold text-brand-primary">{{ state.tables.length }}</p>
            <p class="text-xs text-gray-500 mt-1">Masa</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-blue-600">{{ state.orders.length }}</p>
            <p class="text-xs text-gray-500 mt-1">Aktiv Sifariş</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-green-600">{{ busyCount }}</p>
            <p class="text-xs text-gray-500 mt-1">Dolu Masa</p>
          </div>
        </div>
      </div>

      <!-- Settings Options -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
        
        <!-- Bildirişlər -->
        <div class="flex items-center justify-between px-5 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
              </svg>
            </div>
            <span class="font-semibold text-gray-800">Bildirişlər</span>
          </div>
          <button
            @click="notificationsOn = !notificationsOn"
            class="w-11 h-6 rounded-full transition-colors duration-300 relative shrink-0"
            :class="notificationsOn ? 'bg-brand-primary' : 'bg-gray-300'"
          >
            <span
              class="absolute top-[3px] left-[3px] w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-300"
              :class="notificationsOn ? 'translate-x-5' : 'translate-x-0'"
            ></span>
          </button>
        </div>

        <!-- Qaranlıq Rejim -->
        <div class="flex items-center justify-between px-5 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
              </svg>
            </div>
            <div>
              <span class="font-semibold text-gray-800">Qaranlıq Rejim</span>
              <p class="text-[10px] text-gray-400">Gecə istifadəsi üçün</p>
            </div>
          </div>
          <button
            @click="toggleDarkMode"
            class="w-11 h-6 rounded-full transition-colors duration-300 relative shrink-0"
            :class="isDarkMode ? 'bg-brand-primary' : 'bg-gray-300'"
          >
            <span
              class="absolute top-[3px] left-[3px] w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-300"
              :class="isDarkMode ? 'translate-x-5' : 'translate-x-0'"
            ></span>
          </button>
        </div>

        <!-- Tənzimləmələr (Editable) -->
        <button @click="showSettings = !showSettings" class="w-full flex items-center justify-between px-5 py-4 active:bg-gray-50 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
              </svg>
            </div>
            <span class="font-semibold text-gray-800">Sistem Ayarları</span>
          </div>
          <svg class="w-5 h-5 text-gray-400 transition-transform" :class="showSettings ? 'rotate-90' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
          </svg>
        </button>
        
        <!-- Expanded Settings -->
        <Transition name="slide-down">
          <div v-if="showSettings" class="px-5 py-5 bg-gray-50 space-y-5">
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Vergi Dərəcəsi (%)</label>
              <div class="px-4 py-3 border border-gray-100 bg-gray-100 rounded-xl text-gray-500 font-semibold cursor-not-allowed flex justify-between items-center">
                <span>{{ state.appSettings?.taxRate !== undefined ? state.appSettings.taxRate + '%' : '...' }}</span>
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p class="text-xs text-gray-400 mt-1 ml-1">Dəyişdirmək üçün menecerə müraciət edin.</p>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Valyuta</label>
              <div class="flex items-center gap-2">
                <select 
                  v-model="tempCurrency"
                  class="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary appearance-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="TL">TL (₺)</option>
                  <option value="AZN">AZN (₼)</option>
                </select>
                <button @click="saveCurrency" class="px-4 py-2 bg-brand-primary text-white rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-transform">Save</button>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Version -->
      <p class="text-center text-xs text-gray-400 pt-2">Cafevania Gourmet v1.1.0</p>
    </section>

    <!-- Toast -->
    <ToastNotification ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore'
import ToastNotification from '../components/ToastNotification.vue'

const { state, busyCount, updateSettings, logout } = useAppStore()
const router = useRouter()
const toastRef = ref(null)

const showSettings = ref(true)
const notificationsOn = ref(true)
const isDarkMode = ref(false)

// Local state for editing

const tempCurrency = ref('USD')

// Sync with store on mount/update
watch(() => state.appSettings, (newVal) => {
  if (newVal) {
    tempCurrency.value = newVal.currency
  }
}, { immediate: true, deep: true })

onMounted(() => {
  isDarkMode.value = localStorage.getItem('darkMode') === 'true'
  applyDarkMode(isDarkMode.value)
})

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('darkMode', isDarkMode.value)
  applyDarkMode(isDarkMode.value)
}

function applyDarkMode(enabled) {
  if (enabled) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

async function saveCurrency() {
  try {
    await updateSettings({ currency: tempCurrency.value })
    toastRef.value?.show('Valyuta yeniləndi', 'success')
  } catch (e) {
    toastRef.value?.show('Xəta baş verdi', 'error')
  }
}

function handleLogout() {
  if (confirm('Çıxış etmək istəyirsiniz?')) {
    logout()
    router.push('/login')
  }
}
</script>


<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}
.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 300px;
  opacity: 1;
}
</style>
