/**
 * DarkDash — DarkChat (Globální + Soukromé zprávy)
 * Autor: Alexandre Basseville
 *
 * OPRAVY oproti původní verzi:
 *  1. listenToUsers: odstraněn orderBy("lastActive") → Firestore ho vracel prázdné
 *     (pole neexistovalo na starých dokumentech), nyní řazeno client-side
 *  2. Přidán updateDoc + zápis lastActive při otevření chatu → online indikátor funguje
 *  3. Přidány error callbacky na všechny onSnapshot → chyby viditelné v konzoli
 *  4. messages query: přidán limit(100) + bezpečný fallback pro chybějící timestamp
 *  5. private_messages: žádný orderBy (vyhýbáme se potřebě composite indexu), řazení client-side
 *  6. Ochrana proti double-init listenerů
 */

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    getFirestore,
    collection,
    doc,
    addDoc,
    updateDoc,
    serverTimestamp,
    onSnapshot,
    query,
    orderBy,
    where,
    limit,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ── Sdílená Firebase instance (stejná jako firebase-init.js) ────
const auth = getAuth();
const db   = getFirestore();

// ── Cloudinary ──────────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME    = "dbnti5mks";
const CLOUDINARY_UPLOAD_PRESET = "ivqkk99k";

// ── Stav ────────────────────────────────────────────────────────
let currentChatMode        = "global";
let currentPrivateUserId   = "";
let currentPrivateUserName = "";
let allUsers               = [];
let unsubMessages          = null;
let unsubUsers             = null;
let currentUser            = null;
let selectedImageFile      = null;

// ── Sledování auth stavu ─────────────────────────────────────────
// DŮLEŽITÉ: auth.currentUser je NULL hned po načtení stránky.
// onAuthStateChanged garantuje aktuální hodnotu.
onAuthStateChanged(auth, (user) => {
    currentUser = user;
});

// ════════════════════════════════════════════════════════════════
//  1. SEZNAM UŽIVATELŮ
//     OPRAVA: Odstraněn orderBy("lastActive") — pole neexistovalo
//     na starých dokumentech → Firestore vracel 0 výsledků.
//     Nyní: čteme celou kolekci, řadíme client-side.
// ════════════════════════════════════════════════════════════════

function listenToUsers() {
    // Odpojit předchozí listener pokud existuje
    if (unsubUsers) { unsubUsers(); unsubUsers = null; }

    const q = query(collection(db, "users")); // BEZ orderBy!

    unsubUsers = onSnapshot(q, (snapshot) => {
        allUsers = [];

        snapshot.forEach(d => {
            // Sebe sama přeskočíme
            if (currentUser && d.id === currentUser.uid) return;

            const data = d.data();

            // Online = aktivní v posledních 10 minutách
            const isOnline = data.lastActive &&
                (Date.now() - data.lastActive.toMillis() < 10 * 60 * 1000);

            allUsers.push({
                id:     d.id,
                nick:   data.name  || "Neznámý Agent",
                photo:  data.photo || "assets/icons/dreams.png",
                status: isOnline ? "online" : "offline",
            });
        });

        // Řadit: online první, pak abecedně
        allUsers.sort((a, b) => {
            if (a.status !== b.status) return a.status === "online" ? -1 : 1;
            return a.nick.localeCompare(b.nick, "cs");
        });

        renderChatUsers(allUsers);
    }, (err) => {
        console.error("[DarkChat] Chyba načítání uživatelů:", err);
    });
}

// ── Zápis lastActive ─────────────────────────────────────────────
// Zapisuje se při otevření chatu — jinak online indikátor nefunguje.
async function updateLastActive() {
    if (!currentUser) return;
    try {
        await updateDoc(doc(db, "users", currentUser.uid), {
            lastActive: serverTimestamp()
        });
    } catch (e) {
        // Není kritické — tiše ignorujeme
        console.warn("[DarkChat] Nelze zapsat lastActive:", e.message);
    }
}

// ════════════════════════════════════════════════════════════════
//  2. VYKRESLENÍ UŽIVATELŮ
// ════════════════════════════════════════════════════════════════

