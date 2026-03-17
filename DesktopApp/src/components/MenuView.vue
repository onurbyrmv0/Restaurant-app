<template>
  <section class="flex-1 flex flex-col bg-background-light overflow-hidden">
    <!-- Header -->
    <div class="p-6 bg-white border-b border-slate-200 shrink-0 flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <span class="material-symbols-outlined text-primary">restaurant_menu</span>
          Menyu
        </h2>
        <p class="text-sm text-slate-500 mt-1">Restoran menyusunu idarə et</p>
      </div>
      <button 
        @click="openAddModal"
        class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-primary/25 active:scale-95"
      >
        <span class="material-symbols-outlined">add_circle</span>
        <span>Yeni Məhsul</span>
      </button>
    </div>

    <!-- Menu Content -->
    <div class="flex-1 overflow-y-auto p-6" v-if="!isLoading">
      <div v-if="categories.length === 0" class="text-center py-10 text-slate-400">
        <span class="material-symbols-outlined text-4xl mb-2">no_meals</span>
        <p>Hələ heç bir məhsul yoxdur.</p>
      </div>

      <div class="grid gap-4" v-else>
        <div
          v-for="category in categories"
          :key="category.name"
          class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
        >
          <div class="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 group cursor-pointer hover:bg-slate-100 transition-colors">
            <span class="material-symbols-outlined text-primary text-sm">{{ category.icon || 'category' }}</span>
            <h3 class="font-bold text-sm text-slate-700 uppercase tracking-wide">{{ category.name }}</h3>
            <span class="text-xs text-slate-400 ml-auto">{{ category.items.length }} məhsul</span>
          </div>
          <div class="divide-y divide-slate-100">
            <div
              v-for="item in category.items"
              :key="item.id"
              class="px-5 py-3 flex justify-between items-center hover:bg-slate-50/50 transition-colors group"
            >
              <div :class="{ 'opacity-50': item.inStock === false }">
                <div class="font-medium text-slate-800 text-sm flex items-center gap-2">
                  {{ item.name }}
                  <span v-if="item.inStock === false" class="bg-red-50 text-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-100">Bitib</span>
                </div>
                <div v-if="item.description" class="text-xs text-slate-400">{{ item.description }}</div>
              </div>
              <div class="flex items-center gap-4">
                <span class="font-bold text-primary text-sm">₼{{ (item.price || 0).toFixed(2) }}</span>
                
                <!-- Actions (Hover-da görünür) -->
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    @click="openEditModal(item)"
                    class="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                    title="Redaktə et"
                  >
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button 
                    @click="confirmDelete(item)"
                    class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                    title="Sil"
                  >
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <!-- Modals -->
    <ProductModal
      :visible="showProductModal"
      :product="editingProduct"
      :categories="categoriesList"
      @close="showProductModal = false"
      @save="handleSaveProduct"
    />

    <ConfirmDialog
      :visible="showDeleteConfirm"
      title="Məhsulu silmək?"
      :message="`'${productToDelete?.name}' məhsulunu silmək istədiyinizə əminsiniz?`"
      icon="delete"
      variant="danger"
      confirm-text="Sil"
      cancel-text="Ləğv et"
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false"
    />
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMenu } from '../composables/useMenu.js'
import ProductModal from './ProductModal.vue'
import ConfirmDialog from './ConfirmDialog.vue'

const { 
  categories, 
  categoriesList,
  isLoading, 
  startListening, 
  stopListening,
  addProduct,
  updateProduct,
  deleteProduct,
  uploadImage
} = useMenu()

const showProductModal = ref(false)
const showDeleteConfirm = ref(false)
const editingProduct = ref(null)
const productToDelete = ref(null)

onMounted(() => {
  startListening()
})

onUnmounted(() => {
  // We keep listening globally since CreateOrderModal depends on it
  // stopListening() 
})

function openAddModal() {
  editingProduct.value = null
  showProductModal.value = true
}

function openEditModal(product) {
  editingProduct.value = { ...product } // Clone to avoid direct mutation
  showProductModal.value = true
}

function confirmDelete(product) {
  productToDelete.value = product
  showDeleteConfirm.value = true
}

async function handleSaveProduct(productData) {
  try {
    let imageUrl = productData.imageUrl

    if (productData.imageFile) {
      // Show simple loading indicator if needed or just wait
      imageUrl = await uploadImage(productData.imageFile)
    }

    // Clean up file object before saving to Firestore
    const { imageFile, ...dataToSave } = productData
    const finalData = { ...dataToSave, imageUrl }

    if (editingProduct.value) {
      await updateProduct(editingProduct.value.id, finalData)
    } else {
      await addProduct(finalData)
    }
    showProductModal.value = false
  } catch (err) {
    alert('Xəta baş verdi: ' + err.message)
  }
}

async function handleDelete() {
  if (!productToDelete.value) return
  try {
    await deleteProduct(productToDelete.value.id)
    showDeleteConfirm.value = false
    productToDelete.value = null
  } catch (err) {
    alert('Silinmə zamanı xəta: ' + err.message)
  }
}
</script>
