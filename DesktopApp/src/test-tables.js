
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, limit } from 'firebase/firestore'
import * as fs from 'fs'

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

async function checkTables() {
  try {
    const snapshot = await getDocs(collection(db, 'tables'), limit(3))
    
    if (snapshot.empty) {
      console.log('TABLES_COLLECTION_EMPTY')
    } else {
      const tables = []
      snapshot.forEach(doc => tables.push({ id: doc.id, ...doc.data() }))
      console.log('TABLES_FOUND:', JSON.stringify(tables, null, 2))
    }
    process.exit(0)
  } catch (err) {
    console.error('ERROR:', err.message)
    process.exit(1)
  }
}

checkTables()
