let journalCurrentDate = new Date();
let journalSelectedDateKey = null;
let currentRating = 0; 

// --- RENDER KALENDÁŘE PRO DENÍK ---
function renderJournalCalendar() {
    console.log("Vykresluji Deník..."); // Debug

    const year = journalCurrentDate.getFullYear();
    const month = journalCurrentDate.getMonth();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthNames = ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"];
    
    // Ochrana, kdyby element neexistoval
    const titleEl = document.getElementById("journalMonthYearDisplay");
    if(titleEl) titleEl.innerText = `${monthNames[month]} ${year}`;

    const grid = document.getElementById("journalGrid");
    if(!grid) return; // Pokud grid není, končíme
    
    grid.innerHTML = "";

    const dayNames = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
    dayNames.forEach(day => {
        const div = document.createElement("div");
        div.className = "calendar-header";
        div.innerText = day;
        grid.appendChild(div);
    });

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    for (let i = 0; i < adjustedFirstDay; i++) {
        grid.appendChild(document.createElement("div"));
    }

    const journalData = JSON.parse(localStorage.getItem("darkdash-journal")) || {};

    for (let day = 1; day <= daysInMonth; day++) {
        const div = document.createElement("div");
        div.className = "calendar-day journal-day";
        div.innerText = day;

        const thisDate = new Date(year, month, day);
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        if (thisDate > today) {
            div.classList.add("locked");
            div.title = "Budoucnost nelze hodnotit";
        } else {
            if (journalData[dateKey]) {
                const rating = journalData[dateKey].rating;
                div.classList.add(`rating-${rating}`);
            }
            div.onclick = () => openJournalEditor(dateKey);
        }

        grid.appendChild(div);
    }
}

function changeJournalMonth(dir) {
    journalCurrentDate.setMonth(journalCurrentDate.getMonth() + dir);
    renderJournalCalendar();
}

// --- EDITOR ZÁPISU ---
function openJournalEditor(dateKey) {
    journalSelectedDateKey = dateKey;
    const journalData = JSON.parse(localStorage.getItem("darkdash-journal")) || {};
    const entry = journalData[dateKey] || { rating: 0, positive: "", negative: "" };

    const [y, m, d] = dateKey.split("-");
    document.getElementById("journalEditorTitle").innerText = `Zápis pro ${d}.${m}.${y}`;

    document.getElementById("journalPositive").value = entry.positive || "";
    document.getElementById("journalNegative").value = entry.negative || "";

    setRating(entry.rating);

    // Zavřít kalendář a otevřít editor
    // Používáme Bootstrap API pro přepínání modalů
    const calendarModalEl = document.getElementById('journalCalendarModal');
    const calendarModal = bootstrap.Modal.getInstance(calendarModalEl);
    if(calendarModal) calendarModal.hide();

    const editorModal = new bootstrap.Modal(document.getElementById('journalEditorModal'));
    editorModal.show();
}

function setRating(rating) {
    currentRating = rating;
    const stars = document.querySelectorAll("#starContainer .star-rating");
    const ratingText = document.getElementById("ratingText");

    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add("active");
            star.innerText = "★";
        } else {
            star.classList.remove("active");
            star.innerText = "☆";
        }
    });

    const labels = ["Nehodnoceno", "Hrozný den (1*)", "Nic moc (2*)", "Ušlo to (3*)", "Dobrý den (4*)", "Skvělý den! (5*)"];
    ratingText.innerText = labels[rating] || "Nehodnoceno";
    
    const colors = ["gray", "#f08080", "#d35400", "#daa520", "#90ee90", "#556b2f"];
    ratingText.style.color = colors[rating];
}

function saveJournalEntry() {
    if (!journalSelectedDateKey) return;

    const positive = document.getElementById("journalPositive").value;
    const negative = document.getElementById("journalNegative").value;

    const journalData = JSON.parse(localStorage.getItem("darkdash-journal")) || {};

    journalData[journalSelectedDateKey] = {
        rating: currentRating,
        positive: positive,
        negative: negative
    };

    localStorage.setItem("darkdash-journal", JSON.stringify(journalData));

    // Zavřít editor a vrátit se do kalendáře
    const editorModalEl = document.getElementById('journalEditorModal');
    const editorModal = bootstrap.Modal.getInstance(editorModalEl);
    if(editorModal) editorModal.hide();

    // Znovu otevřít kalendář
    const calendarModal = new bootstrap.Modal(document.getElementById('journalCalendarModal'));
    calendarModal.show();
    
    // Počkat chvilku a překreslit (protože modal se otevírá animací)
    setTimeout(renderJournalCalendar, 200);
}

// --- SPUŠTĚNÍ ---
document.addEventListener("DOMContentLoaded", () => {
    // Zkusíme vykreslit hned
    renderJournalCalendar();

    // Důležité: Přidáme listener, který vykreslí kalendář až když se modal skutečně otevře
    const modalEl = document.getElementById('journalCalendarModal');
    if (modalEl) {
        modalEl.addEventListener('shown.bs.modal', () => {
            console.log("Modal otevřen, kreslím...");
            renderJournalCalendar();
        });
    }
});