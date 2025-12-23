let journalCurrentDate = new Date();
let journalSelectedDateKey = null;
let currentRating = 0; 

function renderJournalCalendar() {
    // 1. NAČTENÍ DAT S UNIKÁTNÍM KLÍČEM
    const key = window.getAppKey ? window.getAppKey("darkdash-journal") : "darkdash-journal";
    const journalData = JSON.parse(localStorage.getItem(key)) || {};
    const stored = localStorage.getItem(key);
    

    const year = journalCurrentDate.getFullYear();
    const month = journalCurrentDate.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthNames = ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"];
    const titleEl = document.getElementById("journalMonthYearDisplay");
    if(titleEl) titleEl.innerText = `${monthNames[month]} ${year}`;

    const grid = document.getElementById("journalGrid");
    if(!grid) return;
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

function openJournalEditor(dateKey) {
    journalSelectedDateKey = dateKey;
    
    // ZNOVU NAČÍST, ABYCHOM MĚLI AKTUÁLNÍ DATA
    const key = window.getAppKey("darkdash-journal");
    const stored = localStorage.getItem(key);
    const journalData = stored ? JSON.parse(stored) : {};
    
    const entry = journalData[dateKey] || { rating: 0, positive: "", negative: "" };

    const [y, m, d] = dateKey.split("-");
    document.getElementById("journalEditorTitle").innerText = `Zápis pro ${d}.${m}.${y}`;

    document.getElementById("journalPositive").value = entry.positive || "";
    document.getElementById("journalNegative").value = entry.negative || "";

    setRating(entry.rating);

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

    const key = window.getAppKey("darkdash-journal");
    const journalData = JSON.parse(localStorage.getItem(key)) || {};
    const stored = localStorage.getItem(key);

    journalData[journalSelectedDateKey] = {
        rating: currentRating,
        positive: positive,
        negative: negative
    };

    localStorage.setItem(key, JSON.stringify(journalData));
    if(window.saveToCloud) window.saveToCloud("journal", journalData); // CLOUD SAVE

    const editorModalEl = document.getElementById('journalEditorModal');
    const editorModal = bootstrap.Modal.getInstance(editorModalEl);
    if(editorModal) editorModal.hide();

    const calendarModal = new bootstrap.Modal(document.getElementById('journalCalendarModal'));
    calendarModal.show();
    
    setTimeout(renderJournalCalendar, 200);
    window.addXP(30, "Zápis do deníku");
}

document.addEventListener("DOMContentLoaded", () => {
    renderJournalCalendar();
    const modalEl = document.getElementById('journalCalendarModal');
    if (modalEl) {
        modalEl.addEventListener('shown.bs.modal', renderJournalCalendar);
    }
});

// REAKCE NA PŘIHLÁŠENÍ
document.addEventListener("DOMContentLoaded", renderJournalCalendar);
document.addEventListener("darkdash-reload", renderJournalCalendar);