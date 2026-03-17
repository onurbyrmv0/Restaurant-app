<template>
  <div class="min-h-screen bg-gradient-to-br from-brand-primary to-orange-400 flex flex-col items-center justify-center p-6 text-white safe-bottom safe-top">
    <!-- Logo -->
    <div class="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-xl overflow-hidden">
      <img src="/logo.jpg" alt="Logo" class="w-full h-full object-cover"/>
    </div>

    <h1 class="text-3xl font-bold mb-2">Xoş gəlmisiniz!</h1>
    <p class="text-white/80 mb-10 text-center">Restoran idarəetmə sisteminə giriş</p>

    <!-- Form -->
    <div class="w-full max-w-sm bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-2xl">
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold mb-2 ml-1 text-white/90">İstifadəçi adı</label>
          <input 
            v-model="nick" 
            type="text" 
            placeholder="Məs: elvin123" 
            required
            class="w-full px-5 py-3.5 bg-white/90 text-gray-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-white/30 placeholder-gray-400 font-medium"
          />
        </div>

        <div>
           <label class="block text-sm font-semibold mb-2 ml-1 text-white/90">Şifrə</label>
           <input 
            v-model="password" 
            type="password" 
            placeholder="••••••••" 
            required
            class="w-full px-5 py-3.5 bg-white/90 text-gray-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-white/30 placeholder-gray-400 font-medium"
          />
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full py-4 bg-white text-brand-primary font-bold text-lg rounded-xl shadow-lg active:scale-[0.98] transition-all mt-4 flex items-center justify-center gap-2"
        >
          <svg v-if="loading" class="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loading ? 'Giriş edilir...' : 'Daxil ol' }}
        </button>
      </form>
    </div>

    <p class="mt-8 text-sm text-white/70">
      Hesabınız yoxdur? 
      <router-link to="/register" class="font-bold text-white hover:underline">Qeydiyyatdan keçin</router-link>
    </p>

    <!-- Error Toast -->
    <Transition name="fade">
      <div v-if="error" class="fixed top-6 bg-red-500 text-white px-6 py-3 rounded-full shadow-xl font-semibold text-sm">
        ⚠️ {{ error }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore'

const nick = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(null)

const router = useRouter()
const { login } = useAppStore()

async function handleLogin() {
  loading.value = true
  error.value = null
  try {
    await login(nick.value, password.value)
    router.push('/')
  } catch (err) {
    error.value = err.message
    setTimeout(() => error.value = null, 3000)
  } finally {
    loading.value = false
  }
}
</script>
