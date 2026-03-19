import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

// =============================================
// ⚠️  VYPLŇ SVÉ CLOUDINARY ÚDAJE ZDE
// =============================================
const CLOUDINARY_CLOUD_NAME   = "TVUJ_CLOUD_NAME";    // např. "dxyz123abc"
const CLOUDINARY_UPLOAD_PRESET = "TVUJ_UPLOAD_PRESET"; // unsigned preset z Cloudinary dashboardu
// =============================================

let currentChatMode       = 'global';
let currentPrivateUserId  = '';
let currentPrivateUserName = '';
let allUsers              = [];
let unsubMessages         = null;
let currentUser           = null; // <-- sledujeme přihlášeného uživatele globálně
let selectedImageFile     = null;

// ── AUTH SLEDOVÁNÍ ──────────────────────────────────────────────
// Toto je klíčová oprava: auth.currentUser je NULL hned po načtení stránky.
// onAuthStateChanged nám garantuje, že currentUser je vždy aktuální.
onAuthStateChanged(auth, (user) => {
    currentUser = user;
});

// ── 1. NAČTENÍ SEZNAMU UŽIVATELŮ ────────────────────────────────
function listenToUsers() {
    const q = query(collection(db, "users"), orderBy("lastActive", "desc"));
    onSnapshot(q, (snapshot) => {
        allUsers = [];
        snapshot.forEach(doc => {
            if (currentUser && doc.id === currentUser.uid) return;
            const data = doc.data();
            const isOnline = data.lastActive &&
                (Date.now() - data.lastActive.toMillis() < 10 * 60 * 1000);
            allUsers.push({
                id:     doc.id,
                nick:   data.name  || "Neznámý Agent",
                photo:  data.photo || 'assets/icons/dreams.png',
                status: isOnline ? 'online' : 'offline'
            });
        });
        renderChatUsers(allUsers);
    });
}

// ── 2. VYKRESLENÍ UŽIVATELŮ ─────────────────────────────────────
function renderChatUsers(usersToRender) {
    const list  = document.getElementById("chatUsersList");
    const count = document.getElementById("onlineCount");
    if (!list) return;

    list.innerHTML = "";
    const onlineCount = usersToRender.filter(u => u.status === 'online').length;
    if (count) count.innerText = onlineCount;

    usersToRender.forEach(user => {
        const statusColor = user.status === 'online' ? 'text-success' : 'text-secondary';
        const a = document.createElement("a");
        a.href = "#";
        a.className = "list-group-item list-group-item-action bg-transparent text-light border-bottom border-secondary d-flex align-items-center p-2";
        a.innerHTML = `
            <div class="position-relative me-3">
                <img src="${user.photo}" class="rounded-circle border border-secondary"
                     width="35" height="35" style="object-fit:cover;"
                     onerror="this.src='assets/icons/dreams.png'">
                <i class="fas fa-circle ${statusColor} position-absolute bottom-0 end-0"
                   style="font-size:0.6rem;text-shadow:0 0 3px black;"></i>
            </div>
            <span class="fw-bold small text-truncate">${user.nick}</span>
        `;
        a.onclick = (e) => { e.preventDefault(); window.switchToPrivateChat(user.id, user.nick); };
        list.appendChild(a);
    });
}

// ── 3. FILTROVÁNÍ ───────────────────────────────────────────────
window.filterChatUsers = () => {
    const val = document.getElementById("chatSearchUser").value.toLowerCase();
    renderChatUsers(allUsers.filter(u => u.nick.toLowerCase().includes(val)));
};

// ── 4. GLOBÁLNÍ CHAT ────────────────────────────────────────────
window.switchToGlobalChat = () => {
    currentChatMode = 'global';
    document.getElementById("currentChatTitle").innerText = "Globální Kanál";
    document.getElementById("privateChatBadge").classList.add("d-none");
    document.getElementById("btnGlobalChat").classList.replace('btn-outline-danger', 'btn-danger');
    listenToMessages('global');
};

