
import { initializeApp } from 'firebase/app'
import { getFirestore, listCollections, collection, getDocs } from 'firebase/firestore'

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

async function inspectDb() {
  try {
    // Kök kolleksiyaları birbaşa client SDK ilə listələmək olmur (admin SDK lazımdır).
    // Ona görə ehtimal olunan adları yoxlayacağıq.
    const collectionsToCheck = ['settings', 'config', 'constants', 'restaurant', 'info']
    
    for (const colName of collectionsToCheck) {
      console.log(`Checking collection: ${colName}...`)
      const snapshot = await getDocs(collection(db, colName))
      if (!snapshot.empty) {
        console.log(`FOUND '${colName}' with ${snapshot.size} docs:`)
        snapshot.forEach(doc => {
          console.log(doc.id, '=>', JSON.stringify(doc.data(), null, 2))
        })
      } else {
        console.log(`'${colName}' is empty or not found.`)
      }
    }
    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

inspectDb()
