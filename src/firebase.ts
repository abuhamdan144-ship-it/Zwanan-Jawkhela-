import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase project verified in Firebase Console while signed in as hiapp144@gmail.com.
const firebaseConfig = {
  apiKey: 'AIzaSyCZYZeOF8oS9K-8hRqMsSrvBaCK9es6uWA',
  authDomain: 'data-1-d387e.firebaseapp.com',
  projectId: 'data-1-d387e',
  storageBucket: 'data-1-d387e.firebasestorage.app',
  messagingSenderId: '54009693633',
  appId: '1:54009693633:web:ea3626c01cc38d086c5b40',
  measurementId: 'G-694ER56E89',
};

export const firebaseApp = initializeApp(firebaseConfig);
import { getAuth } from "firebase/auth";
import { setLogLevel } from 'firebase/firestore';
setLogLevel('silent');
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
