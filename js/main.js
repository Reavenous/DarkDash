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

document.addEventListener("DOMContentLoaded", () => {
    updateClockAndDate();
    loadWisdom();
    setInterval(updateClockAndDate, 1000);
});