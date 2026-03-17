import { reactive, computed } from 'vue'
import {
  collection, addDoc, doc, updateDoc, onSnapshot,
  query, orderBy, serverTimestamp, setDoc, getDocs, where, getDoc
} from 'firebase/firestore'
import { db } from '../firebase'
import { seedFirestore } from '../utils/seedData'

// ========================
// Reactive State
// ========================
const state = reactive({
  // Auth
  currentUser: JSON.parse(localStorage.getItem('user')) || null, // { id, nick, role }

  // Global Settings (Firestore 'settings/general')
  appSettings: {},

  // Firestore Data
  tables: [],
  categories: [],
  menuItems: {},      // { categoryId: [...items] }
  orders: [],         // Real sifarişlər bazadan

  // Lokal UI state
  activeCategory: '',
  searchQuery: '',     // Menu axtarışı üçün
  cart: {},            // { tableId: [...items] }
  activeTableId: null,
  showOrderSummary: false,
  orderSentSuccess: false,
  orderSending: false,
  orderError: null,

  // Yükləmə vəziyyəti
  loading: true,
})

// ========================
// Computed
// ========================
// Valyuta simvolu
const currencySymbol = computed(() => {
  if (!state.appSettings || !state.appSettings.currency) return '$'
  switch (state.appSettings.currency) {
    case 'TL': return '₺'
    case 'AZN': return '₼'
    default: return '$'
  }
})

const busyCount = computed(() => state.tables.filter((t) => t.status === 'busy').length)
const freeCount = computed(() => state.tables.filter((t) => t.status === 'free').length)

const currentMenuItems = computed(() => {
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase()
    // Search across all items if there's a query
    const allItems = Object.values(state.menuItems).flat()
    return allItems.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query)
    )
  }
  
  // Otherwise show items from the active category
  return state.menuItems[state.activeCategory] || []
})

const currentCart = computed(() => {
  if (!state.activeTableId) return []
  return state.cart[state.activeTableId] || []
})

const cartItemCount = computed(() => {
  return currentCart.value.reduce((sum, item) => sum + item.quantity, 0)
})

const subtotal = computed(() => currentCart.value.reduce((sum, item) => sum + item.price * item.quantity, 0))

// Vergi (Safe computation)
const currentTaxRate = computed(() => {
  const rate = state.appSettings?.taxRate
  return (rate !== undefined && rate !== null) ? Number(rate) : 8
})

const tax = computed(() => subtotal.value * (currentTaxRate.value / 100))
const total = computed(() => subtotal.value + tax.value)

// ========================
// Firestore Listeners
// ========================
let unsubTables = null
let unsubCategories = null
let unsubMenuItems = null
let unsubOrders = null
let unsubSettings = null

function listenSettings() {
  console.log('🎧 Settings listener started...')
  // 'settings' kolleksiyasında 'general' sənədini dinlə
  unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data()
      console.log('✅ Settings Data:', data)
      // Normalizasiya: taxRate və ya taxrate
      state.appSettings = {
        ...data,
        taxRate: data.taxRate !== undefined ? data.taxRate : data.taxrate
      }
    } else {
      console.log('⚠️ Settings sənədi yoxdur, yaradılır...')
      // Yoxdursa yarat (default)
      setDoc(doc(db, 'settings', 'general'), { taxRate: 8, currency: 'USD' })
    }
  }, (error) => {
    console.error('❌ Settings listener error:', error)
  })
}

function listenTables() {
  const q = query(collection(db, 'tables'), orderBy('tableNumber'))
  unsubTables = onSnapshot(q, (snapshot) => {
    state.tables = snapshot.docs.map((d) => ({
      id: d.data().tableNumber,
      tableNumber: d.data().tableNumber, // Add this explicitly
      docId: d.id,
      status: d.data().status,
      capacity: d.data().capacity || 4, // Capacity field
      time: d.data().time || 0,
      isReserved: d.data().isReserved || false,
      reservedName: d.data().reservedName || '',
      reservedTime: d.data().reservedTime || '',
    }))

  })
}

