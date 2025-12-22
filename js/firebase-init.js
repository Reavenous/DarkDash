import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    serverTimestamp,
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// KONFIGURACE (Tvoje originální)
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

// Elementy
const authModalEl = document.getElementById('authModal');
let authModal; // Instance modalu

// --- 1. FUNKCE PŘIHLAŠOVÁNÍ ---

// Email Registrace
window.handleEmailRegister = async () => {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPass').value;
    const errEl = document.getElementById('authError');
    try {
        await createUserWithEmailAndPassword(auth, email, pass);
        // Modal se zavře automaticky díky onAuthStateChanged
    } catch (error) {
        if(errEl) { errEl.innerText = error.message; errEl.classList.remove('d-none'); }
    }
};

// Email Login
window.handleEmailLogin = async () => {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPass').value;
    const errEl = document.getElementById('authError');
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        if(errEl) { errEl.innerText = "Chybné údaje nebo neexistující účet!"; errEl.classList.remove('d-none'); }
    }
};

// Google Login
window.loginGoogle = async () => {
    try { await signInWithPopup(auth, provider); } catch (e) { alert(e.message); }
};

// Logout
window.logout = async () => {
    try { 
        await signOut(auth); 
        location.reload(); // Refresh stránky pro vyčištění paměti
    } catch (e) { console.error(e); }
};

// --- 2. SLEDOVÁNÍ STAVU (Login/Logout) ---

onAuthStateChanged(auth, async (user) => {
    // Zavřít modal pokud je otevřený
    const modalEl = document.getElementById('authModal');
    if(modalEl && window.bootstrap) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if(modal) modal.hide();
    }

    const loginBtn = document.getElementById('loginBtn');
    const userDisplay = document.getElementById('userDisplay');

    if (user) {
        // == PŘIHLÁŠEN ==
        window.currentUserUID = user.uid;
        console.log("Přihlášen:", user.email);

        // Změna tlačítka na "Odhlásit"
        if(loginBtn) loginBtn.innerHTML = `<button onclick="logout()" class="btn btn-outline-danger w-100 btn-sm">ODHLÁSIT SE</button>`;
        
        // Zobrazení jména
        let displayName = user.displayName || user.email.split('@')[0];
        let photo = user.photoURL || 'assets/icons/dreams.png'; // Fallback ikona
        if(userDisplay) userDisplay.innerHTML = `
            <img src="${photo}" class="rounded-circle border border-warning me-2" width="30">
            <span class="text-warning small">${displayName}</span>
        `;

        // Uložit uživatele do DB (aby byl vidět v chatu)
        await setDoc(doc(db, "users", user.uid), {
            name: displayName,
            photo: photo,
            lastActive: serverTimestamp()
        }, { merge: true });

        // STÁHNOUT DATA Z CLOUDU
        await loadCloudData(user.uid);

    } else {
        // == ODHLÁŠEN ==
        window.currentUserUID = null;
        if(loginBtn) loginBtn.innerHTML = `
            <button onclick="openModal('authModal')" class="btn btn-outline-warning w-100 fw-bold">
                <i class="fas fa-sign-in-alt me-2"></i> PŘIHLÁSIT SE
            </button>`;
        if(userDisplay) userDisplay.innerHTML = "";
    }

    // Signál pro ostatní skripty (Todo, Fitness...), aby se překreslily
    document.dispatchEvent(new Event("darkdash-reload"));
});

// --- 3. SYNCHRONIZACE DAT (CLOUD) ---

// Funkce: Uložit data do Cloudu (volá se z todo.js, fitness.js atd.)
window.saveToCloud = async (moduleName, data) => {
    if (!window.currentUserUID) return; // Pokud není login, neukládáme do cloudu

    try {
        await setDoc(doc(db, "users", window.currentUserUID, "appData", moduleName), {
            data: data,
            lastUpdated: serverTimestamp()
        });
        console.log(`Cloud uloženo: ${moduleName}`);
    } catch (e) {
        console.error(`Chyba ukládání ${moduleName}:`, e);
    }
};

// Funkce: Stáhnout data z Cloudu (volá se automaticky po loginu)
async function loadCloudData(uid) {
    // Seznam všech modulů, které chceme synchronizovat
    const modules = ['todos', 'fitness-v2', 'journal', 'notes', 'links', 'recipes', 'dreams', 'countdowns', 'events'];
    
    for (const mod of modules) {
        try {
            // POZOR: fitness ukládáme jako 'fitness', ale v localStorage je 'fitness-v2'. Ošetříme to:
            let dbName = mod;
            if (mod === 'fitness-v2') dbName = 'fitness'; 

            const docSnap = await getDoc(doc(db, "users", uid, "appData", dbName));
            if (docSnap.exists()) {
                const cloudData = docSnap.data().data;
                
                // Uložíme do localStorage pod USER klíčem
                localStorage.setItem(`user_${uid}_darkdash-${mod}`, JSON.stringify(cloudData));
            }
        } catch (e) {
            console.error(`Chyba načítání ${mod}:`, e);
        }
    }
    // Znovu překreslit aplikace s novými daty
    document.dispatchEvent(new Event("darkdash-reload"));
}

// --- 4. CHAT (Zůstává stejný) ---
const chatInput = document.getElementById('chatInput');
window.sendMessage = async () => {
    const text = chatInput.value.trim();
    if (!text || !auth.currentUser) return;
    try {
        await addDoc(collection(db, "messages"), {
            text: text,
            user: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
            photo: auth.currentUser.photoURL || 'assets/icons/dreams.png',
            uid: auth.currentUser.uid,
            timestamp: serverTimestamp()
        });
        chatInput.value = "";
    } catch (e) { console.error(e); }
};
if(chatInput) chatInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
// (Zbytek chatu se načítá přes onSnapshot výše v kódu, který už tam máš, nebo si ho sem můžeš zkopírovat z minula)