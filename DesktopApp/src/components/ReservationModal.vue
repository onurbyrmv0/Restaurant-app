<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>

        <!-- Content -->
        <div class="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-zoom-in">
          <!-- Header -->
          <div class="px-6 py-4 bg-purple-50 border-b border-purple-100 flex justify-between items-center">
            <h3 class="font-bold text-lg text-purple-900 flex items-center gap-2">
              <span class="material-symbols-outlined">event_seat</span>
              Masa {{ tableId }} Rezerv
            </h3>
            <button @click="$emit('close')" class="text-purple-400 hover:text-purple-600 transition-colors">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4">
            <div v-if="existingReservation" class="bg-purple-50 p-4 rounded-xl border border-purple-100 text-sm mb-4">
              <div class="flex justify-between mb-1">
                <span class="text-purple-600 font-medium">Müştəri:</span>
                <span class="font-bold text-purple-900">{{ existingReservation.name }}</span>
              </div>
              <div class="flex justify-between mb-1">
                <span class="text-purple-600 font-medium">Vaxt:</span>
                <span class="font-bold text-purple-900">{{ formatTime(existingReservation.time) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-purple-600 font-medium">Tel:</span>
                <span class="font-bold text-purple-900">{{ existingReservation.phone || '-' }}</span>
              </div>
            </div>

            <div v-if="!existingReservation">
              <!-- Name -->
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1 uppercase">Müştəri Adı</label>
                <input
                  v-model="form.name"
                  class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none"
                  placeholder="Ad Soyad"
                  autofocus
                />
              </div>

              <!-- Time & Phone -->
              <div class="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1 uppercase">Vaxt</label>
                  <input
                    v-model="form.time"
                    type="time"
                    class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1 uppercase">Tel (Opsional)</label>
                  <input
                    v-model="form.phone"
                    type="tel"
                    class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none"
                    placeholder="050..."
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
            <button
              v-if="existingReservation"
              @click="handleCancel"
              class="flex-1 py-2.5 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
            >
              Rezervi Ləğv Et
            </button>
            <template v-else>
              <button
                @click="$emit('close')"
                class="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Bağla
              </button>
              <button
                @click="handleSave"
                class="flex-1 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all active:scale-95"
                :disabled="!form.name || !form.time"
                :class="{ 'opacity-50 cursor-not-allowed': !form.name || !form.time }"
              >
                Rezerv Et
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  visible: Boolean,
  tableId: String,
  reservation: Object // { name, time, phone } or null
})

const emit = defineEmits(['close', 'save', 'cancel'])

const form = ref({
  name: '',
  time: '',
  phone: ''
})

const existingReservation = computed(() => props.reservation)

watch(() => props.visible, (val) => {
  if (val) {
    if (existingReservation.value) {
      // View mode
    } else {
      // New mode -> set default time to now + 30 mins
      const now = new Date()
      now.setMinutes(now.getMinutes() + 30)
      const hours = String(now.getHours()).padStart(2, '0')
      const mins = String(now.getMinutes()).padStart(2, '0')
      
      form.value = {
        name: '',
        time: `${hours}:${mins}`,
        phone: ''
      }
    }
  }
})

function formatTime(timeStr) {
  return timeStr || '--:--'
}

function handleSave() {
  emit('save', { ...form.value, tableId: props.tableId })
}

function handleCancel() {
  if(confirm('Rezervasiyanı ləğv etmək istədiyinizə əminsiniz?')) {
    emit('cancel', props.tableId)
  }
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
