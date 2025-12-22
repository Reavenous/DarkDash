let currentDate = new Date();
let selectedDateKey = null; // Ukládá klíč vybraného data (např. "2025-11-24")

// Názvy dnů a měsíců
const monthNames = ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"];
const dayNames = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

// Spuštění při načtení
document.addEventListener("DOMContentLoaded", () => {
    renderCalendar();
});

// Hlavní funkce pro vykreslení kalendáře
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const titleEl = document.getElementById("monthYearDisplay");
    if(titleEl) titleEl.innerText = `${monthNames[month]} ${year}`;

    const calendarGrid = document.getElementById("calendarGrid");
    if(!calendarGrid) return; // Ochrana kdyby modal nebyl v DOM
    
    calendarGrid.innerHTML = "";

    // Vykreslení hlavičky dnů (Po-Ne)
    dayNames.forEach(day => {
        const div = document.createElement("div");
        div.className = "calendar-header";
        div.innerText = day;
        calendarGrid.appendChild(div);
    });

    // Zjištění prvního dne v měsíci a počtu dní
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Neděle, 1 = Pondělí...
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Korekce, aby týden začínal Pondělím (protože JS má Neděli jako 0)
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    // Prázdná políčka před prvním dnem
    for (let i = 0; i < adjustedFirstDay; i++) {
        const emptyDiv = document.createElement("div");
        calendarGrid.appendChild(emptyDiv);
    }

    // Vykreslení dní
    const today = new Date();
    
    // 1. NAČTENÍ DAT S UNIKÁTNÍM KLÍČEM
    const key = window.getAppKey("darkdash-events");
    const stored = localStorage.getItem(key);
    const events = stored ? JSON.parse(stored) : {};

    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.className = "calendar-day";
        dayDiv.innerText = day;

        // Vytvoření klíče data (YYYY-MM-DD)
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Zvýraznění dneška
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayDiv.classList.add("today");
        }

        // Pokud má den událost, přidáme tečku
        if (events[dateKey] && events[dateKey].length > 0) {
            const dot = document.createElement("div");
            dot.className = "event-dot";
            dayDiv.appendChild(dot);
        }

        // Kliknutí na den
        dayDiv.onclick = () => selectDay(dateKey, dayDiv);

        calendarGrid.appendChild(dayDiv);
    }
}

// Změna měsíce (+1 nebo -1)
function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
    const eventSection = document.getElementById("eventSection");
    if(eventSection) eventSection.style.display = "none"; // Skrýt detaily při změně
}

// Kliknutí na konkrétní den
function selectDay(dateKey, element) {
    // Odznačit ostatní
    document.querySelectorAll(".calendar-day").forEach(el => el.classList.remove("selected"));
    element.classList.add("selected");

    selectedDateKey = dateKey;
    document.getElementById("selectedDateDisplay").innerText = `Události: ${dateKey}`;
    document.getElementById("eventSection").style.display = "block";

    renderEvents(dateKey);
}

// Vykreslení seznamu událostí pro vybraný den
function renderEvents(dateKey) {
    const eventList = document.getElementById("eventList");
    eventList.innerHTML = "";
    
    // Načtení dat
    const key = window.getAppKey("darkdash-events");
    const stored = localStorage.getItem(key);
    const events = stored ? JSON.parse(stored) : {};
    
    const daysEvents = events[dateKey] || [];

    daysEvents.forEach((eventText, index) => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `
            <span>${eventText}</span>
            <button class="btn btn-sm btn-danger" onclick="deleteEvent('${dateKey}', ${index})">×</button>
        `;
        eventList.appendChild(li);
    });
}

// Přidání nové události
function addEvent() {
    const timeInput = document.getElementById("eventTime");
    const textInput = document.getElementById("eventInput");
    
    const time = timeInput.value;          // Získá čas (např. "14:30" nebo prázdné)
    const text = textInput.value.trim();   // Získá text události

    if (!text || !selectedDateKey) return; // Pokud není text nebo vybrané datum, nic nedělej

    const key = window.getAppKey("darkdash-events");
    const stored = localStorage.getItem(key);
    const events = stored ? JSON.parse(stored) : {};
    
    if (!events[selectedDateKey]) {
        events[selectedDateKey] = [];
    }

    // Pokud je čas vyplněný, spojíme ho s textem. Jinak uložíme jen text.
    let finalEventString;
    if (time) {
        finalEventString = `${time} - ${text}`;
    } else {
        finalEventString = text;
    }

    events[selectedDateKey].push(finalEventString);
    
    // Volitelné: Seřadit události podle času (pokud začínají časem)
    events[selectedDateKey].sort(); 

    localStorage.setItem(key, JSON.stringify(events));
    
    // 2. CLOUD SAVE
    if (window.saveToCloud) window.saveToCloud('events', events); // Pozn: modul se jmenuje 'events', soubor 'calendar.js'

    // Vyčištění políček
    textInput.value = "";
    timeInput.value = "";
    
    renderEvents(selectedDateKey); // Aktualizovat seznam
    renderCalendar(); // Aktualizovat tečky v kalendáři
}

// Smazání události
function deleteEvent(dateKey, index) {
    const key = window.getAppKey("darkdash-events");
    const stored = localStorage.getItem(key);
    const events = stored ? JSON.parse(stored) : {};
    
    if (events[dateKey]) {
        events[dateKey].splice(index, 1);
        
        // Pokud je pole prázdné, smaž klíč úplně (aby zmizela tečka)
        if (events[dateKey].length === 0) {
            delete events[dateKey];
        }

        localStorage.setItem(key, JSON.stringify(events));
        
        // CLOUD SAVE
        if (window.saveToCloud) window.saveToCloud('events', events);
        
        renderEvents(dateKey);
        renderCalendar();
    }
}

// 3. REAKCE NA PŘIHLÁŠENÍ
document.addEventListener("darkdash-reload", () => {
    // Reset výběru při změně uživatele
    selectedDateKey = null;
    const eventSection = document.getElementById("eventSection");
    if(eventSection) eventSection.style.display = "none";
    
    renderCalendar();
});