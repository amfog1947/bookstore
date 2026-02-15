import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBnvordNWFN8ub8TqP6eNnnYOstZBXBoP8",
  authDomain: "aryannew-9fac8.firebaseapp.com",
  projectId: "aryannew-9fac8",
  storageBucket: "aryannew-9fac8.firebasestorage.app",
  messagingSenderId: "612131444156",
  appId: "1:612131444156:web:90a5253496c2ac7610c7b9",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
