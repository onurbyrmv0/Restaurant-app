<template>
  <Transition name="fade">
    <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <div 
        class="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-zoom-in border border-white"
        @click.stop
      >
        <!-- Header -->
        <div class="px-8 pt-8 pb-4 text-center">
          <div class="size-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
            <span class="material-symbols-outlined text-4xl">groups</span>
          </div>
          <h3 class="text-xl font-black text-slate-900 uppercase tracking-tighter">Masa Tutumu</h3>
          <p class="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Masa {{ tableId }}</p>
        </div>

        <!-- Body -->
        <div class="px-8 pb-8">
          <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 text-center">İnsan sayı (Tutum)</label>
          
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 flex items-center pl-6 text-primary pointer-events-none">
              <span class="material-symbols-outlined text-2xl">groups</span>
            </div>
            <input 
              v-model.number="localCapacity"
              type="number" 
              min="1"
              max="50"
              class="w-full pl-16 pr-6 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-primary focus:bg-white outline-none font-black text-3xl transition-all text-slate-900 text-center"
              @keyup.enter="handleSave"
              autofocus
            />
          </div>
          <p class="text-center text-[10px] text-slate-400 mt-4 font-medium uppercase tracking-widest">Masanın maksimum oturaq sayını daxil edin</p>
        </div>


        <!-- Actions -->
        <div class="px-8 pb-8 flex gap-3">
          <button 
            @click="$emit('close')"
            class="flex-1 py-4 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
          >
            Ləğv et
          </button>
          <button 
            @click="handleSave"
            class="flex-[2] py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            Yadda saxla
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  tableId: String,
  currentCapacity: Number
})

const emit = defineEmits(['close', 'save'])

const localCapacity = ref(props.currentCapacity || 4)

watch(() => props.currentCapacity, (newVal) => {

  localCapacity.value = newVal || 4
})

function handleSave() {
  if (localCapacity.value > 0) {
    emit('save', localCapacity.value)
  }
}
</script>

<style scoped>
.animate-zoom-in {
  animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
</style>
