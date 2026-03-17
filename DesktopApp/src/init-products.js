
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCpas9pM99aFCmscoAgNGzLvg6er1n-pNU",
  authDomain: "restapp-675a7.firebaseapp.com",
  projectId: "restapp-675a7",
  storageBucket: "restapp-675a7.firebasestorage.app",
  messagingSenderId: "222600425746",
  appId: "1:222600425746:web:a48753945c355cc6e383cb",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const menuCategories = [
  {
    name: 'Səhər Yeməkləri',
    items: [
      { name: 'Fluffy Pancakes', description: 'Maple syrup & berries', price: 12.50 },
      { name: 'Avocado Toast', description: 'Poached egg & sourdough', price: 14.00 },
      { name: 'Classic Eggs Benedict', description: 'Hollandaise sauce', price: 15.00 },
    ]
  },
  {
    name: 'Əsas Yeməklər',
    items: [
      { name: 'Classic Wagyu Burger', description: 'Medium Rare', price: 24.00 },
      { name: 'Grilled Salmon Fillet', description: 'Lemon butter sauce', price: 22.00 },
      { name: 'Ribeye Steak', description: 'Medium', price: 28.00 },
      { name: 'Margherita Pizza', description: 'Fresh mozzarella', price: 15.00 },
      { name: 'Caesar Salad', description: 'Parmesan & croutons', price: 11.50 },
    ]
  },
  {
    name: 'Garnir',
    items: [
      { name: 'Truffle Parmesan Fries', description: '', price: 12.50 },
    ]
  },
  {
    name: 'İçkilər',
    items: [
      { name: 'Craft IPA - House Draft', description: '', price: 9.00 },
      { name: 'Red Wine - House Selection', description: '', price: 5.00 },
      { name: 'Flat White Coffee', description: '', price: 5.00 },
      { name: 'Sparkling Water', description: '', price: 4.50 },
      { name: 'Fresh Orange Juice', description: '', price: 3.00 },
      { name: 'Iced Lemon Tea', description: 'No Sugar', price: 6.00 },
    ]
  },
  {
    name: 'Desertlər',
    items: [
      { name: 'Chocolate Lava Cake', description: '', price: 8.00 },
      { name: 'Tiramisu', description: '', price: 6.70 },
    ]
  },
]

async function initProducts() {
  try {
    const productsRef = collection(db, 'products')
    
    for (const cat of menuCategories) {
      for (const item of cat.items) {
        await addDoc(productsRef, {
          name: item.name,
          category: cat.name,
          description: item.description,
          price: item.price,
          createdAt: serverTimestamp()
        })
        console.log(`Added: ${item.name}`)
      }
    }
    
    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

initProducts()
