<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>

        <!-- content -->
        <div class="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-zoom-in">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">{{ isEdit ? 'edit' : 'add_circle' }}</span>
              {{ isEdit ? 'Məhsulu Redaktə Et' : 'Yeni Məhsul' }}
            </h3>
            <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 transition-colors">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4">
            <!-- Image Upload -->
            <div class="flex justify-center mb-2">
              <div 
                class="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer flex flex-col items-center justify-center group"
                @click="$refs.fileInput.click()"
              >
                <img 
                  v-if="previewUrl" 
                  :src="previewUrl" 
                  class="w-full h-full object-cover"
                />
                <div v-else class="flex flex-col items-center text-slate-400 group-hover:text-primary">
                  <span class="material-symbols-outlined text-2xl">add_photo_alternate</span>
                  <span class="text-[10px] font-bold mt-1">Şəkil seç</span>
                </div>
                
                <!-- Overlay for change -->
                <div v-if="previewUrl" class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span class="material-symbols-outlined text-white">edit</span>
                </div>
              </div>
              <input 
                ref="fileInput"
                type="file" 
                accept="image/*" 
                class="hidden" 
                @change="onFileSelected"
              >
            </div>

            <!-- Name -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Məhsul Adı</label>
              <input
                v-model="form.name"
                class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300"
                placeholder="Məsələn: Pendirli Burger"
              />
            </div>

            <!-- Category -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Kateqoriya</label>
              <select
                v-model="form.category"
                class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
              >
                <option value="" disabled>Seçin...</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.label }}</option>
              </select>
            </div>
            
            <!-- Price & Description -->
            <div class="grid grid-cols-3 gap-4">
               <div class="col-span-1">
                <label class="block text-sm font-semibold text-slate-700 mb-1">Qiymət (₼)</label>
                <input
                  v-model.number="form.price"
                  type="number"
                  step="0.1"
                  min="0"
                  class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
               <div class="col-span-2">
                <input
                  v-model="form.description"
                  class="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300"
                  placeholder="İçindəkilər..."
                />
              </div>
            </div>

            <!-- In Stock Toggle -->
            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-slate-400">inventory_2</span>
                <span class="text-sm font-semibold text-slate-700">Məhsul stokda var?</span>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="form.inStock" class="sr-only peer">
                <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button
              @click="$emit('close')"
              class="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Ləğv et
            </button>
            <button
              @click="handleSubmit"
              class="px-8 py-2.5 rounded-xl font-bold text-white bg-primary shadow-lg shadow-primary/25 hover:bg-primary-dark active:scale-95 transition-all"
              :disabled="!isValid"
            >
              {{ isEdit ? 'Yadda saxla' : 'Əlavə et' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  visible: Boolean,
  product: Object, // If provided, edit mode
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'save'])

const isEdit = computed(() => !!props.product)
const fileInput = ref(null)
const imageFile = ref(null)
const previewUrl = ref(null)

const form = ref({
  name: '',
  category: '',
  description: '',
  price: 0,
  imageUrl: '',
  inStock: true
})

watch(() => props.visible, (val) => {
  if (val) {
    imageFile.value = null
    if (props.product) {
      form.value = { 
        ...props.product, 
        category: props.product.categoryId || props.product.category,
        inStock: props.product.inStock !== undefined ? props.product.inStock : true
      } 
      previewUrl.value = props.product.image || props.product.imageUrl || null
    } else {
      form.value = { name: '', category: '', description: '', price: 0, imageUrl: '', inStock: true }
      previewUrl.value = null
    }
  }
})

function onFileSelected(event) {
  const file = event.target.files[0]
  if (!file) return
  
  imageFile.value = file
  
  // Create local preview
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const isValid = computed(() => form.value.name && form.value.price >= 0 && form.value.category)

function handleSubmit() {
  if (!isValid.value) return
  
  emit('save', { 
    ...form.value, 
    imageFile: imageFile.value // Pass the actual file object
  })
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
