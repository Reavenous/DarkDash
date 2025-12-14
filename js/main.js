let dailyWisdom = []; // Sem se načtou data

// --- 1. NAČTENÍ DAT Z JSONU ---
function loadWisdom() {
    fetch('data/wisdom.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            return response.json();
        })
        .then(data => {
            dailyWisdom = data;
            generateQuote(); // Vygenerujeme první moudro hned po načtení
        })
        .catch(err => {
            console.error("Chyba při načítání moudra:", err);
            // Fallback, kdyby se soubor nenačetl
            dailyWisdom = ["I v temnotě lze nalézt světlo. (Chyba načítání dat)"];
            generateQuote();
        });
}

// --- 2. GENERÁTOR MOUDER ---
function generateQuote() {
    if (dailyWisdom.length === 0) return;

    const randomIndex = Math.floor(Math.random() * dailyWisdom.length);
    const element = document.getElementById("quoteText");
    
    if(element) {
        element.innerText = `"${dailyWisdom[randomIndex]}"`;
    }
}

// --- 3. HODINY A DATUM ---
function updateClockAndDate() {
    const now = new Date();
    
    // Čas
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const clockEl = document.getElementById("clock");
    if(clockEl) clockEl.innerText = timeString;

    // Datum (Den. Měsíc.)
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const dateEl = document.getElementById("dateDisplay");
    if(dateEl) dateEl.innerText = `${day}. ${month}.`;

    // Rok - dynamicky z PC
    const yearEl = document.getElementById("yearDisplay");
    if(yearEl) yearEl.innerText = `Rok ${now.getFullYear()}`;
}

// --- 4. SPUŠTĚNÍ ---
document.addEventListener("DOMContentLoaded", () => {
    updateClockAndDate();
    loadWisdom(); // Načteme externí data
    setInterval(updateClockAndDate, 1000);
});