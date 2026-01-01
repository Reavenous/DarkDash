// js/gamification.js

const RANKS = [
    "Bloudící duše",       // Lvl 1
    "Učedník temnot",      // Lvl 2
    "Strážce stínů",       // Lvl 5
    "Rytíř noci",          // Lvl 10
    "Pán propasti",        // Lvl 20
    "Necromancer",         // Lvl 30
    "Vládce temného trůnu" // Lvl 50
];

// Výchozí stav
window.userStats = {
    xp: 0,
    level: 1,
    rank: RANKS[0]
};

// --- 1. HLAVNÍ FUNKCE: PŘIDAT XP ---
// Tuhle funkci budeš volat z ostatních souborů (todo.js, fitness.js...)
window.addXP = function(amount, reason) {
    if (!window.currentUserUID) return; // XP jen pro přihlášené

    // Přidat XP
    window.userStats.xp += amount;
    
    // Výpočet levelu (jednoduchý vzorec: Level = odmocnina z XP / 10 + 1)
    const newLevel = Math.floor(Math.sqrt(window.userStats.xp) / 10) + 1;
    
    if (newLevel > window.userStats.level) {
        window.userStats.level = newLevel;
        updateRank();
        if(window.playSound) window.playSound('levelup');
        
        // Oslava Level Upu (Notifikace)
        if(window.NotificationSystem) NotificationSystem.show("LEVEL UP!", `Dosáhl jsi úrovně ${newLevel}!`);
        else alert(`LEVEL UP! Jsi level ${newLevel}`);
    } else {
        // Jen info o XP
        if(window.NotificationSystem) NotificationSystem.show(`+${amount} XP`, reason);
    }

    saveStats();      // Uložit do cloudu
    renderProfileHUD(); // Překreslit profil vedle loginu
};

// --- 2. AKTUALIZACE HODNOSTI ---
function updateRank() {
    let lvl = window.userStats.level;
    let r = 0;
    if (lvl >= 50) r = 6;
    else if (lvl >= 30) r = 5;
    else if (lvl >= 20) r = 4;
    else if (lvl >= 10) r = 3;
    else if (lvl >= 5) r = 2;
    else if (lvl >= 2) r = 1;
    
    window.userStats.rank = RANKS[r];
}

// --- 3. UKLÁDÁNÍ A NAČÍTÁNÍ ---
function saveStats() {
    if (window.saveToCloud) window.saveToCloud('gamification', window.userStats);
}

// Volá se automaticky po načtení z Firebase
window.loadStats = function(data) {
    if (data) {
        window.userStats = data;
    }
    renderProfileHUD();
};

// Tohle vytvoří ten pěkný boxík vedle tlačítka Login
// --- 4. VYKRESLENÍ PROFILU (HUD) ---
window.renderProfileHUD = function() {
    const container = document.getElementById('userDisplay'); // Desktop
    const mobileContainer = document.getElementById('mobileUserDisplay'); // Mobil
    
    if (!container) return;

    if (!window.currentUserUID) {
        container.innerHTML = "";
        if(mobileContainer) mobileContainer.innerHTML = "";
        return;
    }

    const currentLvlXP = Math.pow((window.userStats.level - 1) * 10, 2);
    const nextLvlXP = Math.pow((window.userStats.level) * 10, 2);
    const progress = ((window.userStats.xp - currentLvlXP) / (nextLvlXP - currentLvlXP)) * 100;
    const safeProgress = Math.max(0, Math.min(100, progress));

    const photo = window.currentUserPhoto || 'assets/icons/dreams.png';
    const name = window.currentUserName || 'Hráč';

    // UPRAVENO: Širší layout, větší mezery
    const html = `
        <div class="d-flex align-items-center gap-3 p-2 rounded border border-secondary bg-black bg-opacity-75 shadow-sm" 
             style="cursor: pointer; transition: all 0.2s; min-width: 220px;" 
             onclick="openModal('profileModal')" 
             onmouseover="this.style.borderColor='#9d4edd'" 
             onmouseout="this.style.borderColor='#444'">
            
            <div class="position-relative">
                <img src="${photo}" class="rounded-circle border border-warning" width="50" height="50" style="object-fit:cover;">
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-dark shadow" 
                      style="font-size: 0.75rem; z-index: 2;">
                    ${window.userStats.level}
                </span>
            </div>
            
            <div class="overflow-hidden flex-grow-1">
                <div class="text-warning fw-bold text-truncate" style="font-size: 1rem;">${name}</div>
                <div class="text-muted small fst-italic text-truncate" style="font-size: 0.75rem;">${window.userStats.rank}</div>
                <div class="progress bg-dark border border-secondary mt-1" style="height: 6px;">
                    <div class="progress-bar bg-warning" style="width: ${safeProgress}%"></div>
                </div>
            </div>
            
            <div class="text-secondary opacity-50"><i class="fas fa-cog"></i></div>
        </div>
    `;

    container.innerHTML = html;
    if(mobileContainer) mobileContainer.innerHTML = html;
};
// --- 5. LOGIKA PROFILOVÉHO OKNA ---

