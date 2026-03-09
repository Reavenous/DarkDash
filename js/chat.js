import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

let currentChatMode = 'global'; 
let currentPrivateUserId = '';
let currentPrivateUserName = '';
let allUsers = [];
let unsubMessages = null; // Slouží k odpojení starého naslouchátka při překliknutí

// 1. NAČTENÍ SEZNAMU UŽIVATELŮ (Real-time)
function listenToUsers() {
    const q = query(collection(db, "users"), orderBy("lastActive", "desc"));
    onSnapshot(q, (snapshot) => {
        allUsers = [];
        snapshot.forEach(doc => {
            if(auth.currentUser && doc.id === auth.currentUser.uid) return; // Sebe v seznamu neukazujeme
            const data = doc.data();
            // Pokud byl aktivní v posledních 10 minutách, svítí zeleně
            const isOnline = data.lastActive && (Date.now() - data.lastActive.toMillis() < 10 * 60 * 1000);
            allUsers.push({
                id: doc.id,
                nick: data.name || "Neznámý Agent",
                photo: data.photo || 'assets/icons/dreams.png',
                status: isOnline ? 'online' : 'offline'
            });
        });
        renderChatUsers(allUsers);
    });
}

// 2. VYKRESLENÍ UŽIVATELŮ DO LEVÉHO PANELU
function renderChatUsers(usersToRender) {
    const list = document.getElementById("chatUsersList");
    const count = document.getElementById("onlineCount");
    if (!list) return;

    list.innerHTML = "";
    const onlineUsers = usersToRender.filter(u => u.status === 'online').length;
    if(count) count.innerText = onlineUsers;

    usersToRender.forEach(user => {
        const statusColor = user.status === 'online' ? 'text-success' : 'text-secondary';
        const a = document.createElement("a");
        a.href = "#";
        a.className = `list-group-item list-group-item-action bg-transparent text-light border-bottom border-secondary d-flex align-items-center p-2`;
        
        a.innerHTML = `
            <div class="position-relative me-3">
                <img src="${user.photo}" class="rounded-circle border border-secondary" width="35" height="35" style="object-fit:cover;">
                <i class="fas fa-circle ${statusColor} position-absolute bottom-0 end-0" style="font-size: 0.6rem; text-shadow: 0 0 3px black;"></i>
            </div>
            <span class="fw-bold small text-truncate">${user.nick}</span>
        `;
        
        a.onclick = (e) => {
            e.preventDefault();
            window.switchToPrivateChat(user.id, user.nick);
        };
        list.appendChild(a);
    });
}

// 3. FILTROVÁNÍ (HLEDÁNÍ AGENTŮ)
window.filterChatUsers = () => {
    const query = document.getElementById("chatSearchUser").value.toLowerCase();
    const filtered = allUsers.filter(u => u.nick.toLowerCase().includes(query));
    renderChatUsers(filtered);
};

// 4. PŘEPNUTÍ NA GLOBÁLNÍ CHAT
window.switchToGlobalChat = () => {
    currentChatMode = 'global';
    document.getElementById("currentChatTitle").innerText = "Globální Kanál";
    document.getElementById("privateChatBadge").classList.add("d-none");
    document.getElementById("btnGlobalChat").classList.replace('btn-outline-danger', 'btn-danger');

    listenToMessages('global');
};

// 5. PŘEPNUTÍ NA SOUKROMÝ CHAT
window.switchToPrivateChat = (userId, userName) => {
    currentChatMode = 'private';
    currentPrivateUserId = userId;
    currentPrivateUserName = userName;

    document.getElementById("currentChatTitle").innerText = `Šeptáš: ${userName}`;
    document.getElementById("privateChatBadge").classList.remove("d-none");
    document.getElementById("btnGlobalChat").classList.replace('btn-danger', 'btn-outline-danger');

    listenToMessages('private', userId);
};

