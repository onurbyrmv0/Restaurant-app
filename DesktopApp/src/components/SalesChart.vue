<template>
  <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
    <div class="flex justify-between items-center mb-4">
      <h3 class="font-bold text-slate-800">Saatlıq Satış</h3>
    </div>
    <div class="relative h-64 w-full">
      <Bar 
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
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'
import { Bar } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const props = defineProps({
  hourlyData: {
    type: Array,
    required: true
  }
})

const chartData = computed(() => {
  if (!props.hourlyData || props.hourlyData.every(v => v === 0)) return null
  
  return {
    labels: Array.from({length: 24}, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Satış (AZN)',
        backgroundColor: '#f87171',
        borderRadius: 4,
        data: props.hourlyData
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: '#f1f5f9'
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
}
</script>
