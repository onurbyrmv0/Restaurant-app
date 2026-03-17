
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, limit, query, orderBy } from 'firebase/firestore'
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

async function inspectOrders() {
  try {
    // Son 3 sənədi oxu ki, yeni strukturu görək
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(3))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      console.log('EMPTY')
      process.exit(0)
    }
    
    const results = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      // Timestamp obyektlərini sadə tarixi çevirmək
      if (data.createdAt && data.createdAt.toDate) {
        data.createdAt_ISO = data.createdAt.toDate().toISOString()
      }
      results.push({ _id: doc.id, ...data })
    })
    
    fs.writeFileSync('db_new_structure.json', JSON.stringify(results, null, 2))
    console.log('DONE: ' + results.length + ' docs written to db_new_structure.json')
    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

inspectOrders()