function renderChatUsers(usersToRender) {
    const list  = document.getElementById("chatUsersList");
    const count = document.getElementById("onlineCount");
    if (!list) return;

    const onlineCount = usersToRender.filter(u => u.status === "online").length;
    if (count) count.innerText = onlineCount;

    list.innerHTML = "";

    if (usersToRender.length === 0) {
        list.innerHTML = `<div class="text-muted small text-center p-3">Žádní agenti nenalezeni</div>`;
        return;
    }

    usersToRender.forEach(user => {
        const isActive = currentChatMode === "private" && currentPrivateUserId === user.id;

        const a = document.createElement("a");
        a.href = "#";
        a.className = `list-group-item list-group-item-action bg-transparent text-light
                       border-bottom border-secondary d-flex align-items-center p-2
                       ${isActive ? "bg-danger bg-opacity-10" : ""}`;

        a.innerHTML = `
            <div class="position-relative me-3 flex-shrink-0">
                <img src="${user.photo}"
                     class="rounded-circle border border-secondary"
                     width="35" height="35"
                     style="object-fit:cover;"
                     onerror="this.src='assets/icons/dreams.png'">
                <i class="fas fa-circle position-absolute bottom-0 end-0"
                   style="font-size:.55rem; text-shadow:0 0 3px black;
                          color:${user.status === "online" ? "#28a745" : "#6c757d"};"></i>
            </div>
            <span class="small text-truncate flex-grow-1">${_esc(user.nick)}</span>
        `;

        a.addEventListener("click", (e) => {
            e.preventDefault();
            window.switchToPrivateChat(user.id, user.nick);
        });

        list.appendChild(a);
    });
}

// ════════════════════════════════════════════════════════════════
//  3. FILTROVÁNÍ UŽIVATELŮ
// ════════════════════════════════════════════════════════════════

window.filterChatUsers = () => {
    const val = (document.getElementById("chatSearchUser")?.value ?? "").toLowerCase();
    renderChatUsers(
        val ? allUsers.filter(u => u.nick.toLowerCase().includes(val)) : allUsers
    );
};

// ════════════════════════════════════════════════════════════════
//  4. PŘEPNUTÍ KANÁLŮ
// ════════════════════════════════════════════════════════════════

window.switchToGlobalChat = () => {
    currentChatMode = "global";

    const title = document.getElementById("currentChatTitle");
    const badge = document.getElementById("privateChatBadge");
    const btn   = document.getElementById("btnGlobalChat");

    if (title) title.innerText = "Globální Kanál";
    if (badge) badge.classList.add("d-none");
    if (btn) {
        btn.classList.remove("btn-outline-danger");
        btn.classList.add("btn-danger");
    }

    // Zvýraznit aktivní uživatele (žádný)
    currentPrivateUserId = "";
    renderChatUsers(allUsers);

    listenToMessages("global");
};

window.switchToPrivateChat = (userId, userName) => {
    currentChatMode        = "private";
    currentPrivateUserId   = userId;
    currentPrivateUserName = userName;

    const title = document.getElementById("currentChatTitle");
    const badge = document.getElementById("privateChatBadge");
    const btn   = document.getElementById("btnGlobalChat");

    if (title) title.innerText = `✉ ${_esc(userName)}`;
    if (badge) badge.classList.remove("d-none");
    if (btn) {
        btn.classList.remove("btn-danger");
        btn.classList.add("btn-outline-danger");
    }

    // Zvýraznit vybraného uživatele v listu
    renderChatUsers(allUsers);

    listenToMessages("private", userId);
};

// ════════════════════════════════════════════════════════════════
//  5. NASLOUCHÁNÍ ZPRÁVÁM
//
//  GLOBÁLNÍ:  orderBy("timestamp", "asc") + limit(100)
//             → single-field index, Firestore ho vytvoří automaticky
//
//  SOUKROMÉ:  where("roomId", "==", ...) bez orderBy
//             → vyhýbáme se composite indexu, řadíme client-side
// ════════════════════════════════════════════════════════════════