function listenCategories() {
  const q = query(collection(db, 'categories'), orderBy('order'))
  unsubCategories = onSnapshot(q, (snapshot) => {
    state.categories = snapshot.docs.map((d) => ({
      id: d.id,
      label: d.data().label,
    }))
    
    // Aktiv seçilmiş kateqoriya bazada yoxdursa və ya boşdursa, ilkini seç
    const isValid = state.categories.some(c => c.id === state.activeCategory)
    if ((!state.activeCategory || !isValid) && state.categories.length > 0) {
      state.activeCategory = state.categories[0].id
    }
  })
}

function listenMenuItems() {
  unsubMenuItems = onSnapshot(collection(db, 'menuItems'), (snapshot) => {
    const grouped = {}
    snapshot.docs.forEach((d) => {
      const data = d.data()
      const catId = data.categoryId
      if (!catId) return
      
      if (!grouped[catId]) grouped[catId] = []
      grouped[catId].push({
        id: d.id,
        name: data.name || '',
        description: data.description || '',
        price: Number(data.price) || 0,
        image: data.image || '',
        inStock: data.inStock !== undefined ? data.inStock : true,
        categoryId: catId,
      })
    })
    console.log('✅ Menu items loaded and grouped:', Object.keys(grouped).length, 'categories')
    state.menuItems = grouped
  }, (err) => {
    console.error('❌ Menu Items listener error:', err)
  })
}



function listenOrders() {
  if (!state.currentUser?.id) return

  const q = query(
    collection(db, 'orders'), 
    where('status', 'in', ['new', 'preparing', 'served', 'done', 'paid'])
    // Removed waiterId filter to support merging items into orders started by other waiters.
    // Display filtering is now handled in the component view.
  )

  unsubOrders = onSnapshot(q, (snapshot) => {
    const activeOrders = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.() || null,
    }))

    activeOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

    activeOrders.forEach((order) => {
      // Auto-complete logic removed: Cashier (DesktopApp) now handles final completion.
      // This prevents race conditions and table re-appearing issues.
    })

    state.orders = activeOrders
  })
}

/**
 * Store-u başlat: seed et (lazımdırsa) + real-time listener-ları qoş.
 */
async function initStore() {
  state.loading = true
  try {
    if (!state.currentUser) {
      state.loading = false
      return // Login olmayıbsa data yükləmə
    }

    // İlkin dataları yoxla/yüklə
    await seedFirestore()

    // Real-time listener-ları başlat
    listenSettings()
    listenTables()
    listenCategories()
    listenMenuItems()
    listenOrders()

  } catch (err) {
    console.error('Store init xətası:', err)
  } finally {
    state.loading = false
  }
}

/**
 * Listener-ları dayandır (cleanup).
 */
function destroyStore() {
  if (unsubTables) unsubTables()
  if (unsubCategories) unsubCategories()
  if (unsubMenuItems) unsubMenuItems()
  if (unsubOrders) unsubOrders()
  if (unsubSettings) unsubSettings()
}

// ========================
// Auth Actions (Simple)
// ========================
async function login(nick, password) {
  state.loading = true
  try {
    const q = query(collection(db, 'users'), where('nick', '==', nick), where('password', '==', password))
    const snap = await getDocs(q)
    
    if (!snap.empty) {
      const userDoc = snap.docs[0]
      const user = { id: userDoc.id, ...userDoc.data() }
      state.currentUser = user
      localStorage.setItem('user', JSON.stringify(user))
      // App starts
      initStore()
      return true
    } else {
      throw new Error('İstifadəçi adı və ya şifrə yanlışdır')
    }
  } finally {
    state.loading = false
  }
}

async function register(nick, password) {
  state.loading = true
  try {
    // Check existing
    const q = query(collection(db, 'users'), where('nick', '==', nick))
    const snap = await getDocs(q)
    if (!snap.empty) throw new Error('Bu istifadəçi adı artıq mövcuddur')

    const newUser = { nick, password, role: 'waiter', createdAt: serverTimestamp() }
    const ref = await addDoc(collection(db, 'users'), newUser)
    
    // Auto login
    const user = { id: ref.id, ...newUser }
    state.currentUser = user
    localStorage.setItem('user', JSON.stringify(user))
    initStore()
    return true
  } finally {
    state.loading = false
  }
}

function logout() {
  state.currentUser = null
  localStorage.removeItem('user')
  destroyStore()
  // Reset state some parts
  state.cart = {}
  state.activeTableId = null
}