// 6. NASLOUCHÁNÍ ZPRÁVÁM Z FIREBASE
function listenToMessages(mode, privateUserId = null) {
    const container = document.getElementById("chatMessages");
    container.innerHTML = `<div class="text-center text-muted mt-5"><div class="spinner-border spinner-border-sm text-danger"></div> Ladím frekvenci...</div>`;

    if (unsubMessages) unsubMessages(); // Vypne naslouchání předchozí místnosti

    let q;
    if (mode === 'global') {
        q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    } else {
        if (!auth.currentUser) return;
        const myId = auth.currentUser.uid;
        // Unikátní ID místnosti pro dva lidi (abecedně seřazené, aby to bylo stejné pro oba)
        const roomId = myId < privateUserId ? `${myId}_${privateUserId}` : `${privateUserId}_${myId}`;
        q = query(collection(db, "private_messages"), where("roomId", "==", roomId));
    }

    unsubMessages = onSnapshot(q, (snapshot) => {
        let messages = [];
        snapshot.forEach(doc => messages.push(doc.data()));
        
        // Lokální seřazení podle času (fígl, aby po nás Firebase nechtěl vytvářet složité indexy databáze)
        messages.sort((a, b) => {
            const timeA = a.timestamp ? a.timestamp.toMillis() : Date.now();
            const timeB = b.timestamp ? b.timestamp.toMillis() : Date.now();
            return timeA - timeB;
        });

        container.innerHTML = "";
        if (messages.length === 0) {
            container.innerHTML = `<div class="text-center text-muted mt-5"><em>Zatím zde panuje ticho...</em></div>`;
            return;
        }

        messages.forEach(msg => {
            const isMe = auth.currentUser && msg.uid === auth.currentUser.uid;
            
            let timeStr = "";
            if(msg.timestamp) {
                const d = msg.timestamp.toDate();
                timeStr = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
            }

            const msgDiv = document.createElement("div");
            msgDiv.className = `d-flex flex-column mb-3 ${isMe ? 'align-items-end' : 'align-items-start'}`;
            
            const senderName = isMe ? "Já" : (msg.user || "Neznámý");
            const bubbleClass = isMe ? 'bg-danger text-white' : 'bg-dark text-light border border-secondary';

            msgDiv.innerHTML = `
                <div class="d-flex align-items-center mb-1 px-1">
                    ${!isMe ? `<img src="${msg.photo || 'assets/icons/dreams.png'}" class="rounded-circle border border-secondary me-2" width="20" height="20" style="object-fit:cover;">` : ''}
                    <span class="small text-muted">${senderName} <span class="opacity-50 ms-1">${timeStr}</span></span>
                </div>
                <div class="p-2 rounded shadow-sm ${bubbleClass}" style="max-width: 80%; border-radius: 15px; font-size: 0.95rem;">
                    ${msg.text}
                </div>
            `;
            container.appendChild(msgDiv);
        });
        container.scrollTop = container.scrollHeight; // Automaticky srolovat dolů
    });
}

// 7. ODESLÁNÍ ZPRÁVY DO FIREBASE
window.sendChatMessage = async () => {
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text || !auth.currentUser) return;

    input.value = ""; // Vymazat pole po odeslání
    
    const myId = auth.currentUser.uid;
    const myName = auth.currentUser.displayName || auth.currentUser.email.split('@')[0];
    const myPhoto = auth.currentUser.photoURL || 'assets/icons/dreams.png';

    try {
        if (currentChatMode === 'global') {
            await addDoc(collection(db, "messages"), {
                text: text,
                user: myName,
                photo: myPhoto,
                uid: myId,
                timestamp: serverTimestamp()
            });
        } else {
            const roomId = myId < currentPrivateUserId ? `${myId}_${currentPrivateUserId}` : `${currentPrivateUserId}_${myId}`;
            await addDoc(collection(db, "private_messages"), {
                roomId: roomId,
                text: text,
                user: myName,
                photo: myPhoto,
                uid: myId,
                timestamp: serverTimestamp()
            });
        }
    } catch(e) {
        console.error("Chyba při odesílání:", e);
    }
};

// Spustit načítání, až když uživatel otevře chat okno
document.getElementById('chatModal').addEventListener('shown.bs.modal', () => {
    if(auth.currentUser) {
        listenToUsers();
        if(currentChatMode === 'global') window.switchToGlobalChat();
        else window.switchToPrivateChat(currentPrivateUserId, currentPrivateUserName);
    }
});