// ── 5. SOUKROMÝ CHAT ────────────────────────────────────────────
window.switchToPrivateChat = (userId, userName) => {
    currentChatMode        = 'private';
    currentPrivateUserId   = userId;
    currentPrivateUserName = userName;
    document.getElementById("currentChatTitle").innerText = `Šeptáš: ${userName}`;
    document.getElementById("privateChatBadge").classList.remove("d-none");
    document.getElementById("btnGlobalChat").classList.replace('btn-danger', 'btn-outline-danger');
    listenToMessages('private', userId);
};

// ── 6. NASLOUCHÁNÍ ZPRÁVÁM ──────────────────────────────────────
function listenToMessages(mode, privateUserId = null) {
    const container = document.getElementById("chatMessages");
    container.innerHTML = `
        <div class="text-center text-muted mt-5">
            <div class="spinner-border spinner-border-sm text-danger mb-2"></div>
            <br>Ladím frekvenci...
        </div>`;

    if (unsubMessages) unsubMessages();

    let q;
    if (mode === 'global') {
        q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    } else {
        if (!currentUser) return;
        const myId   = currentUser.uid;
        const roomId = myId < privateUserId
            ? `${myId}_${privateUserId}`
            : `${privateUserId}_${myId}`;
        q = query(collection(db, "private_messages"), where("roomId", "==", roomId));
    }

    unsubMessages = onSnapshot(q, (snapshot) => {
        let messages = [];
        snapshot.forEach(doc => messages.push(doc.data()));

        // Lokální řazení – vyhne se nutnosti vytvářet composite index v Firebase
        messages.sort((a, b) => {
            const tA = a.timestamp ? a.timestamp.toMillis() : Date.now();
            const tB = b.timestamp ? b.timestamp.toMillis() : Date.now();
            return tA - tB;
        });

        container.innerHTML = "";
        if (messages.length === 0) {
            container.innerHTML = `<div class="text-center text-muted mt-5"><em>Zatím zde panuje ticho...</em></div>`;
            return;
        }

        messages.forEach(msg => renderMessage(msg, container));
        container.scrollTop = container.scrollHeight;
    });
}

// ── 7. VYKRESLENÍ JEDNÉ ZPRÁVY ──────────────────────────────────
function renderMessage(msg, container) {
    const isMe = currentUser && msg.uid === currentUser.uid;

    let timeStr = "";
    if (msg.timestamp) {
        const d = msg.timestamp.toDate();
        timeStr = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }

    const msgDiv     = document.createElement("div");
    msgDiv.className = `d-flex flex-column mb-3 ${isMe ? 'align-items-end' : 'align-items-start'}`;

    const senderName  = isMe ? "Já" : (msg.user || "Neznámý");
    const bubbleClass = isMe
        ? 'bg-danger text-white'
        : 'bg-dark text-light border border-secondary';

    // Sestavení obsahu bubliny (text + případný obrázek)
    let contentHtml = '';
    if (msg.imageUrl) {
        contentHtml += `
            <img src="${msg.imageUrl}"
                 class="rounded mb-1"
                 style="max-width:240px;max-height:240px;object-fit:cover;cursor:pointer;display:block;"
                 onclick="window.open('${msg.imageUrl}','_blank')"
                 onerror="this.style.display='none'">`;
    }
    if (msg.text) {
        contentHtml += `<div>${msg.text}</div>`;
    }

    msgDiv.innerHTML = `
        <div class="d-flex align-items-center mb-1 px-1">
            ${!isMe ? `<img src="${msg.photo || 'assets/icons/dreams.png'}"
                            class="rounded-circle border border-secondary me-2"
                            width="20" height="20" style="object-fit:cover;"
                            onerror="this.src='assets/icons/dreams.png'">` : ''}
            <span class="small text-muted">
                ${senderName}
                <span class="opacity-50 ms-1">${timeStr}</span>
            </span>
        </div>
        <div class="p-2 rounded shadow-sm ${bubbleClass}"
             style="max-width:80%;border-radius:15px;font-size:0.95rem;">
            ${contentHtml}
        </div>
    `;
    container.appendChild(msgDiv);
}

