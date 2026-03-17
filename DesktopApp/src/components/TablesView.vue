<template>
  <section class="flex-1 flex flex-col bg-background-light overflow-hidden">
    <!-- Header -->
    <div class="p-6 bg-white border-b border-slate-200 shrink-0">
      <h2 class="text-2xl font-bold text-slate-900 flex items-center gap-3">
        <span class="material-symbols-outlined text-primary">table_restaurant</span>
        Masa Planı
      </h2>
      <p class="text-sm text-slate-500 mt-1">
        {{ tableStats.busy }} məşğul / {{ tableStats.reserved }} rezerv / {{ tableStats.total }} ümumi masa
      </p>
    </div>

    <!-- Tables Grid -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="grid grid-cols-4 md:grid-cols-5 gap-4">
        <div
          v-for="table in tableList"
          :key="table.number"
          class="relative rounded-2xl border-2 p-4 flex flex-col items-center justify-center aspect-square cursor-pointer transition-all duration-200 hover:shadow-md active:scale-95 group"
          :class="[
            table.order ? 'border-primary bg-primary/5 shadow-sm' : 
            table.reservation ? 'border-purple-300 bg-purple-50 shadow-sm' :
            'border-stone-100 bg-white hover:border-primary/30 hover:shadow-lg'
          ]"

          @click="handleTableClick(table)"
          @contextmenu.prevent="openReservation(table)"
        >
          <span class="text-2xl font-black transition-colors" 
            :class="[
              table.order ? 'text-slate-900' : 
              table.reservation ? 'text-purple-900' : 'text-stone-200'
            ]"
          >

            {{ table.number }}
          </span>

          <!-- Status badge -->
          <div v-if="table.order" class="mt-2 text-center">
            <span
              class="text-[10px] font-black px-3 py-1 rounded-full uppercase block shadow-sm border border-black/5"
              :class="getOrderPaymentStatus(table.order).class"
            >
              {{ getOrderPaymentStatus(table.order).label }}
            </span>

          </div>
          
          <!-- Reservation Badge -->
          <div v-else-if="table.reservation" class="mt-2 text-center">
             <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-purple-100 text-purple-700 block truncate max-w-[90px]">
               Rezerv
             </span>
          </div>
          
          <span v-else class="text-[9px] text-stone-400 font-black mt-2 uppercase tracking-[0.2em]">Boş</span>


          <!-- Info (Price or Time) -->
          <span v-if="table.order" class="text-xs font-bold text-primary mt-1">
            ₼{{ (table.order.total || 0).toFixed(2) }}
          </span>
          <span v-else-if="table.reservation" class="text-xs font-bold text-purple-600 mt-1 truncate w-full text-center px-1">
            {{ table.reservation.reservedTime }} | {{ table.reservation.reservedName }}
          </span>

          <!-- New Order Pulse -->
          <div
            v-if="table.order?.status === 'new'"
            class="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse"
          ></div>

          <!-- Capacity Badge (Top Left) -->
          <div 
            @click.stop="openCapacityModal(table)"
            class="absolute top-3 left-3 flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-lg border border-primary/20 shadow-sm hover:bg-primary hover:text-white transition-all cursor-pointer pointer-events-auto group/cap"
            title="Tutumunu dəyiş"
          >
            <span class="text-[11px] font-black text-primary group-hover/cap:text-white">x{{ table.details?.capacity || 4 }}</span>

          </div>



          <!-- Footer Row -->
          <div class="absolute bottom-3 left-3 right-3 flex items-center justify-end pointer-events-none">
            <!-- Waiter Badge -->
            <span 
              v-if="table.order" 
              class="bg-slate-900/90 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xl border border-white/10 max-w-[80%] truncate animate-fade-in"
            >
              <span class="material-symbols-outlined text-[11px] text-primary">person</span>
              {{ table.order.server }}
            </span>
          </div>


        </div>
      </div>
    </div>
    
    <!-- Reservation Modal -->
    <ReservationModal
      :visible="showReservationModal"
      :table-id="selectedTableId"
      :reservation="selectedReservation"
      @close="showReservationModal = false"
      @save="handleReservationSave"
      @cancel="handleReservationCancel"
    />

    <!-- Capacity Modal -->
    <TableCapacityModal
      :visible="showCapacityModal"
      :table-id="selectedTableId"
      :current-capacity="selectedTableCapacity"
      @close="showCapacityModal = false"
      @save="handleCapacitySave"
    />

  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useOrders } from '../composables/useOrders.js'
import ReservationModal from './ReservationModal.vue'
import TableCapacityModal from './TableCapacityModal.vue'


const { 
  orders, 
  tableStats,
  tableDetails,
  tableReservations,
  getOrderPaymentStatus, 
  selectOrder, 
  activeNav,
  reserveTable, 
  cancelReservation,
  updateTableCapacity
} = useOrders()



const showReservationModal = ref(false)
const selectedTableId = ref(null)
const selectedReservation = ref(null)

const showCapacityModal = ref(false)
const selectedTableCapacity = ref(4)

const tableList = computed(() => {
  // Sort table details by table number as integer
  const sortedTableIds = Object.keys(tableDetails.value).sort((a, b) => {
    return parseInt(a) - parseInt(b)
  })

  return sortedTableIds.map(id => {
    const details = tableDetails.value[id]
    const order = orders.value.find(o => String(o.tableNumber) === id && !['paid', 'closed', 'completed'].includes(o.status))
    const reservation = tableReservations.value[id] || null
    
    return {
      number: id,
      order: order || null,
      reservation,
      details
    }
  })
})



function handleTableClick(table) {
  if (table.order) {
    selectOrder(table.order.id)
    activeNav.value = 'orders'
  } else {
    // Empty or reserved - open reservation logic via click? 
    // Maybe better to only allow context menu for reservation to avoid conflict with creating order?
    // Let's allow click for reservation if no order
    openReservation(table)
  }
}

function openReservation(table) {
  selectedTableId.value = table.number
  selectedReservation.value = table.reservation
  showReservationModal.value = true
}

async function handleReservationSave(data) {
  try {
    await reserveTable(data.tableId, data)
    showReservationModal.value = false
  } catch (err) {
    alert('Xəta baş verdi: ' + err.message)
  }
}

async function handleReservationCancel(tableId) {
  try {
    await cancelReservation(tableId)
    showReservationModal.value = false
  } catch (err) {
    alert('Xəta baş verdi: ' + err.message)
  }
}

function openCapacityModal(table) {
  selectedTableId.value = table.number
  selectedTableCapacity.value = table.details?.capacity || 4
  showCapacityModal.value = true
}

async function handleCapacitySave(newVal) {
  try {
    await updateTableCapacity(selectedTableId.value, newVal)
    showCapacityModal.value = false
  } catch (err) {
    alert('Tutum yenilənmədi: ' + err.message)
  }
}


</script>
