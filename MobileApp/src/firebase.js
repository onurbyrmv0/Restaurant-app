// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCpas9pM99aFCmscoAgNGzLvg6er1n-pNU",
  authDomain: "restapp-675a7.firebaseapp.com",
  projectId: "restapp-675a7",
  storageBucket: "restapp-675a7.firebasestorage.app",
  messagingSenderId: "222600425746",
  appId: "1:222600425746:web:a48753945c355cc6e383cb",
  measurementId: "G-K0YWQ96DSD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db, analytics };