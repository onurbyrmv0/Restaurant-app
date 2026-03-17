
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'

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

async function checkProducts() {
  try {
    const productsRef = collection(db, 'products')
    const snapshot = await getDocs(productsRef)
    
    if (snapshot.empty) {
      console.log('PRODUCTS_EMPTY')
    } else {
      console.log(`PRODUCTS_FOUND: ${snapshot.size} items`)
      snapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data().name)
      })
    }
    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

checkProducts()
