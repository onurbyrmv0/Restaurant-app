
import { ref, computed } from 'vue'
import { db, storage } from '../firebase.js'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore'
import { ref as storageRefFunc, uploadBytes, getDownloadURL } from 'firebase/storage'

// State
const products = ref([]) // Flat list of menu items
const categoriesList = ref([]) // List of category objects {id, label, order}
const isLoading = ref(true)
const error = ref(null)

// Derived state for MenuView
const categories = computed(() => {
  return categoriesList.value.map(cat => ({
    id: cat.id,
    name: cat.label,
    icon: getCategoryIcon(cat.id),
    items: products.value.filter(p => p.categoryId === cat.id)
  }))
})

let unsubItems = null
let unsubCats = null

function getCategoryIcon(catId) {
  const map = {
    'breakfast': 'egg_alt',
    'lunch': 'restaurant',
    'dinner': 'lunch_dining',
    'drinks': 'local_cafe',
    'dessert': 'cake'
  }
  return map[catId] || 'category'
}

function startListening() {
  if (unsubItems || unsubCats) return

  // 1. Listen to Categories
  const catQuery = query(collection(db, 'categories'), orderBy('order'))
  unsubCats = onSnapshot(catQuery, (snapshot) => {
    categoriesList.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }, (err) => console.error('Categories listener error:', err))

  // 2. Listen to Menu Items
  const itemsRef = collection(db, 'menuItems')
  unsubItems = onSnapshot(itemsRef, (snapshot) => {
    products.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    isLoading.value = false
  }, (err) => {
    console.error('Menu items listener error:', err)
    error.value = err.message
    isLoading.value = false
  })
}

function stopListening() {
  if (unsubItems) { unsubItems(); unsubItems = null }
  if (unsubCats) { unsubCats(); unsubCats = null }
}

// Auto-start listening for globally shared menu state
startListening()

export function useMenu() {
  async function addProduct(product) {
    try {
      // Map frontend fields back to db fields if needed
      // MobileApp uses: name, description, price, image, categoryId
      const data = {
        name: product.name,
        description: product.description,
        price: Number(product.price),
        image: product.imageUrl, // Desktop uses imageUrl, Mobile uses image. Let's align on 'image' for DB
        categoryId: product.category, // This should be the ID
        inStock: product.inStock !== undefined ? product.inStock : true,
        createdAt: serverTimestamp()
      }
      await addDoc(collection(db, 'menuItems'), data)
    } catch (err) {
      console.error('Error adding product:', err)
      throw err
    }
  }

  async function updateProduct(id, updates) {
    try {
      // Map updates
      const data = {}
      if (updates.name !== undefined) data.name = updates.name
      if (updates.description !== undefined) data.description = updates.description
      if (updates.price !== undefined) data.price = Number(updates.price)
      if (updates.imageUrl !== undefined) data.image = updates.imageUrl
      if (updates.category !== undefined) data.categoryId = updates.category // Map category -> categoryId
      if (updates.inStock !== undefined) data.inStock = updates.inStock

      const docRef = doc(db, 'menuItems', id)
      await updateDoc(docRef, data)
    } catch (err) {
      console.error('Error updating product:', err)
      throw err
    }
  }

  async function deleteProduct(id) {
    try {
      await deleteDoc(doc(db, 'menuItems', id))
    } catch (err) {
      console.error('Error deleting product:', err)
      throw err
    }
  }

  async function uploadImage(file) {
    try {
      const storageRef = storageRefFunc(storage, `menuItems/${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      return downloadURL
    } catch (err) {
      console.error('Error uploading image:', err)
      throw err
    }
  }

  return {
    products,
    categories, // Grouped structure for View
    categoriesList, // Raw list for Select
    isLoading,
    error,
    startListening,
    stopListening,
    addProduct,
    updateProduct,
    deleteProduct,
    uploadImage
  }
}
