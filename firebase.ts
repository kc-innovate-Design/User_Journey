import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCdCjyVyBWAZbOEVhQ3OpT1JNlV8QOn9YY",
    authDomain: "user-journey-65d76.firebaseapp.com",
    projectId: "user-journey-65d76",
    storageBucket: "user-journey-65d76.firebasestorage.app",
    messagingSenderId: "952311205666",
    appId: "1:952311205666:web:1b0e7b4d7ca0b6a9995f7b",
    measurementId: "G-GB8Q8GQF85"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