// Přepínání mezi náhledem a editací
window.toggleProfileMode = function(mode) {
    const view = document.getElementById('profileView');
    const edit = document.getElementById('profileEdit');
    
    if (mode === 'edit') {
        view.style.display = 'none';
        edit.style.display = 'block';
        // Předvyplnit inputy
        document.getElementById('profileNick').value = window.currentUserName || "";
        document.getElementById('profileAvatar').value = window.currentUserPhoto || "";
    } else {
        view.style.display = 'block';
        edit.style.display = 'none';
    }
};

// Generování GitHub-like mřížky (Habit Tracker)
window.renderHabitGrid = function() {
    const grid = document.getElementById('habitGrid');
    if (!grid) return;
    grid.innerHTML = "";

    // 1. Načteme data, abychom zjistili aktivitu
    // Poznámka: tohle je "read-only" kontrola pro vizualizaci
    const fitKey = window.getAppKey ? window.getAppKey("darkdash-fitness-v2") : "darkdash-fitness-v2";
    const journalKey = window.getAppKey ? window.getAppKey("darkdash-journal") : "darkdash-journal";
    
    const workouts = JSON.parse(localStorage.getItem(fitKey) || "[]");
    const journal = JSON.parse(localStorage.getItem(journalKey) || "{}");
    
    // Získáme set datumů, kdy byla aktivita
    const activeDates = new Set();
    
    // Projdi fitness
    workouts.forEach(w => activeDates.add(w.date));
    // Projdi deník (klíče jsou datumy YYYY-MM-DD)
    Object.keys(journal).forEach(date => activeDates.add(date));

    // 2. Generujeme posledních 30 dní
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
        
        const cell = document.createElement("div");
        cell.className = "habit-cell";
        
        // Pokud je aktivita, přidáme třídu active
        if (activeDates.has(dateStr)) {
            cell.classList.add("active");
            cell.title = `${dateStr}: Aktivní`;
        } else {
            cell.title = `${dateStr}: Žádná aktivita`;
        }
        
        grid.appendChild(cell);
    }
};

// --- UPDATE VYKRESLOVÁNÍ PROFILU ---
// Upravíme existující renderProfileHUD, aby volal i update velkého modalu
const originalRenderProfileHUD = window.renderProfileHUD;

window.renderProfileHUD = function() {
    // 1. Zavoláme původní malý HUD
    if (originalRenderProfileHUD) originalRenderProfileHUD();

    // 2. Aktualizujeme data ve velkém modalu (View Mode)
    const viewAvatar = document.getElementById('viewAvatar');
    const viewNick = document.getElementById('viewNick');
    const viewRank = document.getElementById('viewRank');
    const viewLevel = document.getElementById('viewLevel');
    const viewXP = document.getElementById('viewXP');
    const viewProgressBar = document.getElementById('viewProgressBar');

    if (viewNick) {
        viewNick.innerText = window.currentUserName || "Neznámý";
        viewAvatar.src = window.currentUserPhoto || 'assets/icons/dreams.png';
        viewRank.innerText = window.userStats.rank;
        viewLevel.innerText = "Lvl " + window.userStats.level;
        
        // XP Bar logika
        const currentLvlXP = Math.pow((window.userStats.level - 1) * 10, 2);
        const nextLvlXP = Math.pow((window.userStats.level) * 10, 2);
        const needed = nextLvlXP - currentLvlXP;
        const current = window.userStats.xp - currentLvlXP;
        const progress = Math.min(100, Math.max(0, (current / needed) * 100));
        
        viewXP.innerText = `${window.userStats.xp} XP`;
        viewProgressBar.style.width = `${progress}%`;
        
        // 3. Překreslit Grid
        renderHabitGrid();
    }
};

