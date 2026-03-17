
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="$emit('close')"></div>
        
        <div class="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-zoom-in h-[85vh] flex flex-col">
          <div class="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
            <div>
              <h3 class="font-black text-xl text-slate-800 uppercase tracking-tight">Yeni Sifariş Yarat</h3>
              <p class="text-sm text-slate-500 font-medium">Kassa / Admin tərəfindən birbaşa sifariş</p>
            </div>
            <button @click="$emit('close')" class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div class="flex-1 flex overflow-hidden">
            <!-- Left: Menu Selection -->
            <div class="flex-[1.5] flex flex-col border-r border-slate-100 overflow-hidden">
              <!-- Search & Categories -->
              <div class="p-6 space-y-4 shrink-0 bg-white">
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Məhsul axtar..."
                    class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button
                    v-for="cat in categories"
                    :key="cat.id"
                    @click="activeCategory = cat.id"
                    class="px-5 py-2 rounded-full font-bold whitespace-nowrap transition-all text-sm"
                    :class="activeCategory === cat.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'"
                  >
                    {{ cat.name }}
                  </button>
                </div>
              </div>

              <!-- Products Grid -->
              <div class="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <article
                    v-for="item in filteredProducts"
                    :key="item.id"
                    class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm transition-all cursor-pointer group active:scale-[0.98]"
                    :class="item.inStock === false ? 'opacity-40 grayscale pointer-events-none' : 'hover:shadow-md'"
                    @click="item.inStock !== false && addToCart(item)"
                  >
                    <div class="aspect-video rounded-xl overflow-hidden mb-3 bg-slate-50 relative">
                      <img :src="item.image" :alt="item.name" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                      <div v-if="item.inStock === false" class="absolute inset-0 flex items-center justify-center bg-black/10">
                        <span class="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded uppercase shadow-lg">STOKDA YOXDUR</span>
                      </div>
                    </div>
                    <h4 class="font-bold text-slate-800 text-sm truncate">{{ item.name }}</h4>
                    <div class="flex justify-between items-center mt-2">
                      <span class="font-black text-primary">₼{{ (item.price || 0).toFixed(2) }}</span>
                      <div class="w-7 h-7 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                        <span class="material-symbols-outlined text-sm">{{ item.inStock === false ? 'block' : 'add' }}</span>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </div>

            <!-- Right: Cart & Confirmation -->
            <div class="flex-1 flex flex-col bg-white overflow-hidden">
              <div class="p-6 border-b border-slate-50 flex items-center justify-between">
                <h4 class="font-black text-slate-700 uppercase tracking-widest text-xs">Sifariş Cədvəli</h4>
                <div class="flex items-center gap-2">
                   <select v-model="selectedTableNumber" class="text-xs font-bold bg-slate-100 border-0 rounded-lg px-3 py-1.5 focus:ring-0">
                     <option value="Takeaway">Takeaway</option>
                     <option 
                       v-for="n in 12" 
                       :key="n" 
                       :value="n"
                       :class="{ 'text-brand-orange font-black': isTableBusy(n) }"
                     >
                       Masa {{ n }} {{ isTableBusy(n) ? '(Məşğul)' : '' }}
                     </option>
                   </select>
                </div>
              </div>

              <!-- Cart Items -->
              <div class="flex-1 overflow-y-auto p-6 space-y-4">
                <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center text-slate-300">
                  <span class="material-symbols-outlined text-5xl mb-3 opacity-20">shopping_cart</span>
                  <p class="text-sm font-semibold">Səbət boşdur</p>
                </div>
                
                <div v-for="item in cart" :key="item.id" class="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-50">
                   <div class="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                      <img :src="item.image" class="w-full h-full object-cover"/>
                   </div>
                   <div class="flex-1 min-w-0">
                      <h5 class="font-bold text-slate-800 text-sm truncate">{{ item.name }}</h5>
                      <p class="text-slate-400 text-xs font-bold">₼{{ (item.price * item.quantity).toFixed(2) }}</p>
                   </div>
                   <div class="flex items-center bg-white rounded-xl px-1 py-1 gap-2 shadow-sm border border-slate-100">
                      <button @click="decrementQuantity(item)" class="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 transition-colors">
                        <span class="material-symbols-outlined text-sm">remove</span>
                      </button>
                      <span class="text-xs font-black text-slate-800 w-4 text-center">{{ item.quantity }}</span>
                      <button @click="incrementQuantity(item)" class="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 transition-colors">
                        <span class="material-symbols-outlined text-sm">add</span>
                      </button>
                   </div>
                </div>
              </div>

              <!-- Footer Summary -->
              <div class="p-8 bg-slate-50 border-t border-slate-100 space-y-4">
                <div class="space-y-2">
                   <div class="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                     <span>Ara Cəm</span>
                     <span class="text-slate-800">₼{{ subtotal.toFixed(2) }}</span>
                   </div>
                   <div v-if="taxRate > 0" class="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                     <span>Vergi ({{ taxRate }}%)</span>
                     <span class="text-slate-800">₼{{ taxAmount.toFixed(2) }}</span>
                   </div>
                   <div v-if="serviceChargeRate > 0" class="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                     <span>Servis ({{ serviceChargeRate }}%)</span>
                     <span class="text-slate-800">₼{{ serviceChargeAmount.toFixed(2) }}</span>
                   </div>
                   <div class="flex justify-between items-center pt-2 border-t border-slate-200/50">
                     <span class="font-black text-slate-800 uppercase">Toplam</span>
                     <span class="font-black text-primary text-3xl">₼{{ grandTotal.toFixed(2) }}</span>
                   </div>
                </div>

                <div v-if="error" class="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium flex items-center gap-2">
                  <span class="material-symbols-outlined text-sm">error</span>
                  {{ error }}
                </div>

                <button
                  class="w-full py-4 rounded-2xl font-black text-white text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 bg-primary hover:bg-primary-dark"
                  :disabled="cart.length === 0 || loading"
                  @click="submitOrder"
                >
                  <template v-if="loading">
                    <div class="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    GÖNDƏRİLİR...
                  </template>
                  <template v-else>
                    <span class="material-symbols-outlined">rocket_launch</span>
                    SİFARİŞİ TAMAMLA
                  </template>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useMenu } from '../composables/useMenu.js'
