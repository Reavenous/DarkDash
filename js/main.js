// js/main.js

// --- UŽIVATELSKÁ IDENTITA ---
window.currentUserUID = null; // Zde bude ID přihlášeného

// TOTO JE TO KOUZLO:
// Pokud jsi přihlášený, data se uloží jako "user_XYZ_darkdash-todos".
// Pokud ne, uloží se jako "darkdash-todos".
window.getAppKey = function(baseName) {
    if (window.currentUserUID) {
        return `user_${window.currentUserUID}_${baseName}`;
    }
    return baseName; 
};

// --- PŮVODNÍ KÓD (Moudra a Hodiny) ---
let dailyWisdom = [];

function loadWisdom() {
    fetch('data/wisdom.json')
        .then(response => {
            if (!response.ok) throw new Error("HTTP error " + response.status);
            return response.json();
        })
        .then(data => {
            dailyWisdom = data;
            generateQuote(); 
        })
        .catch(err => {
            console.error("Chyba moudra:", err);
            dailyWisdom = ["I v temnotě lze nalézt světlo."];
            generateQuote();
        });
}

function generateQuote() {
    if (dailyWisdom.length === 0) return;
    const randomIndex = Math.floor(Math.random() * dailyWisdom.length);
    const element = document.getElementById("quoteText");
    if(element) element.innerText = `"${dailyWisdom[randomIndex]}"`;
}

function updateClockAndDate() {
    const now = new Date();
    const clockEl = document.getElementById("clock");
    if(clockEl) clockEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const dateEl = document.getElementById("dateDisplay");
    if(dateEl) dateEl.innerText = `${now.getDate()}. ${now.getMonth() + 1}.`;

    const yearEl = document.getElementById("yearDisplay");
    if(yearEl) yearEl.innerText = `Rok ${now.getFullYear()}`;
}

let isBossKeyActive = false;

document.addEventListener('keydown', (e) => {
    // Klávesa 'B' nebo 'Esc' (pokud není otevřený modal)
    if (e.key.toLowerCase() === 'b' && !document.querySelector('.modal.show')) {
        toggleBossKey();
    }
});

function toggleBossKey() {
    const screen = document.getElementById('bossKeyScreen');
    const percent = document.getElementById('bossKeyPercent');
    
    if (!isBossKeyActive) {
        // Zapnout
        screen.classList.remove('d-none');
        screen.classList.add('d-flex');
        document.title = "Update..."; // Změnit titulek záložky
        isBossKeyActive = true;
        
        // Falešné načítání procent
        let p = 0;
        const interval = setInterval(() => {
            if(!isBossKeyActive) clearInterval(interval);
            p++;
            if (percent) percent.innerText = p;
            if (p >= 99) clearInterval(interval);
        }, 2000); // Pomalu
        
    } else {
        // Vypnout
        screen.classList.add('d-none');
        screen.classList.remove('d-flex');
        document.title = "DarkDash";
        isBossKeyActive = false;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    updateClockAndDate();
    loadWisdom();
    setInterval(updateClockAndDate, 1000);
});
// --- KONAMI CODE (EASTER EGG) ---
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'a', 'a'];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
    // Kontrola klávesy
    if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        
        if (konamiIndex === konamiCode.length) {
            activateGodMode();
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0; // Reset sekvence při chybě
    }
});

function activateGodMode() {
    // 1. Zvuk
    if(window.playSound) window.playSound('magic');
    
    // 2. Vizuální efekt (Inverze barev - vypadá to jako chyba v Matrixu)
    document.body.style.transition = "filter 2s";
    document.body.style.filter = "invert(1) hue-rotate(180deg)";
    
    // 3. Odměna
    if(window.addXP) window.addXP(1000, "GOD MODE ACTIVATED");
    
    // 4. Hláška
    alert("🔓 GOD MODE AKTIVOVÁN: Získáváš 1000 XP a vidění Matrixu!");
    
    // 5. Reset po 5 sekundách
    setTimeout(() => {
        document.body.style.filter = "none";
    }, 5000);
}