// ── 8. CLOUDINARY UPLOAD ────────────────────────────────────────
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file",           file);
    formData.append("upload_preset",  CLOUDINARY_UPLOAD_PRESET);

    // Ukaž loading stav na tlačítku
    const btn = document.getElementById("sendBtn");
    const originalHtml = btn.innerHTML;
    btn.innerHTML  = `<span class="spinner-border spinner-border-sm"></span>`;
    btn.disabled   = true;

    try {
        const res  = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: "POST", body: formData }
        );
        const data = await res.json();
        if (!data.secure_url) throw new Error(data.error?.message || "Upload selhal");
        return data.secure_url;
    } finally {
        btn.innerHTML = originalHtml;
        btn.disabled  = false;
    }
}

// ── 9. VÝBĚR & PREVIEW OBRÁZKU ──────────────────────────────────
window.handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Omezení velikosti na 10 MB
    if (file.size > 10 * 1024 * 1024) {
        alert("Soubor je příliš velký. Maximum je 10 MB.");
        event.target.value = "";
        return;
    }

    selectedImageFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById("previewImg").src = e.target.result;
        document.getElementById("imagePreview").classList.remove("d-none");
    };
    reader.readAsDataURL(file);
};

window.removeImagePreview = () => {
    selectedImageFile = null;
    document.getElementById("imagePreview").classList.add("d-none");
    document.getElementById("previewImg").src = "";
    document.getElementById("imageInput").value = "";
};

// ── 10. ODESLÁNÍ ZPRÁVY ─────────────────────────────────────────
window.sendChatMessage = async () => {
    const input = document.getElementById("chatInput");
    const text  = input.value.trim();

    if (!text && !selectedImageFile) return;
    if (!currentUser) {
        alert("Nejsi přihlášen/a.");
        return;
    }

    input.value = "";

    const myId    = currentUser.uid;
    const myName  = currentUser.displayName || currentUser.email.split('@')[0];
    const myPhoto = currentUser.photoURL || 'assets/icons/dreams.png';

    // Nejprve nahraj obrázek (pokud existuje)
    let imageUrl = null;
    if (selectedImageFile) {
        try {
            imageUrl = await uploadToCloudinary(selectedImageFile);
            window.removeImagePreview();
        } catch (err) {
            console.error("Cloudinary chyba:", err);
            alert(`Nepodařilo se nahrát obrázek: ${err.message}`);
            return;
        }
    }

    const messageData = {
        text:      text     || null,
        imageUrl:  imageUrl || null,
        user:      myName,
        photo:     myPhoto,
        uid:       myId,
        timestamp: serverTimestamp()
    };

    try {
        if (currentChatMode === 'global') {
            await addDoc(collection(db, "messages"), messageData);
        } else {
            const roomId = myId < currentPrivateUserId
                ? `${myId}_${currentPrivateUserId}`
                : `${currentPrivateUserId}_${myId}`;
            await addDoc(collection(db, "private_messages"), { ...messageData, roomId });
        }
    } catch (e) {
        console.error("Chyba při odesílání:", e);
    }
};

// ── 11. INICIALIZACE PŘI OTEVŘENÍ MODALU ────────────────────────
document.getElementById('chatModal').addEventListener('shown.bs.modal', () => {
    if (currentUser) {
        // Uživatel je už přihlášen – rovnou nastartuj chat
        listenToUsers();
        if (currentChatMode === 'global') window.switchToGlobalChat();
        else window.switchToPrivateChat(currentPrivateUserId, currentPrivateUserName);
    } else {
        // Auth ještě nedoběhl – počkáme na první výsledek
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUser = user;
                listenToUsers();
                if (currentChatMode === 'global') window.switchToGlobalChat();
                else window.switchToPrivateChat(currentPrivateUserId, currentPrivateUserName);
                unsub(); // odpoj jednorázový listener
            }
        });
    }
});