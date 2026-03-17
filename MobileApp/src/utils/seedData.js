/**
 * Firestore-a ilkin dataları yükləyir (əgər boşdursa).
 * Bu script yalnız bir dəfə işləyir — kolleksiya artıq doludursa skip edir.
 */
import { collection, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

// ========================
// DATA CONSTANTS
// ========================

const INITIAL_TABLES = []
for (let i = 1; i <= 12; i++) {
  // Define capacity: 1-4 (2 pax), 5-8 (4 pax), 9-12 (6 pax)
  let capacity = 4
  if (i <= 4) capacity = 2
  else if (i > 8) capacity = 6

  INITIAL_TABLES.push({
    tableNumber: i,
    status: 'free',
    time: 0,
    capacity: capacity
  })
}


const INITIAL_USERS = [
  {
    nick: 'admin',
    password: '123',
    role: 'manager',
    createdAt: serverTimestamp(), // Bu sətir serverdə timestamp yaradacaq, amma array daxilində ehtiyatlı olmalıyıq.
                                  // seedCollection funksiyasında bu birbaşa Firestore-a gedir, ona görə sorun yoxdur.
  }
]

const INITIAL_SETTINGS = [
  {
    id: 'general',
    taxRate: 8,
    currency: 'USD'
  }
]

const INITIAL_CATEGORIES = [
  { id: 'breakfast', label: 'Səhər yeməyi', order: 1 },
  { id: 'lunch',     label: 'Nahar',        order: 2 },
  { id: 'dinner',    label: 'Şam yeməyi',   order: 3 },
  { id: 'drinks',    label: 'İçkilər',      order: 4 },
]

const INITIAL_MENU_ITEMS = [
  // Breakfast
  {
    name: 'Fluffy Pancakes',
    description: 'Maple syrup & berries',
    price: 12.50,
    categoryId: 'breakfast',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB90x9MNMy3AP486U034kVKhGe7IXTM-Tb_6z7xjZ9vtyNO-8OCqToGDWGT_d1qOcQ7P8l7MEzVaLCsoXcOs-TkBnMFwMJAkIcMQBjzUzDZj9GlTo_McEm2K5FCPofASZ1e9O9cLTD1XIXGmWE6JhZ0zfwnfzLsrQ7vC-h2ZQ7BQzUOvMxC5spjKUNWZO6f6SG863_EWg8lociNBaXiXlml0zoVrWUPB_w9Jwh2ayfURW8InxOCio_AgijsmvtRGDKBhT0v_TY8JbsF',
  },
  {
    name: 'Avocado Toast',
    description: 'Poached egg & sourdough',
    price: 14.00,
    categoryId: 'breakfast',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHGiVFfjlBXSd8XhXQveLiZivi_4PrFPlHc7g0zLYUG6QB8Brj8R9z0vc0F4y8ytbabd5BCaP65Uq-LUXQykiOfyqybBkTdTP34m0Xz3K2VfkG4R8FAi9I_OIeFYNUYL_fxEx2Bcob-iqkoflmMlqQDsnAtbrmeR0ZWPw9C9KE4GsBXeKbtXMvlWarKTQcBJGtAyNebGdbiL-E6ORT2g2Z0VpLCyiNvzJh7O_AJApuSHR3jKmSMcPNY9FpPWYR9l8RtfzZd7TPsaM2',
  },
  {
    name: 'French Omelette',
    description: 'Fresh herbs & cheese',
    price: 11.20,
    categoryId: 'breakfast',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkHfpghqjHbRpAChIrERtM5eNP8FwsinLccwMSAMtoodgFsuOXt3vfe5k_AHf72f_Du-ULCj4Ft-9C6j1UTUNamt6rz0q8fMvd3qW-lKpX4o8nboaiv9giGjvffHhjAsM_uzLQOjYWFCGvURVSSoLitHtRmVMVvnDkOEFSXxbBYzT6gOQFA9UJi1q9a9ZGge8hUs7B-49LunN5TYFqQcZvVHfFDIHoyoxh9oHEQyNkPZ5WXMLIJC0ObUJEo6nNEdts3SpigvU8CsX_',
  },
  {
    name: 'Acaí Super Bowl',
    description: 'Granola, banana & honey',
    price: 13.50,
    categoryId: 'breakfast',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPjKW8zhvnrc3exD5VDxWiSeabQOAu3M1wrM6a0kB-lk3WkCt2HZ8kTZrGWHYUykMAI5jqh8N5BWkeMIXC6bB-cFcN8xEqk6-GN7p5B6Fy4WPLt-wFzSMxc8B3l1L3HThBmcHC-MUZIAjh2clH57Uu665NfmIu5pHpefn34DVNOTuzBLY6giWHCQyQ4tzMIu9hxraovIzkDGPNDNox_lIpeD2qo4_P4YLzEovoY5a9nwt7KqNuGaFBj7CeT9uwardHoW8o6AQW_qY2',
  },
  {
    name: 'Breakfast Muffin',
    description: 'Sausage, egg & cheese',
    price: 8.90,
    categoryId: 'breakfast',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_OCKK-Vu7tGyW_kEUpBMBRw8M4CNyuWPTnhUeXYRxezvVJuP6pDE89IsA5cdkYQzDGc1itArB9gp9sCyoA9XruJAfSQxSO2xPPtkyGnPaOpcQe9Rg67IMj_-p6VkccnD0xa_E52ztYqpXQMCraOZL0EnRgX7KjVkMF3jFjiklBhkJr6axajTKTJKmqhOV-C4LR8wsrJ68sBni--c4C89SiXk28hatQUx0i83gBcU-6j0qMmB6roviyiz5ZNi25QWitccmOvjQHUGC',
  },
  // Lunch
  {
    name: 'Truffle Burger',
    description: 'Beef patty, truffle oil, swiss cheese',
    price: 18.00,
    categoryId: 'lunch',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB90x9MNMy3AP486U034kVKhGe7IXTM-Tb_6z7xjZ9vtyNO-8OCqToGDWGT_d1qOcQ7P8l7MEzVaLCsoXcOs-TkBnMFwMJAkIcMQBjzUzDZj9GlTo_McEm2K5FCPofASZ1e9O9cLTD1XIXGmWE6JhZ0zfwnfzLsrQ7vC-h2ZQ7BQzUOvMxC5spjKUNWZO6f6SG863_EWg8lociNBaXiXlml0zoVrWUPB_w9Jwh2ayfURW8InxOCio_AgijsmvtRGDKBhT0v_TY8JbsF',
  },
  {
    name: 'Classic Fries',
    description: 'Sea salt and rosemary',
    price: 6.50,
    categoryId: 'lunch',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHGiVFfjlBXSd8XhXQveLiZivi_4PrFPlHc7g0zLYUG6QB8Brj8R9z0vc0F4y8ytbabd5BCaP65Uq-LUXQykiOfyqybBkTdTP34m0Xz3K2VfkG4R8FAi9I_OIeFYNUYL_fxEx2Bcob-iqkoflmMlqQDsnAtbrmeR0ZWPw9C9KE4GsBXeKbtXMvlWarKTQcBJGtAyNebGdbiL-E6ORT2g2Z0VpLCyiNvzJh7O_AJApuSHR3jKmSMcPNY9FpPWYR9l8RtfzZd7TPsaM2',
  },
  {
    name: 'Caesar Salad',
    description: 'Romaine, croutons, parmesan',
    price: 12.00,
    categoryId: 'lunch',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkHfpghqjHbRpAChIrERtM5eNP8FwsinLccwMSAMtoodgFsuOXt3vfe5k_AHf72f_Du-ULCj4Ft-9C6j1UTUNamt6rz0q8fMvd3qW-lKpX4o8nboaiv9giGjvffHhjAsM_uzLQOjYWFCGvURVSSoLitHtRmVMVvnDkOEFSXxbBYzT6gOQFA9UJi1q9a9ZGge8hUs7B-49LunN5TYFqQcZvVHfFDIHoyoxh9oHEQyNkPZ5WXMLIJC0ObUJEo6nNEdts3SpigvU8CsX_',
  },
  // Dinner
  {
    name: 'Grilled Salmon',
    description: 'Lemon butter, asparagus',
    price: 24.00,
    categoryId: 'dinner',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPjKW8zhvnrc3exD5VDxWiSeabQOAu3M1wrM6a0kB-lk3WkCt2HZ8kTZrGWHYUykMAI5jqh8N5BWkeMIXC6bB-cFcN8xEqk6-GN7p5B6Fy4WPLt-wFzSMxc8B3l1L3HThBmcHC-MUZIAjh2clH57Uu665NfmIu5pHpefn34DVNOTuzBLY6giWHCQyQ4tzMIu9hxraovIzkDGPNDNox_lIpeD2qo4_P4YLzEovoY5a9nwt7KqNuGaFBj7CeT9uwardHoW8o6AQW_qY2',
  },
  {
    name: 'Ribeye Steak',
    description: '300g, medium rare, garlic butter',
    price: 32.00,
    categoryId: 'dinner',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_OCKK-Vu7tGyW_kEUpBMBRw8M4CNyuWPTnhUeXYRxezvVJuP6pDE89IsA5cdkYQzDGc1itArB9gp9sCyoA9XruJAfSQxSO2xPPtkyGnPaOpcQe9Rg67IMj_-p6VkccnD0xa_E52ztYqpXQMCraOZL0EnRgX7KjVkMF3jFjiklBhkJr6axajTKTJKmqhOV-C4LR8wsrJ68sBni--c4C89SiXk28hatQUx0i83gBcU-6j0qMmB6roviyiz5ZNi25QWitccmOvjQHUGC',
  },
  // Drinks
  {
    name: 'Coke Zero',
    description: '330ml',
    price: 3.00,
    categoryId: 'drinks',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB90x9MNMy3AP486U034kVKhGe7IXTM-Tb_6z7xjZ9vtyNO-8OCqToGDWGT_d1qOcQ7P8l7MEzVaLCsoXcOs-TkBnMFwMJAkIcMQBjzUzDZj9GlTo_McEm2K5FCPofASZ1e9O9cLTD1XIXGmWE6JhZ0zfwnfzLsrQ7vC-h2ZQ7BQzUOvMxC5spjKUNWZO6f6SG863_EWg8lociNBaXiXlml0zoVrWUPB_w9Jwh2ayfURW8InxOCio_AgijsmvtRGDKBhT0v_TY8JbsF',
  },
  {
    name: 'Fresh Lemonade',
    description: 'Mint & lime',
    price: 5.50,
    categoryId: 'drinks',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHGiVFfjlBXSd8XhXQveLiZivi_4PrFPlHc7g0zLYUG6QB8Brj8R9z0vc0F4y8ytbabd5BCaP65Uq-LUXQykiOfyqybBkTdTP34m0Xz3K2VfkG4R8FAi9I_OIeFYNUYL_fxEx2Bcob-iqkoflmMlqQDsnAtbrmeR0ZWPw9C9KE4GsBXeKbtXMvlWarKTQcBJGtAyNebGdbiL-E6ORT2g2Z0VpLCyiNvzJh7O_AJApuSHR3jKmSMcPNY9FpPWYR9l8RtfzZd7TPsaM2',
  },
  {
    name: 'Espresso',
    description: 'Double shot',
    price: 4.00,
    categoryId: 'drinks',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkHfpghqjHbRpAChIrERtM5eNP8FwsinLccwMSAMtoodgFsuOXt3vfe5k_AHf72f_Du-ULCj4Ft-9C6j1UTUNamt6rz0q8fMvd3qW-lKpX4o8nboaiv9giGjvffHhjAsM_uzLQOjYWFCGvURVSSoLitHtRmVMVvnDkOEFSXxbBYzT6gOQFA9UJi1q9a9ZGge8hUs7B-49LunN5TYFqQcZvVHfFDIHoyoxh9oHEQyNkPZ5WXMLIJC0ObUJEo6nNEdts3SpigvU8CsX_',
  },
]

// ========================
// HELPER FUNCTIONS
// ========================

/**
 * Kolleksiyanı yoxla: boşdursa seed et.
 */
async function seedCollection(collName, items, idField) {
  const snap = await getDocs(collection(db, collName))
  if (snap.size > 0) {
    console.log(`✓ '${collName}' artıq mövcuddur (${snap.size} sənəd). Skip edilir.`)
    return
  }

  const batch = writeBatch(db)
  items.forEach((item, idx) => {
    // idField varsa onu doc ID kimi istifadə et, yoxsa auto
    const docId = idField ? String(item[idField]) : `item_${idx}`
    const ref = doc(db, collName, docId)
    // Əgər item içində serverTimestamp varsa, batch üçün uyğundur
    batch.set(ref, item)
  })
  await batch.commit()
  console.log(`✓ '${collName}' kolleksiyasına ${items.length} sənəd yazıldı.`)
}

// ========================
// MAIN EXPORT
// ========================

/**
 * Bütün ilkin dataları Firestore-a yüklə.
 */
export async function seedFirestore() {
  try {
    console.log('🔄 Firestore seed başladı...')
    
    // 1. Masalar
    await seedCollection('tables', INITIAL_TABLES, 'tableNumber')
    
    // 2. İstifadəçilər (Nick sahəsini ID kimi istifadə edə bilərik və ya auto-id)
    // users üçün xüsusi yoxlayırıq, çünki seedCollection funksiyamız generic istifadə üçün sadədir
    const usersSnap = await getDocs(collection(db, 'users'))
    if (usersSnap.empty) {
       const batch = writeBatch(db)
       INITIAL_USERS.forEach((u) => {
         const ref = doc(collection(db, 'users')) // Auto ID
         batch.set(ref, u)
       })
       await batch.commit()
       console.log("✓ 'users' yaradıldı (admin).")
    }

    // 3. Ayarlar
    await seedCollection('settings', INITIAL_SETTINGS, 'id')

    // 4. Menu
    await seedCollection('categories', INITIAL_CATEGORIES, 'id')
    await seedCollection('menuItems', INITIAL_MENU_ITEMS, null)
    
    console.log('✅ Firestore seed tamamlandı!')
  } catch (err) {
    console.error('❌ Firestore seed xətası:', err)
  }
}
