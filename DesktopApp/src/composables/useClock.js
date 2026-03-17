import { ref, computed } from 'vue'

const currentTime = ref(new Date())

// Update time every second
setInterval(() => {
  currentTime.value = new Date()
}, 1000)

export function useClock() {
  const formattedTime = computed(() => {
    const d = currentTime.value
    let hours = d.getHours()
    const minutes = d.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12
    return `${hours}:${minutes} ${ampm}`
  })

  const formattedDate = computed(() => {
    const d = currentTime.value
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  })

  return {
    currentTime,
    formattedTime,
    formattedDate,
  }
}
