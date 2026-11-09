import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* ====== الصق هنا الـ firebaseConfig بتاعك (انسخه من Firebase بالزرار، متكتبوش بإيدك) ====== */
const firebaseConfig = {
  apiKey: "AIzaSyBOHgDV17U63O5JNtw06G1-UInA23CmpoQ",
  authDomain: "menasa-b01d7.firebaseapp.com",
  projectId: "menasa-b01d7",
  storageBucket: "menasa-b01d7.firebasestorage.app",
  messagingSenderId: "824176482583",
  appId: "1:824176482583:web:71165ac9fe710462ecff52"
};
/* ======================================================================================= */

if (firebaseConfig.apiKey.includes('الصق')) {
  console.error('لسه ما حطيتش الـ apiKey في js/firebase.js');
}

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
