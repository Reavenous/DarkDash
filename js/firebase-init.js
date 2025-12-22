// js/firebase-init.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// KONFIGURACE
const firebaseConfig = {
  apiKey: "AIzaSyDgKKxcbDuoC18Mc7DfBLPa1LZiBUzJ97o",
  authDomain: "darkdash-d846e.firebaseapp.com",
  projectId: "darkdash-d846e",
  storageBucket: "darkdash-d846e.firebasestorage.app",
  messagingSenderId: "995619847218",
  appId: "1:995619847218:web:1c341e4940def680b1502b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ELEMENTY
const loginBtn = document.getElementById('loginBtn');
const userDisplay = document.getElementById('userDisplay');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const usersListEl = document.getElementById('usersList');
const chatListEl = document.getElementById('chatMessages');

// --- PŘIHLAŠOVÁNÍ ---

window.loginGoogle = async () => {
    try { await signInWithPopup(auth, provider); } 
    catch (e) { alert("Chyba: " + e.message); }
};

window.logoutGoogle = async () => {
    try { await signOut(auth); } 
    catch (e) { console.error(e); }
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // 1. UI Změny
        loginBtn.innerHTML = `<button onclick="logoutGoogle()" class="btn btn-outline-danger btn-sm">Odpojit</button>`;
        userDisplay.innerHTML = `<img src="${user.photoURL}" class="rounded-circle border border-warning" width="30" title="${user.displayName}">`;
        
        if(chatInput) {
            chatInput.disabled = false;
            sendBtn.disabled = false;
            chatInput.placeholder = "Napiš zprávu...";
        }

        // 2. ULOŽIT UŽIVATELE DO DATABÁZE (Aby byl vidět v seznamu)
        await setDoc(doc(db, "users", user.uid), {
            name: user.displayName,
            photo: user.photoURL,
            lastActive: serverTimestamp()
        });

    } else {
        loginBtn.innerHTML = `<button onclick="loginGoogle()" class="btn btn-warning btn-sm fw-bold"><i class="fab fa-google me-2"></i>Login</button>`;
        userDisplay.innerHTML = "";
        if(chatInput) {
            chatInput.disabled = true;
            sendBtn.disabled = true;
            chatInput.placeholder = "Pro vstup do sítě se přihlas...";
        }
    }
});

// --- CHAT LOGIKA ---

// Odeslání
window.sendMessage = async () => {
    const text = chatInput.value.trim();
    if (!text || !auth.currentUser) return;

    try {
        await addDoc(collection(db, "messages"), {
            text: text,
            user: auth.currentUser.displayName,
            photo: auth.currentUser.photoURL,
            uid: auth.currentUser.uid,
            timestamp: serverTimestamp()
        });
        chatInput.value = "";
    } catch (e) { console.error(e); }
};

// Enter odesílá
if(chatInput) {
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });
}

// --- NASLOUCHÁNÍ ZPRÁVÁM (Real-time) ---
const qMsg = query(collection(db, "messages"), orderBy("timestamp", "asc"), limit(50));
onSnapshot(qMsg, (snapshot) => {
    if (!chatListEl) return;
    chatListEl.innerHTML = "";
    
    snapshot.forEach((doc) => {
        const msg = doc.data();
        const isMe = auth.currentUser && msg.uid === auth.currentUser.uid;
        
        // Formát času
        let timeStr = "";
        if(msg.timestamp) {
            const date = msg.timestamp.toDate();
            timeStr = date.getHours() + ":" + String(date.getMinutes()).padStart(2, '0');
        }

        const html = `
            <div class="d-flex flex-column ${isMe ? 'align-items-end' : 'align-items-start'}">
                <div class="msg-bubble ${isMe ? 'me' : ''}">
                    ${!isMe ? `<div class="msg-author text-truncate">${msg.user}</div>` : ''}
                    <div>${msg.text}</div>
                    <div class="msg-time">${timeStr}</div>
                </div>
            </div>
        `;
        chatListEl.insertAdjacentHTML('beforeend', html);
    });
    chatListEl.scrollTop = chatListEl.scrollHeight;
});

// --- NASLOUCHÁNÍ UŽIVATELŮM (Levý sloupec) ---
const qUsers = query(collection(db, "users"), limit(20));
onSnapshot(qUsers, (snapshot) => {
    if (!usersListEl) return;
    usersListEl.innerHTML = "";

    snapshot.forEach((doc) => {
        const u = doc.data();
        const html = `
            <div class="user-item d-flex align-items-center gap-3 p-2 mb-1">
                <div class="position-relative">
                    <img src="${u.photo}" class="rounded-circle" width="40" height="40">
                    <span class="position-absolute bottom-0 start-100 translate-middle p-1 bg-success border border-dark rounded-circle"></span>
                </div>
                <div class="overflow-hidden">
                    <div class="text-white brand-font small text-truncate">${u.name}</div>
                    <small class="text-muted" style="font-size: 0.7rem;">Agent Online</small>
                </div>
            </div>
        `;
        usersListEl.insertAdjacentHTML('beforeend', html);
    });
});