function listenToMessages(mode, privateUserId = null) {
    const container = document.getElementById("chatMessages");
    if (!container) return;

    container.innerHTML = `
        <div class="text-center text-muted mt-5">
            <div class="spinner-border spinner-border-sm text-danger mb-2"></div>
            <br>Ladím frekvenci...
        </div>`;

    // Odpojit předchozí listener
    if (unsubMessages) { unsubMessages(); unsubMessages = null; }

    if (!currentUser) {
        container.innerHTML = `<div class="text-center text-danger mt-4">Nejsi přihlášen/a.</div>`;
        return;
    }

    let q;

    if (mode === "global") {
        // Single-field index na timestamp je v Firestore automatický
        q = query(
            collection(db, "messages"),
            orderBy("timestamp", "asc"),
            limit(100)
        );
    } else {
        // roomId = menší UID + _ + větší UID  (deterministické, nezávislé na pořadí)
        const roomId = currentUser.uid < privateUserId
            ? `${currentUser.uid}_${privateUserId}`
            : `${privateUserId}_${currentUser.uid}`;

        // ŽÁDNÝ orderBy → žádný composite index potřeba
        q = query(
            collection(db, "private_messages"),
            where("roomId", "==", roomId),
            limit(100)
        );
    }

    unsubMessages = onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach(d => messages.push(d.data()));

        // Řazení client-side (bezpečné pro oba módy)
        messages.sort((a, b) => {
            const tA = a.timestamp?.toMillis?.() ?? 0;
            const tB = b.timestamp?.toMillis?.() ?? 0;
            return tA - tB;
        });

        container.innerHTML = "";

        if (messages.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted mt-5">
                    <em>Zatím zde panuje ticho...</em>
                </div>`;
            return;
        }

        messages.forEach(msg => _renderMessage(msg, container));
        container.scrollTop = container.scrollHeight;

    }, (err) => {
        // OPRAVA: původní kód neměl error callback → chyby tiše mizely
        console.error("[DarkChat] Chyba načítání zpráv:", err);
        container.innerHTML = `
            <div class="text-center text-danger mt-4 p-3">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Chyba spojení: <code>${err.message}</code><br>
                <small class="text-muted mt-2 d-block">
                    Zkontroluj Firestore Security Rules — kolekce "messages"
                    a "private_messages" musí povolovat čtení přihlášeným uživatelům.
                </small>
            </div>`;
    });
}

// ════════════════════════════════════════════════════════════════
//  6. VYKRESLENÍ JEDNÉ ZPRÁVY
// ════════════════════════════════════════════════════════════════

function _renderMessage(msg, container) {
    const isMe = currentUser && msg.uid === currentUser.uid;

    let timeStr = "";
    if (msg.timestamp?.toDate) {
        const d = msg.timestamp.toDate();
        timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }

    const wrap = document.createElement("div");
    wrap.className = `d-flex flex-column mb-3 ${isMe ? "align-items-end" : "align-items-start"}`;

    const senderName  = isMe ? "Já" : _esc(msg.user || "Neznámý");
    const bubbleClass = isMe
        ? "bg-danger text-white"
        : "bg-dark text-light border border-secondary";

    let contentHtml = "";
    if (msg.imageUrl) {
        contentHtml += `
            <img src="${msg.imageUrl}"
                 class="rounded mb-1"
                 style="max-width:240px; max-height:240px; object-fit:cover; cursor:pointer; display:block;"
                 onclick="window.open('${msg.imageUrl}', '_blank')"
                 onerror="this.style.display='none'">`;
    }
    if (msg.text) {
        contentHtml += `<div>${_esc(msg.text)}</div>`;
    }

    wrap.innerHTML = `
        <div class="d-flex align-items-center mb-1 px-1">
            ${!isMe ? `
                <img src="${msg.photo || "assets/icons/dreams.png"}"
                     class="rounded-circle border border-secondary me-2"
                     width="20" height="20"
                     style="object-fit:cover;"
                     onerror="this.src='assets/icons/dreams.png'">
            ` : ""}
            <span class="small text-muted">
                ${senderName}
                <span class="opacity-50 ms-1">${timeStr}</span>
            </span>
        </div>
        <div class="p-2 rounded shadow-sm ${bubbleClass}"
             style="max-width:80%; border-radius:15px; font-size:.95rem; word-break:break-word;">
            ${contentHtml}
        </div>
    `;

    container.appendChild(wrap);
}

// ════════════════════════════════════════════════════════════════
//  7. CLOUDINARY UPLOAD
// ════════════════════════════════════════════════════════════════

async function _uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file",           file);
    formData.append("upload_preset",  CLOUDINARY_UPLOAD_PRESET);

    const btn = document.getElementById("sendBtn");
    const origHtml = btn?.innerHTML ?? "";
    if (btn) { btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`; btn.disabled = true; }

    try {
        const res  = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: "POST", body: formData }
        );
        const data = await res.json();
        if (!data.secure_url) throw new Error(data.error?.message || "Upload selhal");
        return data.secure_url;
    } finally {
        if (btn) { btn.innerHTML = origHtml; btn.disabled = false; }
    }
}

// ════════════════════════════════════════════════════════════════
//  8. VÝBĚR & PREVIEW OBRÁZKU
// ════════════════════════════════════════════════════════════════

window.handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        alert("Soubor je příliš velký. Maximum je 10 MB.");
        event.target.value = "";
        return;
    }

    selectedImageFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById("previewImg");
        const wrap    = document.getElementById("imagePreview");
        if (preview) preview.src = e.target.result;
        if (wrap)    wrap.classList.remove("d-none");
    };
    reader.readAsDataURL(file);
};

window.removeImagePreview = () => {
    selectedImageFile = null;
    const preview = document.getElementById("previewImg");
    const wrap    = document.getElementById("imagePreview");
    const input   = document.getElementById("imageInput");
    if (preview) preview.src = "";
    if (wrap)    wrap.classList.add("d-none");
    if (input)   input.value = "";
};

