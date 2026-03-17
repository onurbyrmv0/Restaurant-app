<template>
  <section class="flex-1 flex flex-col bg-background-light overflow-hidden">
    <!-- Header -->
    <div class="p-6 bg-white border-b border-slate-200 shrink-0">
      <h2 class="text-2xl font-bold text-slate-900 flex items-center gap-3">
        <span class="material-symbols-outlined text-primary">settings</span>
        Ayarlar
      </h2>
      <p class="text-sm text-slate-500 mt-1">Sistem parametrləri</p>
    </div>

    <!-- Settings Content -->
    <div class="flex-1 overflow-y-auto p-6 space-y-4">
      <!-- Terminal Info -->
      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 class="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
          <span class="material-symbols-outlined text-sm text-primary">terminal</span>
          Terminal Məlumatları
        </h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between py-2 border-b border-slate-100">
            <span class="text-slate-500">Terminal No</span>
            <span class="font-semibold text-slate-800">#01</span>
          </div>
          <div class="flex justify-between py-2 border-b border-slate-100">
            <span class="text-slate-500">Versiya</span>
            <span class="font-semibold text-slate-800">v1.0.0</span>
          </div>
          <div class="flex justify-between py-2 border-b border-slate-100">
            <span class="text-slate-500">Firebase Layihəsi</span>
            <span class="font-semibold text-slate-800">restapp-675a7</span>
          </div>
          <div class="flex justify-between py-2">
            <span class="text-slate-500">Sinxronizasiya</span>
            <span class="font-semibold text-green-600 flex items-center gap-1">
              <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse-dot"></span>
              Aktiv
            </span>
          </div>
        </div>
      </div>

      <!-- Tax Settings -->
      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 class="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
          <span class="material-symbols-outlined text-sm text-primary">calculate</span>
          Vergi Parametrləri
        </h3>
        <div class="space-y-4 text-sm mt-3">
          <div v-if="!isEditingRates">
            <div class="flex justify-between py-2 border-b border-slate-100">
              <span class="text-slate-500">Vergi dərəcəsi</span>
              <span class="font-semibold text-slate-800">{{ taxRate.toFixed(0) }}%</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-slate-500">Xidmət haqqı</span>
              <span class="font-semibold text-slate-800">
                {{ serviceChargeRate.toFixed(0) }}% {{ serviceChargeRate === 0 ? '(Daxil deyil)' : '' }}
              </span>
            </div>
            <button 
              @click="startEditing"
              class="w-full mt-2 py-2 text-primary font-medium hover:bg-primary/5 rounded-lg transition-colors border border-primary/20"
            >
              Dərəcələri Dəyiş
            </button>
          </div>

          <div v-else class="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div class="mb-3">
              <label class="block text-xs font-bold text-slate-500 mb-1">Vergi Faizi (%)</label>
              <input 
                v-model.number="editTax" 
                type="number" 
                min="0" 
                max="100" 
                step="0.1"
                class="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
            </div>
            <div class="mb-3">
              <label class="block text-xs font-bold text-slate-500 mb-1">Xidmət Haqqı (%)</label>
              <input 
                v-model.number="editService" 
                type="number" 
                min="0" 
                max="100" 
                step="0.1"
                class="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
            </div>
            <div class="flex gap-2">
              <button 
                @click="cancelEdit"
                class="flex-1 py-1.5 text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50"
              >
                Ləğv et
              </button>
              <button 
                @click="saveRates"
                class="flex-1 py-1.5 text-white bg-primary rounded hover:bg-primary-dark shadow-sm shadow-primary/25"
              >
                Yadda saxla
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Dark Mode -->
      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 class="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
          <span class="material-symbols-outlined text-sm text-primary">dark_mode</span>
          Görünüş Rejimi
        </h3>
        <div class="flex items-center justify-between py-2 text-sm">
          <div>
            <span class="text-slate-700 font-medium">Qaranlıq Rejim</span>
            <p class="text-xs text-slate-400 mt-0.5">Gecə rejimi göz yorğunluğunu azaldır</p>
          </div>
          <button
            @click="toggleDarkMode"
            class="w-14 h-7 rounded-full transition-colors duration-300 relative shrink-0"
            :class="isDarkMode ? 'bg-primary' : 'bg-slate-300'"
          >
            <span
              class="absolute top-[3px] left-[3px] w-[22px] h-[22px] bg-white rounded-full shadow-sm transition-transform duration-300 flex items-center justify-center"
              :class="isDarkMode ? 'translate-x-7' : 'translate-x-0'"
            >
              <span class="material-symbols-outlined text-[14px]" :class="isDarkMode ? 'text-primary' : 'text-slate-400'">
                {{ isDarkMode ? 'dark_mode' : 'light_mode' }}
              </span>
            </span>
          </button>
        </div>
      </div>

      <!-- Printer -->
      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 class="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
          <span class="material-symbols-outlined text-sm text-primary">print</span>
          Printer
        </h3>
        <div class="flex justify-between items-center py-2 text-sm">
          <span class="text-slate-500">Vəziyyət</span>
          <span class="font-semibold text-green-600 flex items-center gap-1">
            <span class="w-2 h-2 bg-green-500 rounded-full"></span>
            Hazır
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useOrders } from '../composables/useOrders.js'

const { taxRate, serviceChargeRate, updateSettings } = useOrders()

const isEditingRates = ref(false)
const editTax = ref(0)
const editService = ref(0)
const isDarkMode = ref(false)

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

function startEditing() {
  editTax.value = Number(taxRate.value.toFixed(1))
  editService.value = Number(serviceChargeRate.value.toFixed(1))
  isEditingRates.value = true
}

function cancelEdit() {
  isEditingRates.value = false
}

async function saveRates() {
  const newTax = editTax.value
  const newService = editService.value
  await updateSettings(newTax, newService)
  isEditingRates.value = false
}
</script>

