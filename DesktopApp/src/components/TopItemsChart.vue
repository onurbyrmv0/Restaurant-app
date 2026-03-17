<template>
  <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
    <div class="flex justify-between items-center mb-4">
      <h3 class="font-bold text-slate-800">Ən Çox Satılanlar (Top 5)</h3>
    </div>
    <div class="relative h-64 flex justify-center">
      <Doughnut 
        v-if="chartData" 
        :data="chartData" 
        :options="chartOptions" 
      />
      <div v-else class="flex items-center justify-center h-full text-slate-400">
        Məlumat yoxdur
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
})

const chartData = computed(() => {
  if (!props.items || props.items.length === 0) return null

  return {
    labels: props.items.map(i => i.name),
    datasets: [
      {
        backgroundColor: ['#41B883', '#E46651', '#00D8FF', '#DD1B16', '#F59E0B'],
        data: props.items.map(i => i.count)
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 20
      }
    }
  }
}
</script>
