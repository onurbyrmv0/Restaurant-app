import { ref, computed } from 'vue'
import { db } from '../firebase.js'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  deleteField,
  serverTimestamp,
} from 'firebase/firestore'

// ── Reactive state (module-level singleton) ──
const orders = ref([])
const selectedOrderId = ref(null)
const isLoading = ref(true)
const error = ref(null)
const activeNav = ref('orders')

// ── Configuration State ──
const taxRate = ref(8)
const serviceChargeRate = ref(0)

// ── Settings Listener ──
function startSettingsListener() {
  const settingsRef = doc(db, 'settings', 'general')
  onSnapshot(settingsRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data()
      // Update if fields exist, otherwise keep defaults
      if (data.taxRate !== undefined) taxRate.value = Number(data.taxRate)
      if (data.serviceChargeRate !== undefined) serviceChargeRate.value = Number(data.serviceChargeRate)
    }
  }, (err) => {
    console.error('Error fetching settings:', err)
  })
}

// Start listeners
startSettingsListener()

// ── Tables (realtime from Firestore) ──
const tablesCount = ref(12)
const tableDetails = ref({}) // map[tableId] = { capacity, status, ... }
const tableReservations = ref({}) // map[tableId] = { isReserved, reservedName, reservedTime, reservedPhone }

onSnapshot(collection(db, 'tables'), (snapshot) => {
  tablesCount.value = snapshot.size
  
  const details = {}
  const reservations = {}
  
  snapshot.forEach(docSnap => {
    const data = docSnap.data()
    const tId = String(data.tableNumber)
    
    details[tId] = {
      tableNumber: tId,
      capacity: data.capacity || 4,
      status: data.status || 'free'
    }

    if (data.isReserved) {
      reservations[tId] = {
        isReserved: true,
        reservedName: data.reservedName,
        reservedTime: data.reservedTime,
        reservedPhone: data.reservedPhone
      }
    }
  })
  
  tableDetails.value = details
  tableReservations.value = reservations
})


// ── New order notification ──
let previousOrderIds = new Set()
let isFirstLoad = true

function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const playTone = (freq, startTime, duration) => {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, startTime)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
      osc.start(startTime)
      osc.stop(startTime + duration)
    }
    const now = audioCtx.currentTime
    playTone(523, now, 0.15)
    playTone(659, now + 0.15, 0.15)
    playTone(784, now + 0.3, 0.2)
  } catch (e) {
    // Audio not available
  }
}

// ── Auto-refresh time ago ──
const tickCount = ref(0)
setInterval(() => {
  tickCount.value++
}, 30000)

// ── Firestore listener ──
let unsubscribe = null

function startListening() {
  if (unsubscribe) return

  const ordersRef = collection(db, 'orders')
  const q = query(ordersRef, orderBy('createdAt', 'desc'))

  unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const incoming = []
      const incomingIds = new Set()

      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        incomingIds.add(docSnap.id)

        const mappedItems = (data.items || []).map((item) => ({
          id: item.id || null,
          name: item.name || '',
          description: item.description || '',
          quantity: item.quantity ?? item.qty ?? 0,
          price: item.price || 0,
          addedBy: item.addedBy || data.waiterName || 'Ofisiant',
          status: item.status || 'new',
          isPaid: item.isPaid || false
        }))

        // Verify totals from DB
        const itemsTotal = mappedItems.reduce(
          (sum, item) => sum + item.quantity * item.price, 0
        )
        
        // Use DB totalPrice if available, else calc
        const dbTotal = data.totalPrice ?? data.total ?? itemsTotal
        
        // Determine server/waiter name
        const serverName = data.waiterName || data.server || 'Ofisiant'

        incoming.push({
          id: docSnap.id,
          tableNumber: String(data.tableNumber ?? '??'),
          guests: data.guests || null,
          status: data.status || 'new',
          server: serverName,
          waiterId: data.waiterId || null,
          startedAt: data.startedAt || null,
          total: dbTotal,
          totalPrice: dbTotal, // Map to both for compatibility
          subtotal: itemsTotal, // Add this for accurate partial calculations
          paidAmount: data.paidAmount || 0,
          partialPayments: data.partialPayments || [],
          items: mappedItems,
          notes: data.notes || '',
          createdAt: data.createdAt,
          amountPaid: data.amountPaid || 0,
          tipAmount: data.tipAmount || 0,
          changeAmount: data.changeAmount || 0,
          paidAt: data.paidAt || null,
          paymentMethod: data.paymentMethod || 'cash',
        })
      })

      if (!isFirstLoad) {
        for (const id of incomingIds) {
          if (!previousOrderIds.has(id)) {
            playNotificationSound()
            break
          }
        }
      }
      isFirstLoad = false
      previousOrderIds = incomingIds

      orders.value = incoming
      isLoading.value = false

      if (!selectedOrderId.value && incoming.length > 0) {
        selectedOrderId.value = incoming[0].id
      }
      if (selectedOrderId.value && !incoming.find(o => o.id === selectedOrderId.value)) {
        selectedOrderId.value = incoming.length > 0 ? incoming[0].id : null
      }
    },
    (err) => {
      console.error('Firestore onSnapshot error:', err)
      error.value = err.message
      isLoading.value = false
    }
  )
}

