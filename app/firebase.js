// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAqaCO9qa9jtw-6eSw1UncXFnDZyvPak_E",
  authDomain: "htninsurance-1eb5a.firebaseapp.com",
  projectId: "htninsurance-1eb5a",
  storageBucket: "htninsurance-1eb5a.firebasestorage.app",
  messagingSenderId: "867023282258",
  appId: "1:867023282258:web:699ec7b53af545dc09ff8b",
  measurementId: "G-1CC0J27G49"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

