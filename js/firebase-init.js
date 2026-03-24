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

        // 3. Načíst stats ze zálohy v localStorage (okamžitě, před cloudem)
        try {
            const localStatsKey = `user_${user.uid}_darkdash-gamification`;
            const localStats = localStorage.getItem(localStatsKey);
            if (localStats) {
                const parsed = JSON.parse(localStats);
                if (parsed && parsed.xp !== undefined) {
                    window.userStats = parsed;
                }
            }
        } catch(e) {}
        // Vykreslit RPG Profil s lokálními daty (cloud přijde za chvíli)
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
        window.statsLoaded = false; // Reset flagu — při příštím loginu čekáme na cloud
        window.userStats = { xp: 0, level: 1, rank: 'Bloudící duše' }; // Reset v paměti
        
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



window.loadLeaderboard = async () => {
    const podium = document.getElementById("leaderboardPodium");
    const list   = document.getElementById("leaderboardList");
    if (!podium || !list) return;

    // Loading state
    podium.innerHTML = `<div class="text-center text-muted w-100 py-3"><div class="spinner-border spinner-border-sm text-warning me-2"></div>Načítám síň slávy...</div>`;
    list.innerHTML = "";

    try {
        const q = query(collection(db, "users"), orderBy("stats.xp", "desc"), limit(10));
        const snapshot = await getDocs(q);

        const players = [];
        snapshot.forEach(docSnap => {
            const u = docSnap.data();
            players.push({
                uid:   docSnap.id,
                name:  u.name  || "Neznámý",
                photo: u.photo || "assets/icons/dreams.png",
                stats: u.stats || { xp: 0, level: 1, rank: "Bloudící duše" }
            });
        });

        const myUID = auth.currentUser ? auth.currentUser.uid : null;

        // ── PODIUM (top 3) ───────────────────────────────────
        const podiumOrder = [players[1], players[0], players[2]]; // 2. | 1. | 3.
        const podiumConfig = [
            { place: 2, height: "90px",  icon: "🥈", color: "#adb5bd", glow: "rgba(173,181,189,0.3)", medalBg: "#6c757d" },
            { place: 1, height: "120px", icon: "👑", color: "#ffc107", glow: "rgba(255,193,7,0.4)",   medalBg: "#ffc107" },
            { place: 3, height: "70px",  icon: "🥉", color: "#cd7f32", glow: "rgba(205,127,50,0.3)",  medalBg: "#8B4513" },
        ];

        podium.innerHTML = "";
        podiumConfig.forEach((cfg, i) => {
            const p = podiumOrder[i];
            if (!p) return;

            const isMe = p.uid === myUID;
            const col = document.createElement("div");
            col.className = "d-flex flex-column align-items-center";
            col.style.flex = "1";
            col.style.maxWidth = "160px";

            col.innerHTML = `
                <div class="position-relative mb-2">
                    <img src="${p.photo}" class="rounded-circle"
                         style="width:${cfg.place===1?'64px':'52px'}; height:${cfg.place===1?'64px':'52px'};
                                object-fit:cover;
                                border: 2px solid ${cfg.color};
                                box-shadow: 0 0 14px ${cfg.glow};
                                ${isMe ? 'outline: 2px solid #9d4edd; outline-offset: 3px;' : ''}">
                    <span class="position-absolute top-0 start-100 translate-middle"
                          style="font-size:${cfg.place===1?'1.1rem':'0.9rem'}; line-height:1;">${cfg.icon}</span>
                </div>
                <div class="text-center mb-2" style="max-width:110px;">
                    <div class="fw-bold text-truncate ${isMe ? 'text-warning' : 'text-light'}"
                         style="font-size:${cfg.place===1?'.85rem':'.78rem'};">${p.name}${isMe ? ' (Ty)' : ''}</div>
                    <div class="text-muted" style="font-size:.68rem;">${p.stats.rank}</div>
                </div>
                <div class="w-100 rounded-top text-center py-2 position-relative"
                     style="height:${cfg.height};
                            background: linear-gradient(180deg, ${cfg.color}22, ${cfg.color}08);
                            border: 1px solid ${cfg.color}44;
                            border-bottom: none;
                            display:flex; flex-direction:column; align-items:center; justify-content:center;">
                    <div style="font-size:.7rem; color:${cfg.color}; font-weight:700; letter-spacing:1px;">LVL ${p.stats.level}</div>
                    <div style="font-size:.75rem; color:${cfg.color}; font-weight:800;">${p.stats.xp.toLocaleString()} XP</div>
                </div>
            `;
            podium.appendChild(col);
        });

        // ── ZBYTEK (4–10) ────────────────────────────────────
        list.innerHTML = "";
        const rest = players.slice(3);

        if (rest.length === 0) {
            list.innerHTML = `<div class="text-center text-muted small py-2">Zatím žádní další bojovníci</div>`;
        }

        // Pro XP bar potřebujeme max XP (hráč č. 1)
        const maxXP = players[0]?.stats?.xp || 1;

        rest.forEach((p, i) => {
            const place = i + 4;
            const isMe  = p.uid === myUID;
            const xpPct = Math.round((p.stats.xp / maxXP) * 100);

            const row = document.createElement("div");
            row.style.cssText = `
                display:flex; align-items:center; gap:12px;
                padding:10px 14px; border-radius:8px;
                background: ${isMe ? 'rgba(157,78,221,0.1)' : 'rgba(255,255,255,0.03)'};
                border: 1px solid ${isMe ? 'rgba(157,78,221,0.4)' : 'rgba(255,255,255,0.06)'};
                transition: background .2s;
            `;

            row.innerHTML = `
                <!-- Pořadí -->
                <div style="width:24px; text-align:center; font-size:.8rem; font-weight:700; color:#555; flex-shrink:0;">${place}.</div>

                <!-- Avatar -->
                <img src="${p.photo}" class="rounded-circle" style="width:36px; height:36px; object-fit:cover; border:1px solid #333; flex-shrink:0;">

                <!-- Info + XP bar -->
                <div style="flex:1; min-width:0;">
                    <div class="d-flex justify-content-between align-items-baseline mb-1">
                        <span class="text-truncate ${isMe ? 'text-warning fw-bold' : 'text-light'}"
                              style="font-size:.83rem;">${p.name}${isMe ? ' 👤' : ''}</span>
                        <span style="font-size:.72rem; color:#adb5bd; flex-shrink:0; margin-left:8px;">${p.stats.xp.toLocaleString()} XP</span>
                    </div>
                    <div style="height:3px; background:rgba(255,255,255,0.07); border-radius:2px; overflow:hidden;">
                        <div style="height:100%; width:${xpPct}%;
                                    background:linear-gradient(90deg, #6c757d, #adb5bd);
                                    border-radius:2px; transition:width .6s;"></div>
                    </div>
                    <div style="font-size:.65rem; color:#555; margin-top:2px;">Lvl ${p.stats.level} · ${p.stats.rank}</div>
                </div>
            `;
            list.appendChild(row);
        });

    } catch (e) {
        console.error(e);
        podium.innerHTML = `<div class="text-center text-danger w-100 py-3">
            <i class="fas fa-exclamation-triangle me-2"></i>Chyba načítání<br>
            <small class="text-muted">${e.message}</small>
        </div>`;
    }
};