function stopListening() {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
}

startListening()

// ── Composable ──
export function useOrders() {
  const selectedOrder = computed(() =>
    orders.value.find((o) => o.id === selectedOrderId.value)
  )

  const subtotal = computed(() => {
    if (!selectedOrder.value) return 0
    return selectedOrder.value.items.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
      0
    )
  })

  // Calculate tax and totals based on updated logic
  // Grand total should match DB total if available (source of truth)
  const grandTotal = computed(() => {
    if (selectedOrder.value?.total) {
      return selectedOrder.value.total
    }
    // Fallback calculation if DB total is missing
    return subtotal.value + (subtotal.value * taxRate.value / 100) + (subtotal.value * serviceChargeRate.value / 100)
  })

  // Tax calculation
  const tax = computed(() => {
    const calculatedService = subtotal.value * serviceChargeRate.value / 100
    const remaining = grandTotal.value - subtotal.value - calculatedService
    return remaining > 0 ? remaining : 0
  })

  // Service charge calculation
  const serviceCharge = computed(() => subtotal.value * serviceChargeRate.value / 100)

  // Active orders are pending payment (everything except 'paid' and 'closed')
  const activeOrderCount = computed(() =>
    orders.value.filter(o => !['paid', 'closed', 'completed'].includes(o.status)).length
  )

  // Table stats: exclude paid, closed, completed
  const tableStats = computed(() => {
    const busyCount = new Set(orders.value.filter(o => !['paid', 'closed', 'completed'].includes(o.status)).map(o => o.tableNumber)).size
    const reservedCount = Object.keys(tableReservations.value).length
    
    return {
      busy: busyCount,
      reserved: reservedCount,
      total: tablesCount.value,
    }
  })

  function selectOrder(orderId) {
    selectedOrderId.value = orderId
  }

  // Get financial status for the order
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

  function getStatusLabel(status) {
    const labels = {
      new: 'Yeni',
      preparing: 'Hazırlanır',
      done: 'Təhvil verildi',
      completed: 'Ödənilib',
      paid: 'Ödənilib',
      closed: 'Ödənilib',
    }
    return labels[status] || status
  }

  function getStatusClasses(status) {
    const classes = {
      new: 'bg-red-50 text-red-600 border border-red-100',
      preparing: 'bg-blue-50 text-blue-600 border border-blue-100',
      done: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      completed: 'bg-emerald-100 text-emerald-700',
      paid: 'bg-emerald-100 text-emerald-700',
      closed: 'bg-emerald-100 text-emerald-700',
    }
    return classes[status] || 'bg-slate-50 text-slate-500 border border-slate-100'
  }

  async function updateOrderStatus(orderId, newStatus) {
    try {
      const orderRef = doc(db, 'orders', orderId)
      await updateDoc(orderRef, { status: newStatus })
    } catch (err) {
      console.error('Error updating order status:', err)
      error.value = err.message
    }
  }

  async function updateTableStatus(tableId, status) {
    try {
      const tableRef = doc(db, 'tables', String(tableId))
      await updateDoc(tableRef, { status })
    } catch (err) {
      console.error('Error updating table status:', err)
    }
  }

  async function updateTableCapacity(tableId, capacity) {
    try {
      const tableRef = doc(db, 'tables', String(tableId))
      await updateDoc(tableRef, { capacity: Number(capacity) })
    } catch (err) {
      console.error('Error updating table capacity:', err)
      throw err
    }
  }


  async function markAsPaid(paymentData = {}) {
    const currentOrder = selectedOrder.value
    if (!currentOrder) return

    const isPartial = paymentData.isPartial || false
    const paidItemIndices = paymentData.paidItemIndices || []

    // 1. Prepare updates
    const currentItems = [...(currentOrder.items || [])]
    
    // Mark specific items as paid if provided
    if (paidItemIndices.length > 0) {
      paidItemIndices.forEach(idx => {
        if (currentItems[idx]) {
          currentItems[idx].isPaid = true
        }
      })
    }

    const allItemsPaid = currentItems.every(item => item.isPaid)
    
    const newPayments = [...(currentOrder.partialPayments || [])]
    newPayments.push({
      amount: paymentData.amountPaid || 0,
      tip: paymentData.tipAmount || 0,
      method: paymentData.paymentMethod || 'cash',
      paidAt: new Date().toISOString(),
      itemsPaid: paidItemIndices.length
    })

    const orderTotal = currentOrder.totalPrice || currentOrder.total || 0
    const totalPaidSoFar = Math.min(orderTotal, (currentOrder.paidAmount || 0) + (paymentData.amountPaid || 0))
    
    // Check if the bill is settled (using small epsilon for float precision)
    const isSettled = totalPaidSoFar >= (orderTotal - 0.01)

    const updates = {
      items: currentItems,
      paidAmount: totalPaidSoFar,
      partialPayments: newPayments,
      updatedAt: serverTimestamp()
    }

    // Determine if we should close the order
    // Complete if: it was a full payment OR all items are paid OR the balance reached zero
    if (!isPartial || allItemsPaid || isSettled) {
      updates.status = 'completed'
      updates.amountPaid = totalPaidSoFar
      updates.tipAmount = (currentOrder.tipAmount || 0) + (paymentData.tipAmount || 0)
      updates.changeAmount = paymentData.changeAmount || 0
      updates.paymentMethod = paymentData.paymentMethod || 'mixed'
      updates.paidAt = serverTimestamp()
      
      // If completed, ensure all items are internally marked as paid for consistency
      updates.items = currentItems.map(item => ({ ...item, isPaid: true }))
    }
    
    try {
      const orderRef = doc(db, 'orders', currentOrder.id)
      await updateDoc(orderRef, updates)
      
      // 2. Free the table if fully paid
      if (updates.status === 'completed' && currentOrder.tableNumber) {
        // Only free if no other active sub-orders (though we don't use sub-orders yet)
        await updateTableStatus(currentOrder.tableNumber, 'free')
        
        // Auto-deselect
        setTimeout(() => {
          if (selectedOrderId.value === currentOrder.id) {
            selectedOrderId.value = null
          }
        }, 1500)
      }
      
    } catch (err) {
      console.error('Error marking as paid:', err)
      error.value = err.message
      throw err
    }
  }

  async function updateOrderNotes(orderId, notes) {
    try {
      const orderRef = doc(db, 'orders', orderId)
      await updateDoc(orderRef, { notes })
    } catch (err) {
      console.error('Error updating notes:', err)
      error.value = err.message
    }
  }

  async function deleteOrder(orderId) {
    try {
      // Find order to get table number before deletion
      const order = orders.value.find(o => o.id === orderId)
      const tableNumber = order?.tableNumber

      const orderRef = doc(db, 'orders', orderId)
      await deleteDoc(orderRef)

      // Free table if it has no more active orders
      if (tableNumber && tableNumber !== 'Takeaway') {
        const remainingOrders = orders.value.filter(o => 
          o.id !== orderId && 
          String(o.tableNumber) === String(tableNumber) &&
          !['completed', 'paid', 'closed'].includes(o.status)
        )
        if (remainingOrders.length === 0) {
          await updateTableStatus(tableNumber, 'free')
        }
      }
    } catch (err) {
      console.error('Error deleting order:', err)
      error.value = err.message
    }
  }

  async function updateSettings(newTaxRate, newServiceChargeRate) {
    try {
      const settingsRef = doc(db, 'settings', 'general')
      // setDoc with merge: true creates the doc if it doesn't exist
      await setDoc(settingsRef, { 
        taxRate: Number(newTaxRate),
        serviceChargeRate: Number(newServiceChargeRate)
      }, { merge: true })
    } catch (err) {
      console.error('Error updating settings:', err)
      error.value = err.message
    }
  }

  function getTimeAgo(createdAt) {
    const _ = tickCount.value
    if (!createdAt) return ''
    const now = Date.now()
    let ts
    if (createdAt.toDate) {
      ts = createdAt.toDate().getTime()
    } else if (createdAt.seconds) {
      ts = createdAt.seconds * 1000
    } else {
      ts = new Date(createdAt).getTime()
    }
    const diffMs = now - ts
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'indi'
    if (diffMins < 60) return `${diffMins} dəq əvvəl`
    const diffHours = Math.floor(diffMins / 60)
    return `${diffHours} saat əvvəl`
  }

  function formatStartedAt(createdAt) {
    if (!createdAt) return ''
    let date
    if (createdAt.toDate) {
      date = createdAt.toDate()
    } else if (createdAt.seconds) {
      date = new Date(createdAt.seconds * 1000)
    } else {
      date = new Date(createdAt)
    }
    const hours = date.getHours()
    const mins = date.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const h = hours % 12 || 12
    return `${h}:${mins} ${ampm}`
  }

  async function reserveTable(tableId, data) {
    try {
      const tableRef = doc(db, 'tables', String(tableId))
      await setDoc(tableRef, {
        isReserved: true,
        reservedName: data.name,
        reservedTime: data.time,
        reservedPhone: data.phone || '',
        updatedAt: serverTimestamp()
      }, { merge: true })
    } catch (err) {
      console.error('Error reserving table:', err)
      throw err
    }
  }

  async function cancelReservation(tableId) {
    try {
      const tableRef = doc(db, 'tables', String(tableId))
      await updateDoc(tableRef, {
        isReserved: false,
        reservedName: deleteField(),
        reservedTime: deleteField(),
        reservedPhone: deleteField(),
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error canceling reservation:', err)
      throw err
    }
  }

  async function transferOrder(oldTableId, newTableId) {
    try {
      // 1. Find active orders for the old table
      const activeOrders = orders.value.filter(o => 
        String(o.tableNumber) === String(oldTableId) && 
        !['completed', 'paid', 'closed'].includes(o.status)
      )

      if (activeOrders.length === 0) {
        throw new Error('Bu masada aktiv sifariş yoxdur.')
      }

      // 2. Update all active orders to the new table
      for (const order of activeOrders) {
        const orderRef = doc(db, 'orders', order.id)
        await updateDoc(orderRef, { tableNumber: String(newTableId) })
      }

      // 3. Update table statuses
      await updateTableStatus(oldTableId, 'free')
      await updateTableStatus(newTableId, 'busy')

      return true
    } catch (err) {
      console.error('Error transferring order:', err)
      error.value = err.message
      throw err
    }
  }

  async function createOrder(orderData) {
    try {
      // Check if we already have an active order for this table
      const activeOrder = orders.value.find(o => 
        String(o.tableNumber) === String(orderData.tableNumber) && 
        !['completed', 'paid', 'closed'].includes(o.status)
      )

      if (activeOrder && orderData.tableNumber !== 'Takeaway') {
        // MERGE logic: Append items to existing order
        const existingItems = [...activeOrder.items]
        const currentUser = 'Kassa / Admin'
        
        for (const newItem of orderData.items) {
          // Only merge if ID matches AND the person who added it matches AND it's not a different status flow
          // Actually, for per-item status, we might want to keep new additions separate if we want to track them individually
          // but for now let's stick to merging but giving new status to new additions
          
          existingItems.push({
            id: newItem.id,
            name: newItem.name,
            description: newItem.description || '',
            price: Number(newItem.price),
            quantity: Number(newItem.quantity),
            addedBy: currentUser,
            status: 'new' // Individual item status
          })
        }

        const subtotal = existingItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const tax = subtotal * (activeOrder.taxRate || taxRate.value) / 100
        const serviceCharge = subtotal * (activeOrder.serviceChargeRate || serviceChargeRate.value) / 100
        const total = subtotal + tax + serviceCharge

        const orderRef = doc(db, 'orders', activeOrder.id)
        await updateDoc(orderRef, {
          items: existingItems,
          totalPrice: Number(total.toFixed(2)),
          status: 'new', // Global order also becomes new
          updatedAt: serverTimestamp()
        })

        return activeOrder.id
      }

      // CREATE logic
      const subtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const tax = subtotal * (taxRate.value / 100)
      const serviceCharge = subtotal * (serviceChargeRate.value / 100)
      const total = subtotal + tax + serviceCharge

      const creator = 'Kassa / Admin'
      const newOrder = {
        tableNumber: String(orderData.tableNumber),
        waiterName: creator,
        waiterId: 'admin',
        items: orderData.items.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: Number(item.price),
          quantity: Number(item.quantity),
          addedBy: creator,
          status: 'new' // Individual item status
        })),
        notes: orderData.notes || '',
        status: orderData.status || 'new',
        taxRate: taxRate.value,
        serviceChargeRate: serviceChargeRate.value,
        totalPrice: Number(total.toFixed(2)),
        createdAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'orders'), newOrder)
      
      // Update table status if set
      if (orderData.tableNumber && orderData.tableNumber !== 'Takeaway') {
        await updateTableStatus(orderData.tableNumber, 'busy')
      }

      return docRef.id
    } catch (err) {
      console.error('Error creating order:', err)
      throw err
    }
  }

  function printBill() {
    if (!selectedOrder.value) return
    const order = selectedOrder.value
    const st = subtotal.value
    const tx = tax.value
    const sc = serviceCharge.value
    const gt = grandTotal.value // Display calculated grand to be consistent with breakdown

    const itemsHtml = order.items.map(item =>
      `<tr>
        <td style="padding:6px 0; border-bottom:1px dashed #eee">${item.name}</td>
        <td style="padding:6px 0; text-align:center; border-bottom:1px dashed #eee">${item.quantity}</td>
        <td style="padding:6px 0; text-align:right; border-bottom:1px dashed #eee">₼${(item.price || 0).toFixed(2)}</td>
        <td style="padding:6px 0; text-align:right; border-bottom:1px dashed #eee">₼${((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
      </tr>`
    ).join('')

    const printWindow = window.open('', '_blank', 'width=400,height=600')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Çek - Masa ${order.tableNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; padding: 20px; max-width: 350px; margin: 0 auto; font-size: 13px; }
          .header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #000; padding-bottom: 12px; }
          .header h1 { font-size: 18px; margin-bottom: 4px; }
          .header p { font-size: 11px; color: #666; }
          .info { margin-bottom: 12px; font-size: 12px; }
          .info div { display: flex; justify-content: space-between; margin-bottom: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th { text-align: left; padding: 4px 0; border-bottom: 2px solid #000; font-size: 11px; text-transform: uppercase; }
          th:nth-child(2) { text-align: center; }
          th:nth-child(3), th:nth-child(4) { text-align: right; }
          .totals { border-top: 2px solid #000; padding-top: 8px; }
          .totals div { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .grand-total { font-size: 18px; font-weight: bold; border-top: 2px double #000; padding-top: 8px; margin-top: 8px; }
          .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; border-top: 1px dashed #ccc; padding-top: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>☕ CAFEVANIA GOURMET</h1>
          <p>Premium Dining Experience</p>
        </div>

        <div class="info">
          <div><span>Masa:</span><span>${order.tableNumber}</span></div>
          <div><span>Sifariş:</span><span>#${order.id.slice(0, 8)}</span></div>
          <div><span>Tarix:</span><span>${new Date().toLocaleDateString('az-AZ')}</span></div>
          <div><span>Ofisiant:</span><span>${order.server || '-'}</span></div>
        </div>
        <table>
          <thead><tr><th>Məhsul</th><th>Say</th><th>Qiymət</th><th>Cəmi</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="totals">
          <div><span>Ara Cəm:</span><span>₼${st.toFixed(2)}</span></div>
          <div><span>Vergi (${taxRate.value.toFixed(0)}%):</span><span>₼${tx.toFixed(2)}</span></div>
          ${sc > 0 ? `<div><span>Xidmət (${serviceChargeRate.value.toFixed(0)}%):</span><span>₼${sc.toFixed(2)}</span></div>` : ''}
          <div class="grand-total"><span>ÜMUMİ CƏM:</span><span>₼${gt.toFixed(2)}</span></div>
        </div>
        <div class="footer">
          <p>Təşəkkür edirik!</p>
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 300)
  }

  return {
    orders,
    selectedOrderId,
    selectedOrder,
    subtotal,
    tax,
    serviceCharge,
    grandTotal,
    activeOrderCount,
    tableStats,
    tableDetails,
    taxRate,

    serviceChargeRate,
    isLoading,
    error,
    activeNav,
    selectOrder,
    getStatusLabel,
    getStatusClasses,
    getOrderPaymentStatus,
    markAsPaid,
    updateOrderStatus,
    updateOrderNotes,
    deleteOrder,
    getTimeAgo,
    formatStartedAt,
    printBill,
    stopListening,
    updateTableStatus,
    updateTableCapacity,
    updateSettings,

    tableReservations,
    reserveTable,
    cancelReservation,
    transferOrder,
    createOrder
  }
}
