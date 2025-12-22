let countdowns = [];
let updateInterval = null;

// Načtení odpočtů
function loadCountdowns() {
    const key = window.getAppKey ? window.getAppKey("darkdash-countdowns") : "darkdash-countdowns";
    const stored = localStorage.getItem(key);
    countdowns = stored ? JSON.parse(stored) : [];
    renderCountdowns();
    startUpdateLoop();
}

function saveCountdowns() {
    const key = window.getAppKey("darkdash-countdowns");
    localStorage.setItem(key, JSON.stringify(countdowns));
    if(window.saveToCloud) window.saveToCloud("countdowns", countdowns);
}
// Přidání nového odpočtu
function addCountdown() {
    const nameInput = document.getElementById("cdName");
    const dateInput = document.getElementById("cdDate");
    
    const name = nameInput.value.trim();
    const dateVal = dateInput.value;

    if (!name || !dateVal) return;

    const targetDate = new Date(dateVal);
    if (targetDate <= new Date()) {
        alert("Vyber datum v budoucnosti!");
        return;
    }

    countdowns.push({
        id: Date.now(),
        name: name,
        date: targetDate.toISOString()
    });

    nameInput.value = "";
    dateInput.value = "";
    
    saveCountdowns();
    renderCountdowns();
}

// Smazání odpočtu
function deleteCountdown(id) {
    countdowns = countdowns.filter(c => c.id !== id);
    saveCountdowns();
    renderCountdowns();
}

// Vykreslení seznamu (bez živých čísel, ty řeší updateTimerDisplay)
function renderCountdowns() {
    const list = document.getElementById("countdownList");
    list.innerHTML = "";

    if (countdowns.length === 0) {
        list.innerHTML = '<p class="text-center text-muted">Žádné aktivní odpočty.</p>';
        return;
    }

    countdowns.forEach(cd => {
        const div = document.createElement("div");
        div.className = "countdown-item bg-dark border border-secondary p-3 rounded position-relative";
        div.setAttribute("data-id", cd.id);
        
        // HTML struktura kartičky
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="text-warning m-0">${cd.name}</h5>
                <button class="btn btn-sm btn-outline-danger border-0" onclick="deleteCountdown(${cd.id})">×</button>
            </div>
            <div class="d-flex gap-3 justify-content-center text-center">
                <div>
                    <span class="display-6 fw-bold cd-d">0</span>
                    <small class="d-block text-muted">Dní</small>
                </div>
                <div>
                    <span class="display-6 fw-bold cd-h">00</span>
                    <small class="d-block text-muted">Hod</small>
                </div>
                <div>
                    <span class="display-6 fw-bold cd-m">00</span>
                    <small class="d-block text-muted">Min</small>
                </div>
                <div>
                    <span class="display-6 fw-bold cd-s">00</span>
                    <small class="d-block text-muted">Sec</small>
                </div>
            </div>
        `;
        list.appendChild(div);
    });
    
    updateTimerDisplay(); // Hned aktualizovat čísla
}

// Smyčka pro aktualizaci čísel každou sekundu
function startUpdateLoop() {
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(updateTimerDisplay, 1000);
}

function updateTimerDisplay() {
    const now = new Date();

    countdowns.forEach(cd => {
        const target = new Date(cd.date);
        const diff = target - now;
        
        // Najdeme element v DOMu
        const el = document.querySelector(`.countdown-item[data-id="${cd.id}"]`);
        if (!el) return;

        if (diff <= 0) {
            // Hotovo
            el.querySelector(".cd-d").innerText = "0";
            el.querySelector(".cd-h").innerText = "00";
            el.querySelector(".cd-m").innerText = "00";
            el.querySelector(".cd-s").innerText = "00";
            el.classList.add("opacity-50"); // Zešednout
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        el.querySelector(".cd-d").innerText = days;
        el.querySelector(".cd-h").innerText = hours.toString().padStart(2, '0');
        el.querySelector(".cd-m").innerText = minutes.toString().padStart(2, '0');
        el.querySelector(".cd-s").innerText = seconds.toString().padStart(2, '0');
    });
}

// Start
loadCountdowns();