import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
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
    // Desktop elementy
    const loginBtn = document.getElementById('loginBtn');
    const userDisplay = document.getElementById('userDisplay');
    
    // Mobilní elementy
    const mobileLoginContainer = document.getElementById('mobileLoginContainer');
    const mobileUserDisplay = document.getElementById('mobileUserDisplay');

    // Chat elementy
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');

    if (user) {
        // == PŘIHLÁŠEN ==
        window.currentUserUID = user.uid;
        
        // Uložíme si globálně info pro gamifikaci (Jméno a Fotka)
        window.currentUserName = user.displayName;
        window.currentUserPhoto = user.photoURL;

        // 1. Desktop UI
        if(loginBtn) loginBtn.innerHTML = `<button onclick="logout()" class="btn btn-outline-danger btn-sm w-100">Odpojit</button>`;
        
        // 2. Mobil UI
        if(mobileLoginContainer) mobileLoginContainer.innerHTML = `<button onclick="logout()" class="btn btn-outline-danger w-100 fw-bold">Odpojit</button>`;

        // 3. Vykreslit RPG Profil (pokud je skript načtený)
        if(window.renderProfileHUD) window.renderProfileHUD();

        // 4. Chat povolení
        if(chatInput) {
            chatInput.disabled = false;
            sendBtn.disabled = false;
            chatInput.placeholder = "Napiš zprávu...";
        }

        // 5. Uložit uživatele do DB (pro chat seznam)
        await setDoc(doc(db, "users", user.uid), {
            name: user.displayName,
            photo: user.photoURL,
            lastActive: serverTimestamp()
        }, { merge: true });

        // 6. Stáhnout data z Cloudu
        await loadCloudData(user.uid);

    } else {
        // == ODHLÁŠEN ==
        window.currentUserUID = null;
        
        // 1. Desktop UI
        if(loginBtn) loginBtn.innerHTML = `<button onclick="openModal('authModal')" class="btn btn-warning btn-sm fw-bold"><i class="fas fa-sign-in-alt me-2"></i>Login</button>`;
        if(userDisplay) userDisplay.innerHTML = "";

        // 2. Mobil UI
        if(mobileLoginContainer) mobileLoginContainer.innerHTML = `
            <button onclick="openModal('authModal')" class="btn btn-warning w-100 fw-bold">
                <i class="fas fa-sign-in-alt me-2"></i> PŘIHLÁSIT SE
            </button>`;
        if(mobileUserDisplay) mobileUserDisplay.innerHTML = "";

        // 3. Chat zákaz
        if(chatInput) {
            chatInput.disabled = true;
            sendBtn.disabled = true;
            chatInput.placeholder = "Pro vstup do sítě se přihlas...";
        }
    }
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
    // Seznam modulů vč. gamifikace
    const modules = ['todos', 'fitness-v2', 'journal', 'notes', 'links', 'recipes', 'dreams', 'countdowns', 'events', 'gamification'];
    
    for (const mod of modules) {
        try {
            // Fix pro fitness (v DB jako fitness, v local jako fitness-v2)
            let dbName = mod;
            if (mod === 'fitness-v2') dbName = 'fitness'; 

            const docSnap = await getDoc(doc(db, "users", uid, "appData", dbName));
            if (docSnap.exists()) {
                const cloudData = docSnap.data().data;
                
                // Specialita pro Gamifikaci - rovnou načíst do paměti
                if (mod === 'gamification' && window.loadStats) {
                    window.loadStats(cloudData);
                }

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

// --- 4. NASTAVENÍ PROFILU (Avatar & Nick) ---

window.saveUserProfile = async () => {
    const nick = document.getElementById('profileNick').value;
    const avatar = document.getElementById('profileAvatar').value;
    
    if (!auth.currentUser) return;

    try {
        // 1. Update ve Firebase Auth (oficiální profil)
        await updateProfile(auth.currentUser, {
            displayName: nick || auth.currentUser.displayName,
            photoURL: avatar || auth.currentUser.photoURL
        });

        // 2. Update v DB (pro chat a ostatní)
        await setDoc(doc(db, "users", auth.currentUser.uid), {
            name: nick || auth.currentUser.displayName,
            photo: avatar || auth.currentUser.photoURL,
            lastActive: serverTimestamp()
        }, { merge: true });

        // 3. Update lokálně
        window.currentUserName = nick || auth.currentUser.displayName;
        window.currentUserPhoto = avatar || auth.currentUser.photoURL;
        
        // 4. Překreslit HUD (profil vedle loginu)
        if(window.renderProfileHUD) window.renderProfileHUD();
        
        // Zavřít modal
        const modalEl = document.getElementById('profileModal');
        if(modalEl && window.bootstrap) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if(modal) modal.hide();
        }
        
        alert("Profil úspěšně aktualizován!");

    } catch (e) {
        console.error(e);
        alert("Chyba při ukládání: " + e.message);
    }
};

// --- 5. CHAT (Zůstává stejný) ---
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

window.loadLeaderboard = async () => {
    const list = document.getElementById("leaderboardList");
    if(!list) return;
    
    list.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-warning"></div></div>';

    try {
        // Dotaz: Seřadit podle stats.xp sestupně, limit 10
        const q = query(collection(db, "users"), orderBy("stats.xp", "desc"), limit(10));
        const snapshot = await getDocs(q); // Pozor: Musíme nahoře importovat getDocs!
        
        list.innerHTML = "";
        let rank = 1;

        snapshot.forEach((docSnap) => {
            const u = docSnap.data();
            const stats = u.stats || { xp: 0, level: 1, rank: "Nováček" };
            const isMe = (auth.currentUser && auth.currentUser.uid === docSnap.id);
            
            // Barva medaile
            let medal = `<span class="badge bg-secondary rounded-pill me-3" style="width: 25px;">${rank}</span>`;
            if(rank === 1) medal = `<span class="badge bg-warning text-dark rounded-pill me-3" style="width: 25px;">1</span>`;
            if(rank === 2) medal = `<span class="badge bg-light text-dark rounded-pill me-3" style="width: 25px;">2</span>`;
            if(rank === 3) medal = `<span class="badge bg-danger text-white rounded-pill me-3" style="width: 25px;">3</span>`;

            const html = `
                <div class="list-group-item bg-transparent border-bottom border-secondary d-flex align-items-center py-3 ${isMe ? 'bg-white bg-opacity-10' : ''}">
                    ${medal}
                    <img src="${u.photo || 'assets/icons/dreams.png'}" class="rounded-circle border border-secondary me-3" width="40" height="40" style="object-fit:cover;">
                    <div class="flex-grow-1 overflow-hidden">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="mb-0 text-light text-truncate">${u.name}</h6>
                            <span class="text-warning small fw-bold">${stats.xp} XP</span>
                        </div>
                        <small class="text-muted d-block text-truncate">Lvl ${stats.level} • ${stats.rank}</small>
                    </div>
                </div>
            `;
            list.insertAdjacentHTML('beforeend', html);
            rank++;
        });

    } catch (e) {
        console.error(e);
        list.innerHTML = `<div class="text-center text-danger py-3">Chyba načítání: ${e.message} (Možná chybí index v DB)</div>`;
    }
};