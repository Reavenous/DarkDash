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
        
        // Oslava Level Upu (Notifikace)
        if(window.NotificationSystem) NotificationSystem.show("LEVEL UP!", `Dosáhl jsi úrovně ${newLevel}!`, "💀");
        else alert(`LEVEL UP! Jsi level ${newLevel}`);
    } else {
        // Jen info o XP
        if(window.NotificationSystem) NotificationSystem.show(`+${amount} XP`, reason, "✨");
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