// ════════════════════════════════════════════════════════════════
//  9. ODESLÁNÍ ZPRÁVY
// ════════════════════════════════════════════════════════════════

window.sendChatMessage = async () => {
    const input = document.getElementById("chatInput");
    const text  = input?.value.trim() ?? "";

    if (!text && !selectedImageFile) return;

    if (!currentUser) {
        alert("Nejsi přihlášen/a.");
        return;
    }

    if (input) input.value = "";

    const myId    = currentUser.uid;
    const myName  = currentUser.displayName || currentUser.email?.split("@")[0] || "Temný agent";
    const myPhoto = currentUser.photoURL    || "assets/icons/dreams.png";

    // Upload obrázku (pokud je vybrán)
    let imageUrl = null;
    if (selectedImageFile) {
        try {
            imageUrl = await _uploadToCloudinary(selectedImageFile);
            window.removeImagePreview();
        } catch (err) {
            console.error("[DarkChat] Cloudinary chyba:", err);
            alert(`Nepodařilo se nahrát obrázek: ${err.message}`);
            return;
        }
    }

    const messageData = {
        text:      text      || null,
        imageUrl:  imageUrl  || null,
        user:      myName,
        photo:     myPhoto,
        uid:       myId,
        timestamp: serverTimestamp(),
    };

    try {
        if (currentChatMode === "global") {
            await addDoc(collection(db, "messages"), messageData);
        } else {
            const roomId = myId < currentPrivateUserId
                ? `${myId}_${currentPrivateUserId}`
                : `${currentPrivateUserId}_${myId}`;
            await addDoc(collection(db, "private_messages"), { ...messageData, roomId });
        }
    } catch (e) {
        console.error("[DarkChat] Chyba odeslání:", e);
        alert(`Zprávu se nepodařilo odeslat: ${e.message}`);
    }
};

// ════════════════════════════════════════════════════════════════
//  10. INICIALIZACE PŘI OTEVŘENÍ MODALU
// ════════════════════════════════════════════════════════════════

document.getElementById("chatModal")?.addEventListener("shown.bs.modal", () => {

    function _startChat(user) {
        currentUser = user;
        updateLastActive(); // Zapíšeme lastActive → online indikátor funguje

        listenToUsers();

        if (currentChatMode === "global") {
            window.switchToGlobalChat();
        } else {
            window.switchToPrivateChat(currentPrivateUserId, currentPrivateUserName);
        }
    }

    if (currentUser) {
        _startChat(currentUser);
    } else {
        // Auth ještě nedoběhl — počkáme (stane se max. při prvním otevření)
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
                unsub();
                _startChat(user);
            }
        });
    }
});

// Při zavření modalu odpojíme listenery (šetří čtení z Firestore)
document.getElementById("chatModal")?.addEventListener("hidden.bs.modal", () => {
    if (unsubMessages) { unsubMessages(); unsubMessages = null; }
    if (unsubUsers)    { unsubUsers();    unsubUsers    = null; }
});

// ════════════════════════════════════════════════════════════════
//  HELPER: HTML escape
// ════════════════════════════════════════════════════════════════

function _esc(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// Nezapomeň si nahoru k importům z firebase/firestore přidat 'onSnapshot' a 'collection', pokud už tam nejsou.

export function listenToUsers() {
  const usersListContainer = document.getElementById("chatUsersList");
  const onlineCountBadge = document.getElementById("onlineCount");

  if (!usersListContainer || !onlineCountBadge) return;

  // Tady předpokládám, že máš v databázi kolekci "users"
  const usersRef = collection(db, "users");

  // Posloucháme změny v kolekci uživatelů
  onSnapshot(usersRef, (snapshot) => {
    let html = "";
    let count = 0;

    snapshot.forEach((doc) => {
      const userData = doc.data();
      
      // Vygenerujeme HTML pro každého uživatele (agenta)
      html += `
        <a href="#" class="list-group-item list-group-item-action bg-dark text-white border-secondary d-flex align-items-center">
          <div class="me-3">
             <i class="fas fa-user-ninja text-danger"></i>
          </div>
          <div>
            <strong>${userData.name || userData.displayName || "Neznámý Agent"}</strong>
          </div>
        </a>
      `;
      count++;
    });

    // Aktualizujeme HTML a počítadlo
    if (count === 0) {
      usersListContainer.innerHTML = `<div class="p-3 text-muted text-center">Žádní agenti nenalezeni</div>`;
    } else {
      usersListContainer.innerHTML = html;
    }
    onlineCountBadge.innerText = count;
  });
}