// Zavolat při startu, aby se grid načetl
document.addEventListener("darkdash-reload", window.renderProfileHUD);
document.addEventListener("DOMContentLoaded", () => setTimeout(window.renderProfileHUD, 500));
/* --- ACHIEVEMENTY --- */
const ACHIEVEMENTS = [
    { id: 'level5', icon: 'assets/achievements/badge_level5.png', title: 'Strážce stínů', desc: 'Dosáhni levelu 5', condition: (stats) => stats.level >= 5 },
    { id: 'fitness5', icon: 'assets/achievements/badge_muscle.png', title: 'Železná vůle', desc: 'Odtrénuj 5 tréninků', condition: () => {
        const w = JSON.parse(localStorage.getItem(window.getAppKey("darkdash-fitness-v2")) || "[]");
        return w.length >= 5;
    }},
    { id: 'journal3', icon: 'assets/achievements/badge_writer.png', title: 'Kronikář', desc: '3 zápisy v deníku', condition: () => {
        const j = JSON.parse(localStorage.getItem(window.getAppKey("darkdash-journal")) || "{}");
        return Object.keys(j).length >= 3;
    }},
    { id: 'todo10', icon: 'assets/achievements/badge_task.png', title: 'Vyzyvatel', desc: 'Splň 10 úkolů', condition: () => {
        const t = JSON.parse(localStorage.getItem(window.getAppKey("darkdash-todos")) || "[]");
        return t.filter(x => x.completed).length >= 10;
    }},
    { id: 'nightowl', icon: 'assets/achievements/badge_owl.png', title: 'Noční sova', desc: 'Pracuj v noci (po 22:00)', condition: () => {
        // Kontroluje se při akci, zde jen placeholder, logiku přidáme při ukládání
        return localStorage.getItem('ach_nightowl') === 'true';
    }}
];

// Funkce pro vykreslení odznaků do profilu
window.renderAchievements = function() {
    const container = document.getElementById('achievementsContainer');
    if (!container) return;
    container.innerHTML = "";

    ACHIEVEMENTS.forEach(ach => {
        // Zkontrolujeme, jestli je splněno
        const isUnlocked = ach.condition(window.userStats);
        
        const slot = document.createElement('div');
        slot.className = `badge-slot ${isUnlocked ? 'unlocked' : ''}`;
        slot.title = `${ach.title}: ${ach.desc} (${isUnlocked ? 'SPLNĚNO' : 'UZAMČENO'})`;
        
        if (isUnlocked) {
            // Pokud nemáš obrázek, zobrazí se ikonka, jinak obrázek
            slot.innerHTML = `<img src="${ach.icon}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'"> <i class="fas fa-trophy" style="display:none"></i>`;
        } else {
            slot.innerHTML = `<i class="fas fa-lock"></i>`;
        }
        
        container.appendChild(slot);
    });
};

// Upravíme renderProfileHUD, aby volal i achievementy
const oldRender = window.renderProfileHUD;
window.renderProfileHUD = function() {
    if(oldRender) oldRender();
    renderAchievements();
};
/* --- LOOT BOX SYSTÉM --- */
const LOOT_ITEMS = [
    { name: "Lektvar Soustředění", icon: "assets/loot/potion_blue.png", desc: "+10% k produktivitě na další hodinu.", rarity: "COMMON", color: "#aaa" },
    { name: "Svitek Moudrosti", icon: "assets/loot/scroll.png", desc: "Získáváš cennou životní lekci.", rarity: "COMMON", color: "#aaa" },
    { name: "Zlatý Dukát", icon: "assets/loot/coin.png", desc: "Symbol bohatství a prosperity.", rarity: "RARE", color: "#ffc107" },
    { name: "Meč Termínů", icon: "assets/loot/sword.png", desc: "Proseká se každým úkolem.", rarity: "EPIC", color: "#9d4edd" },
    { name: "Krystal Času", icon: "assets/loot/crystal.png", desc: "Zastaví čas... (nebo aspoň stres).", rarity: "LEGENDARY", color: "#ff4444" }
];

let canOpenLoot = true;

window.openLootChest = function() {
    if (!canOpenLoot) return;
    canOpenLoot = false;

    const inner = document.getElementById("lootCardInner");
    const nameEl = document.getElementById("lootName");
    const descEl = document.getElementById("lootDesc");
    const iconEl = document.getElementById("lootIcon");
    const rarityEl = document.getElementById("lootRarity");

    // 1. Náhodný item (s váhou by to bylo lepší, ale pro začátek stačí random)
    const item = LOOT_ITEMS[Math.floor(Math.random() * LOOT_ITEMS.length)];

    // 2. Animace otevření
    inner.style.transform = "rotateY(180deg)";

    // 3. Naplnění daty (se zpožděním, aby to nebylo vidět při otočce)
    setTimeout(() => {
        nameEl.innerText = item.name;
        descEl.innerText = item.desc;
        rarityEl.innerText = item.rarity;
        rarityEl.style.color = item.color;
        rarityEl.style.borderColor = item.color;
        
        // Pokud máš obrázky, použij <img>, jinak emoji fallback
        iconEl.innerHTML = `<img src="${item.icon}" style="width:120px; height:120px; object-fit:contain; filter: drop-shadow(0 0 10px ${item.color});" onerror="this.style.display='none'; this.parentElement.innerText='🎁'">`;

        // Efekt získání XP za otevření
        window.addXP(10, "Loot Box");
    }, 200);

    // 4. Reset po zavření
    const modalEl = document.getElementById('lootModal');
    modalEl.addEventListener('hidden.bs.modal', () => {
        inner.style.transform = "rotateY(0deg)";
        canOpenLoot = true;
    }, { once: true });
};