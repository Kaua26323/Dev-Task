import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: "taskplus-75561.firebaseapp.com",
  projectId: "taskplus-75561",
  storageBucket: "taskplus-75561.firebasestorage.app",
  messagingSenderId: "884541256004",
  appId: "1:884541256004:web:355d8b289a947c1e2ea711"
};


const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

export { db };