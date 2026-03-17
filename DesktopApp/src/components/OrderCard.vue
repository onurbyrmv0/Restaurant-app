<template>
  <div
    class="p-4 rounded-xl cursor-pointer transition-all duration-200 border-2"
    :class="[
      isSelected
        ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm',
      order.status === 'served' && !isSelected ? 'opacity-80' : '',
      order.status === 'paid' && !isSelected ? 'opacity-60' : ''
    ]"
    @click="$emit('select', order.id)"
  >
    <div class="flex justify-between items-start mb-2">
      <div>
        <span
          class="text-xs font-bold uppercase tracking-wider"
          :class="isSelected ? 'text-primary' : 'text-slate-400'"
        >Masa</span>
        <h3
          class="text-2xl font-black leading-none"
          :class="isSelected ? 'text-slate-900' : 'text-slate-700'"
        >{{ order.tableNumber }}</h3>
      </div>
      <span
        class="text-[10px] font-bold px-2 py-1 rounded uppercase"
        :class="statusClasses"
      >{{ statusLabel }}</span>
    </div>
    <div class="flex justify-between items-end">
      <div class="text-slate-500 text-xs space-y-0.5">
        <p v-if="order.guests">{{ order.guests }} Qonaq</p>
        <p>{{ order.items.length }} məhsul</p>
        <p>{{ timeAgo }}</p>
      </div>
      <div class="text-right">
        <span class="text-xs text-slate-400 block">Cəmi</span>
        <span
          class="text-lg font-bold"
          :class="isSelected ? 'text-slate-900' : 'text-slate-700'"
        >₼{{ (order.total || 0).toFixed(2) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useOrders } from '../composables/useOrders.js'

const props = defineProps({
  order: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
})

defineEmits(['select'])

const { getOrderPaymentStatus, getTimeAgo } = useOrders()

const statusLabel = computed(() => getOrderPaymentStatus(props.order).label)
const statusClasses = computed(() => getOrderPaymentStatus(props.order).class)
const timeAgo = computed(() => getTimeAgo(props.order.createdAt))
</script>
