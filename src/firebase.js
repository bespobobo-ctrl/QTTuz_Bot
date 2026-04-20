import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAsaHRcl_peeIVjmItexaBt3NnGkJqGaBg",
    authDomain: "qttuz-df432.firebaseapp.com",
    projectId: "qttuz-df432",
    storageBucket: "qttuz-df432.firebasestorage.app",
    messagingSenderId: "775390146553",
    appId: "1:775390146553:web:c17f29503feabb5f7b5728",
    measurementId: "G-T01JW9DPFC"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
