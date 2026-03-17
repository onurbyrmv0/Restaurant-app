
import { ref } from 'vue'
import { db } from '../firebase.js'
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

export function useReport() {
  const loading = ref(false)
  const error = ref(null)
  
  // Stats
  const totalRevenue = ref(0)
  const cashRevenue = ref(0)
  const cardRevenue = ref(0)
  const totalOrders = ref(0)
  const totalTips = ref(0)
  const hourlySales = ref([])
  const topItems = ref([])
  
  const dailyOrders = ref([])
  const outOfStockItems = ref([])
  const currentReportDate = ref(new Date())

  async function fetchDailyReport(date = new Date()) {
    loading.value = true
    error.value = null
    currentReportDate.value = new Date(date)
    
    try {
      // Start of day
      const startOfDay = new Date(currentReportDate.value)
      startOfDay.setHours(0, 0, 0, 0)
      
      // Fetch Out of Stock Items (Current status)
      const menuRef = collection(db, 'menuItems')
      const menuSnap = await getDocs(menuRef)
      outOfStockItems.value = menuSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => item.inStock === false)

      const ordersRef = collection(db, 'orders')
      
      // Fetch ALL orders sorted by date
      const q = query(
        ordersRef, 
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(q)
      const orders = []
      
      let revenue = 0
      let cashRev = 0
      let cardRev = 0
      let tips = 0
      
      const hours = Array(24).fill(0)
      const itemMap = {}

      snapshot.forEach(docSnap => {
        const data = docSnap.data()
        
        // --- Transaction-based Revenue Calculation ---
        // We look for ANY payment (partial or full) made on the TARGET date.
        if (Array.isArray(data.partialPayments)) {
          let orderContributionToday = 0
          let orderCashToday = 0
          let orderCardToday = 0
          let orderTipToday = 0
          let newestPaymentFound = null

          data.partialPayments.forEach(p => {
            const pDate = new Date(p.paidAt)
            if (pDate.toDateString() === startOfDay.toDateString()) {
              const pAmount = Number(p.amount) || 0
              const pTip = Number(p.tip) || 0
              
              orderContributionToday += pAmount
              orderTipToday += pTip
              
              if (p.method === 'card') orderCardToday += pAmount
              else orderCashToday += pAmount

              // Track hourly stats for this payment
              const hour = pDate.getHours()
              if (hour >= 0 && hour < 24) {
                hours[hour] += pAmount
              }
              
              newestPaymentFound = pDate
            }
          })

          if (orderContributionToday > 0 || orderTipToday > 0) {
            revenue += orderContributionToday
            cashRev += orderCashToday
            cardRev += orderCardToday
            tips += orderTipToday

            // For the Top Items chart, we typically count items from orders that had activity today
            if (Array.isArray(data.items)) {
              data.items.forEach(item => {
                const name = item.name
                const qty = Number(item.quantity ?? item.qty ?? 1)
                if (name) {
                  itemMap[name] = (itemMap[name] || 0) + qty
                }
              })
            }

            // Push to daily orders list for reporting UI
            orders.push({
              id: docSnap.id,
              ...data,
              // Use the special 'today' fields for the list view to show what happened Today
              total: orderContributionToday, 
              tipAmount: orderTipToday,
              displayDate: newestPaymentFound || startOfDay // Use for sorting/display
            })
          }
        }
      })
      
      const sortedItems = Object.entries(itemMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Sort display list by time
      orders.sort((a, b) => (b.displayDate || 0) - (a.displayDate || 0))

      dailyOrders.value = orders
      totalRevenue.value = revenue
      cashRevenue.value = cashRev
      cardRevenue.value = cardRev
      totalTips.value = tips
      totalOrders.value = orders.length
      hourlySales.value = hours
      topItems.value = sortedItems
      
    } catch (err) {
      console.error('Error fetching report:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function exportToExcel() {
    if (dailyOrders.value.length === 0) {
      alert('İxrac etmək üçün heç bir məlumat yoxdur.')
      return
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Günün Hesabatı')
    
    // Freeze header row
    worksheet.views = [ {state: 'frozen', xSplit: 0, ySplit: 1} ]

    // Page Setup (Fit to width)
    worksheet.pageSetup = { 
      orientation: 'landscape', 
      fitToPage: true, 
      fitToWidth: 1, 
      fitToHeight: 0,
      showGridLines: true,
      horizontalCentered: true,
      paperSize: 9 // A4
    }

    // Define columns
    worksheet.columns = [
      { header: 'Sifariş ID', key: 'id', width: 12 },
      { header: 'Masa', key: 'table', width: 8 },
      { header: 'Ofisiant', key: 'server', width: 15 },
      { header: 'Saat', key: 'time', width: 12 },
      { header: 'Məhsullar', key: 'items', width: 50 },
      { header: 'Sifariş Məbləği (AZN)', key: 'orderTotal', width: 18 },
      { header: 'Cəmi Daxil Olan', key: 'amount', width: 15 },
      { header: 'Nağd (₼)', key: 'cash', width: 12 },
      { header: 'Kart (₼)', key: 'card', width: 12 },
      { header: 'Status', key: 'status', width: 15 }
    ]

    // Style header row
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' } // Indigo color
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

    // Add data rows
    dailyOrders.value.forEach(order => {
      const itemsStr = (order.items || []).map(i => `${Number(i.quantity || i.qty || 1)}x ${i.name}`).join(', ')
      const isFull = ['paid', 'closed', 'completed'].includes(order.status)
      
      // Calculate breakdown for mixed payments *ONLY for Today*
      let cashPart = 0
      let cardPart = 0
      const reportDateStr = currentReportDate.value.toDateString()

      if (Array.isArray(order.partialPayments) && order.partialPayments.length > 0) {
        order.partialPayments.forEach(p => {
          const pDate = new Date(p.paidAt)
          if (pDate.toDateString() === reportDateStr) {
            const pAmount = Number(p.amount) || 0
            if (p.method === 'card') cardPart += pAmount
            else cashPart += pAmount
          }
        })
      } else {
        // Fallback for older orders without partialPayments array (rare now)
        const total = Number(order.total) || 0
        if (order.paymentMethod === 'card') cardPart = total
        else cashPart = total
      }
      
      worksheet.addRow({
        id: order.id.slice(0, 8),
        table: order.tableNumber || '-',
        server: order.server || order.waiterName || order.waiter || 'Naməlum',
        time: order.displayDate ? new Date(order.displayDate).toLocaleTimeString('az-AZ', {hour: '2-digit', minute:'2-digit'}) : '',
        items: itemsStr,
        orderTotal: Number((order.totalPrice || order.total || 0).toFixed(2)),
        amount: Number((cashPart + cardPart).toFixed(2)),
        cash: Number(cashPart.toFixed(2)),
        card: Number(cardPart.toFixed(2)),
        status: isFull ? 'TAM ÖDƏNİŞ' : 'HİSSƏVİ ÖDƏNİŞ'
      })
    })

    // Add Summary Row
    const summaryRow = worksheet.addRow({
      id: 'ÜMUMİ CƏMİ',
      amount: Number(totalRevenue.value.toFixed(2)),
      cash: Number(cashRevenue.value.toFixed(2)),
      card: Number(cardRevenue.value.toFixed(2))
    })

    // Style summary row
    summaryRow.font = { bold: true, size: 11 }
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E7FF' }
    }
    summaryRow.getCell('amount').numFmt = '#,##0.00 "₼"'
    summaryRow.getCell('cash').numFmt = '#,##0.00 "₼"'
    summaryRow.getCell('card').numFmt = '#,##0.00 "₼"'

    // Apply borders and formatting to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        }
        
        // Alignment
        if (colNumber >= 6 && colNumber <= 11) { // Numbers
          cell.alignment = { horizontal: 'right', vertical: 'middle' }
          if (rowNumber > 1) cell.numFmt = '#,##0.00'
        } else if (colNumber === 5) { // Items
          cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' }
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' }
        }
      })
    })

    // Write buffer and save
    const buffer = await workbook.xlsx.writeBuffer()
    const dateStr = new Date().toLocaleDateString('az-AZ').replace(/\//g, '-')
    saveAs(new Blob([buffer]), `Hesabat_${dateStr}.xlsx`)
  }

  return {
    loading,
    error,
    totalRevenue,
    cashRevenue,
    cardRevenue,
    totalTips,
    totalOrders,
    hourlySales,
    topItems,
    dailyOrders,
    outOfStockItems,
    fetchDailyReport,
    exportToExcel
  }
}