// ========================
// Settings Actions
// ========================
async function updateSettings(newSettings) {
  await updateDoc(doc(db, 'settings', 'general'), newSettings)
}

// ========================
// Helper Functions
// ========================
function getOrderPaymentStatus(order) {
  if (!order) return { label: 'Naməlum', class: 'bg-slate-100 text-slate-500' }
  
  if (order.status === 'completed' || order.status === 'paid' || order.status === 'closed') {
    return { label: 'Tam Ödənilib', class: 'bg-green-100 text-green-700' }
  }
  
  if (order.paidAmount > 0) {
    return { label: 'Hissəvi Ödənilib', class: 'bg-amber-100 text-amber-700' }
  }
  
  return { label: 'Ödənilməyib', class: 'bg-slate-100 text-slate-600 border border-slate-200' }
}

function getItemStatusDetails(status) {
  const map = {
    new: { label: 'Yeni', class: 'bg-red-50 text-red-600 border border-red-100' },
    preparing: { label: 'Hazırlanır', class: 'bg-blue-50 text-blue-600 border border-blue-100' },
    done: { label: 'Təhvil verildi', class: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
    completed: { label: 'Ödənilib', class: 'bg-emerald-100 text-emerald-700' }
  }
  return map[status] || { label: status, class: 'bg-slate-50 text-slate-500 border border-slate-100' }
}

// ========================
// Actions
// ========================
function setActiveCategory(id) {
  state.activeCategory = id
}

function setActiveTable(tableId) {
  state.activeTableId = tableId
  if (!state.cart[tableId]) {
    state.cart[tableId] = []
  }
}

function addToCart(item) {
  if (!state.activeTableId) return
  const tableId = state.activeTableId
  if (!state.cart[tableId]) {
    state.cart[tableId] = []
  }
  const existing = state.cart[tableId].find((c) => c.id === item.id)
  if (existing) {
    existing.quantity++
  } else {
    state.cart[tableId].push({ ...item, quantity: 1, note: '' })
  }
}

function addNoteToItem(itemId, note) {
  if (!state.activeTableId) return
  const item = state.cart[state.activeTableId]?.find((c) => c.id === itemId)
  if (item) item.note = note
}

function incrementItem(itemId) {
  if (!state.activeTableId) return
  const item = state.cart[state.activeTableId]?.find((c) => c.id === itemId)
  if (item) item.quantity++
}

function decrementItem(itemId) {
  if (!state.activeTableId) return
  const items = state.cart[state.activeTableId]
  const idx = items?.findIndex((c) => c.id === itemId)
  if (idx !== undefined && idx >= 0) {
    if (items[idx].quantity > 1) {
      items[idx].quantity--
    } else {
      items.splice(idx, 1)
    }
  }
}

function toggleOrderSummary() {
  state.showOrderSummary = !state.showOrderSummary
}

async function sendOrder() {
  if (!state.activeTableId) return
  const tableId = state.activeTableId
  const cartItems = state.cart[tableId]
  if (!cartItems || cartItems.length === 0) return

  state.orderSending = true
  state.orderError = null

  try {
    // Check for existing active order for this table
    const activeOrder = state.orders.find(o => 
      String(o.tableNumber) === String(tableId) && 
      !['completed', 'paid', 'closed'].includes(o.status)
    )

    if (activeOrder) {
      // MERGE logic: Keep new additions as separate items to allow individual status tracking
      const existingItems = [...(activeOrder.items || [])]
      const currentUserNick = state.currentUser?.nick || 'Naməlum'

      for (const newItem of cartItems) {
        existingItems.push({
          id: newItem.id,
          name: newItem.name,
          description: newItem.description || '',
          price: Number(newItem.price),
          quantity: Number(newItem.quantity),
          note: newItem.note || '',
          addedBy: currentUserNick,
          status: 'new' // Individual item status
        })
      }

      const newSubtotal = existingItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const newTotal = newSubtotal + (newSubtotal * (activeOrder.taxRate || currentTaxRate.value) / 100)

      await updateDoc(doc(db, 'orders', activeOrder.id), {
        items: existingItems,
        totalPrice: parseFloat(newTotal.toFixed(2)),
        status: 'new',
        updatedAt: serverTimestamp()
      })
    } else {
      // 1) Firebase-ə yeni sifariş yaz
      const creatorNick = state.currentUser?.nick || 'Naməlum'
      await addDoc(collection(db, 'orders'), {
        tableNumber: tableId,
        waiterName: creatorNick,
        waiterId: state.currentUser?.id || null,
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: item.price,
          quantity: item.quantity,
          note: item.note || '',
          addedBy: creatorNick,
          status: 'new' // Individual item status
        })),
        taxRate: currentTaxRate.value,
        totalPrice: parseFloat(total.value.toFixed(2)),
        status: 'new',
        createdAt: serverTimestamp(),
      })
    }

    // 2) Masa statusunu Firestore-da yenilə (busy)
    await updateTableStatus(tableId, 'busy')

    state.orderSentSuccess = true
    state.orderSending = false

    // 1.5 saniyə sonra modalı bağla və səbəti təmizlə
    setTimeout(() => {
      state.orderSentSuccess = false
      state.showOrderSummary = false
      state.cart[tableId] = []
    }, 1500)
  } catch (error) {
    console.error('Sifariş göndərilmədi:', error)
    state.orderSending = false
    state.orderError = 'Sifariş göndərilmədi. Yenidən cəhd edin.'
    setTimeout(() => {
      state.orderError = null
    }, 3000)
  }
}

