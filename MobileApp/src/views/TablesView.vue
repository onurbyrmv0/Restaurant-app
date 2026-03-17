<template>
  <div class="pb-20">
    <!-- Header -->
    <header class="bg-white border-b border-gray-100 sticky top-0 z-30 safe-top">
      <div class="px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <img src="/logo.jpg" alt="Logo" class="w-full h-full object-cover"/>
          </div>
          <div>
            <h1 class="text-lg font-black tracking-tighter text-gray-800 uppercase leading-none">Cafevania</h1>
            <p class="text-[9px] font-bold text-primary uppercase tracking-widest mt-0.5">Gourmet</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <!-- Live Status -->
          <div class="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-full border border-green-100">
            <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            <span class="text-[9px] font-bold text-green-700 uppercase">Live</span>
          </div>
          <!-- Profile Avatar -->
          <button @click="$router.push('/settings')" class="w-9 h-9 rounded-full overflow-hidden border border-gray-100 shadow-sm active:scale-90 transition-transform">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkE8-1JSkWXiWB6cOlFU0nUvdJ-y6V8aXDkBO0bvR0Gj15_PV1LCkrcxD4T4IVYuv9KfGyeqETgirwp-Bh2SAN9iyuVYzpP2BnyVM8PhmndfQJ2ejOoksG8DlNm3ZHQATNR964EF3k3Rf8ogwsNgj5WdcuG22py9n1DaLaDkqQW4Om3BR7oxwUAqcUTw5GKdBYUfNz2rltmVeTugxzDGWiRU-Uz9ohuaDyargEYSNfNjYHtzqMfQj-VG6Q_LGHV_vYFMyA76Q4O4kF" class="w-full h-full object-cover"/>
          </button>
        </div>
      </div>
    </header>


    <!-- Table Summary -->
    <section class="px-4 py-4 grid grid-cols-2 gap-3">
      <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <p class="text-xs text-gray-500 font-medium uppercase tracking-wider">Dolu Masalar</p>
        <p class="text-3xl font-bold text-green-600 mt-1">{{ busyCount }}</p>
      </div>
      <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <p class="text-xs text-gray-500 font-medium uppercase tracking-wider">Boş Masalar</p>
        <p class="text-3xl font-bold text-gray-400 mt-1">{{ freeCount }}</p>
      </div>
    </section>

    <!-- Table Grid -->
    <main class="px-4">
      <div class="grid grid-cols-3 gap-3">
        <div
          v-for="table in state.tables"
          :key="table.id"
          @click="handleTableClick(table)"
          class="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all duration-200 relative overflow-hidden"
          :class="[
            isTableBusy(table.id) 
              ? 'bg-white border-2 border-green-500 shadow-md shadow-green-100' :
            table.isReserved
              ? 'bg-purple-50 border-2 border-purple-300 shadow-sm'
              : 'bg-gray-50 border-2 border-transparent hover:border-gray-200 hover:bg-white'
          ]"
        >
          <!-- Table ID -->
          <span class="text-3xl font-black transition-colors" 
            :class="[
              isTableBusy(table.id) ? 'text-slate-900' : 
              table.isReserved ? 'text-purple-900' : 'text-stone-200'
            ]"
          >

            {{ table.id }}
          </span>
          
          <!-- Status Indicator -->
          <div class="flex flex-col items-center">
            <span
              class="text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
              :class="[
                isTableBusy(table.id) ? 'text-green-600 bg-green-50' : 
                table.isReserved ? 'text-purple-600 bg-purple-50' : 'text-stone-400/60'
              ]"
            >

              {{ isTableBusy(table.id) ? 'Dolu' : table.isReserved ? 'Rezerv' : 'Boş' }}
            </span>
            <span v-if="table.isReserved && !isTableBusy(table.id)" class="text-[8px] text-purple-400 font-bold mt-0.5">
               {{ table.reservedTime }}
            </span>
          </div>

          <!-- Capacity Badge (Sleek Overlay) -->
          <div class="absolute top-2.5 left-2.5 flex items-center gap-0.5 bg-brand-primary/10 px-2 py-1 rounded-lg border border-brand-primary/20 shadow-sm">
            <span class="text-[10px] font-black text-brand-primary">x{{ table.capacity || 4 }}</span>
          </div>



          <!-- Sifariş Sayı (Top Right Corner) -->
          <Transition name="fade">
            <div
              v-if="getTableOrderCount(table.id) > 0"
              class="absolute top-2.5 right-2.5 w-5 h-5 bg-brand-primary text-white text-[10px] font-black rounded-md flex items-center justify-center shadow-lg shadow-brand-primary/20"
            >
              {{ getTableOrderCount(table.id) }}
            </div>
          </Transition>
        </div>



      </div>
    </main>

  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore'

const router = useRouter()
const { state, busyCount, freeCount, setActiveTable } = useAppStore()

function handleTableClick(table) {
  if (table.isReserved && !isTableBusy(table.id)) {
    const confirmMsg = `Masa ${table.id} rezerv olunub:\n${table.reservedName} (${table.reservedTime})\n\nDavam edilsin?`
    if (!confirm(confirmMsg)) return
  }
  
  setActiveTable(table.id)
  router.push(`/menu/${table.id}`)
}

function getTableOrderCount(tableId) {
  return state.orders.filter((o) => String(o.tableNumber) === String(tableId)).length
}

function isTableBusy(tableId) {
  // Logic: Table is busy if its status is 'busy' in the global tables collection
  const table = state.tables.find(t => String(t.id) === String(tableId))
  return table?.status === 'busy'
}
</script>
