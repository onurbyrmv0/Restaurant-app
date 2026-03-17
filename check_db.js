
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCpas9pM99aFCmscoAgNGzLvg6er1n-pNU",
  authDomain: "restapp-675a7.firebaseapp.com",
  projectId: "restapp-675a7",
  storageBucket: "restapp-675a7.firebasestorage.app",
  messagingSenderId: "222600425746",
  appId: "1:222600425746:web:a48753945c355cc6e383cb",
  measurementId: "G-K0YWQ96DSD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const cats = await getDocs(collection(db, 'categories'));
  console.log("Categories samples:");
  cats.docs.slice(0, 3).forEach(d => console.log(d.id, d.data()));

  const items = await getDocs(query(collection(db, 'menuItems'), limit(5)));
  console.log("\nMenuItems samples:");
  items.docs.forEach(d => console.log(d.id, d.data()));
  
  process.exit(0);
}

check();