/**
 * Masa statusunu dəyişdir (free/busy) — Firestore-da yenilə.
 */
async function updateTableStatus(tableId, newStatus) {
  // Masalar '1', '2' kimi ID-lərlə yaradılıb (String)
  const docRef = doc(db, 'tables', String(tableId))
  
  const updates = { status: newStatus }
  // Əgər masa boşalırsa vaxtı sıfırla
  if (newStatus === 'free') {
    updates.time = 0
  }

  await updateDoc(docRef, updates)
}

/**
 * Sifariş statusunu dəyişdir — Firestore-da yenilə.
 */
async function updateOrderStatus(orderId, newStatus) {
  await updateDoc(doc(db, 'orders', orderId), {
    status: newStatus,
  })
}

/**
 * Sifariş daxilində tək bir məhsulun statusunu dəyişdir.
 */
async function updateItemStatus(orderId, itemIndex, newStatus) {
  const orderRef = doc(db, 'orders', orderId)
  const orderSnap = await getDoc(orderRef)
  
  if (orderSnap.exists()) {
    const items = [...orderSnap.data().items]
    if (items[itemIndex]) {
      items[itemIndex].status = newStatus
      await updateDoc(orderRef, { items })
    }
  }
}

async function transferOrder(oldTableId, newTableId) {
  try {
    // 1. Find active orders for the old table
    const activeOrders = state.orders.filter(o => 
      String(o.tableNumber) === String(oldTableId) && 
      !['completed', 'paid', 'closed'].includes(o.status)
    )

    if (activeOrders.length === 0) {
      // In case orders are not in memory, we could query Firestore, 
      // but usually they are for the current waiter.
      throw new Error('Aktiv sifariş tapılmadı.')
    }

    // 2. Update all active orders to the new table
    for (const order of activeOrders) {
      await updateDoc(doc(db, 'orders', order.id), { tableNumber: String(newTableId) })
    }

    // 3. Update table statuses
    await updateTableStatus(oldTableId, 'free')
    await updateTableStatus(newTableId, 'busy')

    return true
  } catch (error) {
    console.error('Transfer xətası:', error)
    throw error
  }
}

// ========================
// Export
// ========================
export function useAppStore() {
  return {
    state,
    currencySymbol,
    busyCount,
    freeCount,
    currentMenuItems,
    currentCart,
    cartItemCount,
    subtotal,
    tax,
    total,
    initStore,
    destroyStore,
    login,
    register,
    logout,
    updateSettings,
    setSearchQuery: (q) => state.searchQuery = q,
    setActiveCategory,
    setActiveTable,
    addToCart,
    addNoteToItem,
    incrementItem,
    decrementItem,
    toggleOrderSummary,
    sendOrder,
    updateTableStatus,
    updateOrderStatus,
    updateItemStatus,
    transferOrder,
    getOrderPaymentStatus,
    getItemStatusDetails,
  }
}