import { useOrders } from '../composables/useOrders.js'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['close', 'success'])

const { products, categories, startListening } = useMenu()
const { createOrder, orders, taxRate, serviceChargeRate } = useOrders()

const activeCategory = ref('')
const searchQuery = ref('')
const selectedTableNumber = ref('Takeaway')
const cart = ref([])
const loading = ref(false)
const error = ref(null)

function isTableBusy(n) {
  return orders.value.some(o => 
    String(o.tableNumber) === String(n) && 
    !['completed', 'paid', 'closed'].includes(o.status)
  )
}

onMounted(() => {
  startListening()
})

watch(() => categories.value, (newCats) => {
  if (newCats.length > 0 && !activeCategory.value) {
    activeCategory.value = newCats[0].id
  }
}, { immediate: true })

const filteredProducts = computed(() => {
  const list = products.value.filter(p => {
    const pCat = p.categoryId || p.category
    return !activeCategory.value || pCat === activeCategory.value
  })
  
  if (!searchQuery.value) return list
  const q = searchQuery.value.toLowerCase()
  return list.filter(p => 
    (p.name || '').toLowerCase().includes(q) || 
    (p.description || '').toLowerCase().includes(q)
  )
})

const subtotal = computed(() => cart.value.reduce((s, i) => s + (i.price * i.quantity), 0))
const taxAmount = computed(() => subtotal.value * (taxRate.value / 100))
const serviceChargeAmount = computed(() => subtotal.value * (serviceChargeRate.value / 100))
const grandTotal = computed(() => subtotal.value + taxAmount.value + serviceChargeAmount.value)

function addToCart(item) {
  const existing = cart.value.find(i => i.id === item.id)
  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1
    })
  }
}

function incrementQuantity(item) { item.quantity++ }
function decrementQuantity(item) {
  if (item.quantity > 1) {
    item.quantity--
  } else {
    cart.value = cart.value.filter(i => i.id !== item.id)
  }
}

async function submitOrder() {
  if (cart.value.length === 0) return
  
  loading.value = true
  error.value = null
  
  try {
    const orderData = {
      tableNumber: selectedTableNumber.value,
      items: cart.value.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity
      })),
      notes: 'Counter Order (Kassa)'
    }
    
    await createOrder(orderData)
    emit('success')
    emit('close')
    // Reset cart
    cart.value = []
  } catch (err) {
    error.value = err.message || 'Sifariş yaradılanda xəta baş verdi.'
  } finally {
    loading.value = false
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    cart.value = []
    error.value = null
    selectedTableNumber.value = 'Takeaway'
  }
})
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.3s; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.98); }

.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
