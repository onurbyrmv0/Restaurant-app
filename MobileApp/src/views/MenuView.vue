<template>
  <div class="pb-20 min-h-screen bg-white">
    <!-- Header -->
    <header class="pt-6 px-5 pb-3 bg-white sticky top-0 z-20">
      <div class="flex justify-between items-center mb-5">
        <div class="flex items-center gap-3">
          <button @click="goBack" class="p-2 -ml-2 text-gray-500 active:bg-gray-100 rounded-lg transition-colors">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
            </svg>
          </button>
          <div>
            <h1 class="text-2xl font-black tracking-tight leading-none uppercase">
              Cafevania <span class="text-brand-primary">Gourmet</span>
            </h1>

            <p v-if="tableId" class="text-xs text-gray-400 mt-0.5">Masa {{ tableId }}</p>
          </div>
        </div>
        <!-- Cart Button -->
        <button
          @click="openCart"
          class="relative p-2.5 bg-gray-100 rounded-full active:scale-95 transition-transform"
          aria-label="Cart"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M16 11V7a4 4 0 00-8 0v4M5 11h14l1 12H4L5 11z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
          </svg>
          <!-- Badge -->
          <span
            v-if="cartItemCount > 0"
            class="absolute -top-1 -right-1 w-5 h-5 bg-brand-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {{ cartItemCount }}
          </span>
        </button>
      </div>

      <!-- Search & Categories -->
    <div class="px-4 py-4 space-y-4">
      <!-- Search Input -->
      <div class="relative">
        <input 
          v-model="state.searchQuery"
          type="text" 
          placeholder="Məhsul axtar..." 
          class="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus-ring-brand-primary placeholder-gray-400 shadow-sm"
        />
        <svg class="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <!-- Categories -->
      <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          v-for="cat in state.categories"
          :key="cat.id"
          @click="setActiveCategory(cat.id)"
          class="px-5 py-2 rounded-full font-semibold whitespace-nowrap transition-all duration-300 text-sm"
          :class="
            state.activeCategory === cat.id
              ? 'bg-brand-primary text-white shadow-lg shadow-orange-200'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          "
        >
          {{ cat.label }}
        </button>
      </div>
    </div>
  </header>

    <!-- Empty category message -->
    <div v-if="currentMenuItems.length === 0" class="flex flex-col items-center justify-center py-20 text-center px-6">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
        </svg>
      </div>
      <p class="text-gray-400 font-semibold">Bu kateqoriyada hələ məhsul yoxdur</p>
    </div>

    <!-- Food Items List -->
    <section v-else class="px-5 py-3 space-y-4">
      <TransitionGroup name="list" tag="div" class="space-y-4">
        <article
          v-for="item in currentMenuItems"
          :key="item.id"
          class="flex items-center gap-4 bg-white rounded-2xl overflow-hidden group"
        >
          <!-- Image -->
          <div class="w-24 h-24 flex-shrink-0 overflow-hidden rounded-xl">
            <img
              :alt="item.name"
              :src="item.image"
              class="w-full h-full object-cover shadow-sm group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
          <!-- Info -->
          <div class="flex-grow min-w-0" :class="{ 'opacity-50 grayscale-[50%]': item.inStock === false }">
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-lg leading-tight truncate">{{ item.name }}</h3>
              <span v-if="item.inStock === false" class="bg-red-100 text-red-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase shrink-0">Bitib</span>
            </div>
            <p class="text-gray-400 text-sm mt-1 truncate">{{ item.description }}</p>
            <span class="text-brand-primary font-bold text-xl block mt-2">{{ currencySymbol }}{{ item.price.toFixed(2) }}</span>
          </div>
          <!-- Add Button -->
          <button
            @click="item.inStock !== false && handleAddToCart(item)"
            class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all flex-shrink-0"
            :class="item.inStock === false ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-brand-primary text-white shadow-orange-200'"
            :aria-label="item.inStock === false ? 'Out of stock' : 'Add to cart'"
            :disabled="item.inStock === false"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="item.inStock !== false" d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" />
              <path v-else d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
            </svg>
          </button>
        </article>
      </TransitionGroup>
    </section>

    <!-- Floating Cart Bar (when items in cart) -->
    <Transition name="slide-up">
      <div
        v-if="cartItemCount > 0 && !state.showOrderSummary"
        class="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-md z-30"
      >
        <button
          @click="toggleOrderSummary"
          class="w-full bg-brand-primary text-white rounded-2xl py-3.5 px-5 flex items-center justify-between shadow-xl shadow-orange-300/40 active:scale-[0.98] transition-transform"
        >
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold">{{ cartItemCount }}</span>
            <span class="font-bold">Səbəti gör</span>
          </div>
          <span class="font-extrabold text-lg">{{ currencySymbol }}{{ total.toFixed(2) }}</span>
        </button>
      </div>
    </Transition>

    <!-- Order Summary Modal -->
    <Teleport to="body">
      <!-- Overlay -->
      <Transition name="fade">
        <div
          v-if="state.showOrderSummary"
          class="fixed inset-0 bg-black/40 z-50"
          @click="toggleOrderSummary"
        ></div>
      </Transition>

      <!-- Bottom Sheet -->
      <Transition name="slide-up">
        <section
          v-if="state.showOrderSummary"
          class="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-[2rem] flex flex-col max-h-[85vh] bottom-sheet-shadow"
        >
          <div class="drag-handle"></div>

          <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-extrabold text-gray-900">Sifariş Xülasəsi</h2>
              <p class="text-xs text-gray-500 uppercase tracking-widest mt-1">Masa {{ tableId }}</p>
            </div>
            <button @click="toggleOrderSummary" class="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
              </svg>
            </button>
          </div>

          <!-- Empty cart message -->
          <div v-if="currentCart.length === 0" class="flex-1 flex flex-col items-center justify-center py-10">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M16 11V7a4 4 0 00-8 0v4M5 11h14l1 12H4L5 11z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
              </svg>
            </div>
            <p class="text-gray-400 font-semibold">Səbət boşdur</p>
            <button @click="toggleOrderSummary" class="mt-3 text-brand-primary font-semibold text-sm">← Menüyə qayıt</button>
          </div>

          <!-- Items -->
          <div v-else class="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            <div
              v-for="item in currentCart"
              :key="item.id"
              class="flex flex-col gap-3 bg-white p-3 rounded-2xl border border-gray-50 shadow-sm"
            >
              <!-- Item Info & Qty -->
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <h4 class="font-bold text-gray-800 truncate">{{ item.name }}</h4>
                  <p class="text-sm font-semibold text-gray-900 mt-0.5">{{ currencySymbol }}{{ (item.price * item.quantity).toFixed(2) }}</p>
                </div>
                <!-- Quantity Picker -->
                <div class="flex items-center bg-gray-100 rounded-full px-2 py-1 gap-3 flex-shrink-0">
                  <button
                    @click="decrementItem(item.id)"
                    class="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm active:scale-90 transition-transform text-gray-600 font-bold"
                  >−</button>
                  <span class="font-bold text-gray-800 text-lg w-4 text-center">{{ item.quantity }}</span>
                  <button
                    @click="incrementItem(item.id)"
                    class="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm active:scale-90 transition-transform text-gray-600 font-bold"
                  >+</button>
                </div>
              </div>

              <!-- Note Input -->
              <div class="relative">
                 <input 
                   type="text" 
                   :value="item.note"
                   @input="addNoteToItem(item.id, $event.target.value)"
                   placeholder="Qeyd əlavə et (məs: soyuq olsun)..."
                   class="w-full text-xs pl-8 pr-3 py-2 bg-gray-50 rounded-lg border border-gray-100 focus:outline-none focus:bg-white focus:border-brand-primary placeholder-gray-400 text-gray-700"
                 />
                 <svg class="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                 </svg>
              </div>
            </div>
          </div>

          <!-- Price Breakdown (only when cart has items) -->
          <div v-if="currentCart.length > 0" class="p-6 bg-gray-50 border-t border-gray-100 rounded-t-3xl">
            <div class="space-y-2 mb-5">
              <div class="flex justify-between text-gray-600 text-sm">
                <span>Ara cəm</span>
                <span>{{ currencySymbol }}{{ subtotal.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-gray-600 text-sm">
                <span>Vergi ({{ state.appSettings.taxRate }}%)</span>
                <span>{{ currencySymbol }}{{ tax.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-xl font-extrabold text-gray-900 pt-2 border-t border-gray-200">
                <span>Cəmi</span>
                <span>{{ currencySymbol }}{{ total.toFixed(2) }}</span>
              </div>
            </div>

            <!-- Send Order Button -->
            <button
              @click="sendOrder"
              class="w-full text-white font-black text-lg py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              :class="
                state.orderSentSuccess
                  ? 'bg-green-500 shadow-green-200'
                  : state.orderSending
                    ? 'bg-gray-400 shadow-gray-200 cursor-wait'
                    : 'bg-brand-rose shadow-rose-200 hover:bg-brand-rose-dark'
              "
              :disabled="state.orderSentSuccess || state.orderSending"
            >
              <template v-if="state.orderSending">
                <svg class="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>GÖNDƏRİLİR...</span>
              </template>
              <template v-else-if="state.orderSentSuccess">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" />
                </svg>
                <span>GÖNDƏRİLDİ!</span>
              </template>
              <template v-else>
                <span>SİFARİŞİ GÖNDƏR</span>
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M13 5l7 7-7 7M5 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
                </svg>
              </template>
            </button>

            <Transition name="fade">
              <p v-if="state.orderError" class="mt-3 text-center text-sm text-red-500 font-semibold">
                ⚠️ {{ state.orderError }}
              </p>
            </Transition>

            <div class="h-4"></div>
          </div>
        </section>
      </Transition>
    </Teleport>

    <!-- Toast Notification -->
    <ToastNotification ref="toastRef" />
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../stores/appStore'
import { computed, ref, onMounted } from 'vue'
import ToastNotification from '../components/ToastNotification.vue'

const router = useRouter()
const route = useRoute()
const toastRef = ref(null)
const {
  state,
  currencySymbol,
  currentMenuItems,
  currentCart,
  cartItemCount,
  subtotal,
  tax,
  total,
  setActiveCategory,
  addToCart,
  addNoteToItem,
  incrementItem,
  decrementItem,
  toggleOrderSummary,
  sendOrder,
  setActiveTable,
} = useAppStore()

const tableId = computed(() => route.params.tableId)

onMounted(() => {
  if (tableId.value) {
    setActiveTable(Number(tableId.value))
  }
})

function goBack() {
  router.push('/')
}

function handleAddToCart(item) {
  addToCart(item)
  toastRef.value?.show(`${item.name} səbətə əlavə edildi`, 'cart', 1500)
}

function openCart() {
  if (cartItemCount.value === 0) {
    toastRef.value?.show('Səbət boşdur. Əvvəlcə məhsul əlavə edin.', 'info', 2000)
    return
  }
  toggleOrderSummary()
}
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
