<template>
  <header class="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
    <div class="flex items-center gap-3">
      <div>
        <h1 class="text-xl font-black tracking-tighter text-slate-900 uppercase">Cafevania <span class="text-primary">Gourmet</span></h1>
        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Premium Restaurant Solution</p>
      </div>
    </div>

    <div class="flex items-center gap-6">
      <div class="hidden md:flex flex-col items-end">
        <span class="text-sm font-semibold text-slate-800">Terminal #01</span>
        <span class="text-xs text-slate-500">Kassir</span>
      </div>
      <div class="h-8 w-px bg-slate-200"></div>
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-primary">schedule</span>
        <span class="font-bold text-lg text-slate-900">{{ formattedTime }}</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useClock } from '../composables/useClock.js'

const { formattedTime } = useClock()
</script>
