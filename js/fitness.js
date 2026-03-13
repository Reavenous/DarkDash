let workouts = [];
let diet = [];
let challenges = [];

// ══════════════════════════════════════════════
//  DEFAULTNI VYZVY
// ══════════════════════════════════════════════
const defaultChallenges = [
    { id: 1, text: "30 dni drepovani", done: false, xp: 200 },
    { id: 2, text: "Ubehni 50 km tento mesic", done: false, xp: 300 },
    { id: 3, text: "1000 kliku za tyden", done: false, xp: 150 },
    { id: 4, text: "Zadny cukr 7 dni", done: false, xp: 100 },
    { id: 5, text: "Kazdy den 10 000 kroku tyden", done: false, xp: 150 },
    { id: 6, text: "Pij 2l vody 14 dni v rade", done: false, xp: 100 }
];

// ══════════════════════════════════════════════
//  LOAD & SAVE
// ══════════════════════════════════════════════
function loadFitness() {
    const wKey = window.getAppKey("darkdash-fitness-v2");
    const storedWorkouts = localStorage.getItem(wKey);
    workouts = storedWorkouts ? JSON.parse(storedWorkouts) : [];

    const dKey = window.getAppKey("darkdash-diet");
    const storedDiet = localStorage.getItem(dKey);
    diet = storedDiet ? JSON.parse(storedDiet) : [];

    const cKey = window.getAppKey("darkdash-challenges");
    const storedChallenges = localStorage.getItem(cKey);
    if (storedChallenges) {
        challenges = JSON.parse(storedChallenges);
    } else {
        challenges = JSON.parse(JSON.stringify(defaultChallenges));
    }

    const fitDateEl = document.getElementById("fitDate");
    if (fitDateEl) fitDateEl.value = new Date().toISOString().split('T')[0];

    toggleFitInputs();
    renderFitnessLogs();
    updateStats();
    populateExerciseSelect();
    renderDiet();
    renderChallenges();
    renderActivityHeatmap();
    updateStreakBadge();
    _injectFitnessStyles();
}

function saveFitness() {
    const key = window.getAppKey("darkdash-fitness-v2");
    localStorage.setItem(key, JSON.stringify(workouts));
    if (window.saveToCloud) window.saveToCloud('fitness', workouts);
    updateStats();
    renderActivityHeatmap();
    updateStreakBadge();
}

function saveDiet() {
    const key = window.getAppKey("darkdash-diet");
    localStorage.setItem(key, JSON.stringify(diet));
    if (window.saveToCloud) window.saveToCloud('diet', diet);
    renderDiet();
}

function saveChallenges() {
    const key = window.getAppKey("darkdash-challenges");
    localStorage.setItem(key, JSON.stringify(challenges));
    if (window.saveToCloud) window.saveToCloud('challenges', challenges);
    renderChallenges();
}

// ══════════════════════════════════════════════
//  TOGGLE INPUTS
// ══════════════════════════════════════════════
function toggleFitInputs() {
    const cat = document.getElementById("fitCategory").value;
    document.querySelectorAll('.fit-inputs').forEach(el => el.style.display = 'none');
    if (cat === 'strength') document.getElementById('inputStrength').style.display = 'block';
    else if (cat === 'cardio') document.getElementById('inputCardio').style.display = 'block';
    else if (cat === 'calisthenics') document.getElementById('inputCalisthenics').style.display = 'block';
    else if (cat === 'sport') document.getElementById('inputSport').style.display = 'block';
}

// ══════════════════════════════════════════════
//  ADD FITNESS LOG
// ══════════════════════════════════════════════
function addFitnessLog() {
    const date = document.getElementById("fitDate").value;
    const category = document.getElementById("fitCategory").value;
    const exercise = document.getElementById("fitExercise").value.trim();
    const note = document.getElementById("fitNote").value.trim();

    if (!date || !exercise) {
        _showToast("Vyplň datum a název aktivity.", "warning");
        return;
    }

    let details = {};
    let valueForChart = 0;

    if (category === 'strength') {
        const weight = parseFloat(document.getElementById("valWeight").value) || 0;
        const reps = parseInt(document.getElementById("valReps").value) || 0;
        const sets = parseInt(document.getElementById("valSets") ? document.getElementById("valSets").value : 1) || 1;
        details = { weight, reps, sets };
        valueForChart = weight;
    } else if (category === 'cardio') {
        const dist = parseFloat(document.getElementById("valDist").value) || 0;
        const time = document.getElementById("valTime").value || "";
        const pace = _calcPace(dist, time);
        details = { dist, time, pace };
        valueForChart = dist;
    } else if (category === 'calisthenics') {
        const count = parseInt(document.getElementById("valCount").value) || 0;
        details = { count };
        valueForChart = count;
    } else if (category === 'sport') {
        const score = parseInt(document.getElementById("valScore").value) || 0;
        details = { score };
        valueForChart = score;
    }

    const newWorkout = {
        id: Date.now(),
        date,
        exercise,
        category,
        details,
        chartValue: valueForChart,
        note
    };

    workouts.unshift(newWorkout);

    if (window.addXP) window.addXP(50, "Trénink dokončen");
    _showToast(`${exercise} uloženo! +50 XP`, "success");

    _checkPersonalRecord(newWorkout);

    saveFitness();
    renderFitnessLogs();
    populateExerciseSelect();

    document.querySelectorAll('.fit-inputs input').forEach(i => i.value = '');
    document.getElementById("fitNote").value = '';

    const btn = document.querySelector('[onclick="addFitnessLog()"]');
    if (btn) {
        btn.classList.add('btn-pulse');
        setTimeout(() => btn.classList.remove('btn-pulse'), 600);
    }
}

// ══════════════════════════════════════════════
//  RENDER FITNESS LOGS
// ══════════════════════════════════════════════
function renderFitnessLogs() {
    const container = document.getElementById("fitnessLogContainer");
    if (!container) return;
    container.innerHTML = "";

    const grouped = {};
    workouts.forEach(log => {
        if (!grouped[log.date]) grouped[log.date] = [];
        grouped[log.date].push(log);
    });

    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

    if (sortedDates.length === 0) {
        container.innerHTML = `
            <div class="fit-empty-state">
                <img src="assets/icons/edit.png" class="fit-empty-icon-img" alt="">
                <div class="fit-empty-title">Žádné tréninky zatím</div>
                <div class="fit-empty-sub">Přidej svůj první záznam a začni sledovat progres!</div>
            </div>`;
        return;
    }

    const catColors = { strength: '#ffc107', cardio: '#0dcaf0', calisthenics: '#198754', sport: '#6f42c1' };
    const catLabels = { strength: 'Síla', cardio: 'Kardio', calisthenics: 'Kalistenika', sport: 'Sport' };

    sortedDates.forEach((date, idx) => {
        const dayLogs = grouped[date];
        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' });
        const isToday = date === new Date().toISOString().split('T')[0];

        const dayCard = document.createElement("div");
        dayCard.className = "fit-day-card";
        dayCard.style.animationDelay = `${idx * 40}ms`;

        let dayHTML = `
            <div class="fit-day-header">
                <span class="fit-day-name text-capitalize">${dayName}</span>
                ${isToday ? '<span class="fit-today-badge">DNES</span>' : ''}
                <span class="fit-day-count">${dayLogs.length} ${dayLogs.length === 1 ? 'aktivita' : 'aktivity'}</span>
            </div>`;

        dayLogs.forEach(log => {
            let iconHtml = '';
            let detailText = "";
            const color = catColors[log.category] || '#aaa';

            if (log.category === 'strength') {
                iconHtml = ICONS?.fit?.strength || '<img src="assets/icons/strength.png" style="width:18px;">';
                const vol = ((log.details.weight * log.details.reps * (log.details.sets || 1)) / 1000).toFixed(2);
                detailText = `<span style="color:${color}">${log.details.weight}kg</span> x ${log.details.reps} reps${log.details.sets > 1 ? ` x ${log.details.sets} sérií` : ''} <span class="fit-volume-badge">${vol}t</span>`;
            } else if (log.category === 'cardio') {
                iconHtml = ICONS?.fit?.cardio || '<img src="assets/icons/cardio.png" style="width:18px;">';
                detailText = `<span style="color:${color}">${log.details.dist}km</span> · ${log.details.time}${log.details.pace ? ` · <span class="text-muted">${log.details.pace}/km</span>` : ''}`;
            } else if (log.category === 'calisthenics') {
                iconHtml = ICONS?.fit?.calisthenics || '<img src="assets/icons/calisthenics.png" style="width:18px;">';
                detailText = `<span style="color:${color}">${log.details.count} reps</span>`;
            } else if (log.category === 'sport') {
                iconHtml = ICONS?.fit?.sport || '<img src="assets/icons/sport.png" style="width:18px;">';
                detailText = `Skóre: <span style="color:${color}">${log.details.score}</span>`;
            } else {
                iconHtml = ICONS?.fit?.energy || '<img src="assets/icons/energy.png" style="width:18px;">';
            }

            dayHTML += `
                <div class="fit-log-row" data-id="${log.id}">
                    <div class="fit-log-left">
                        <div class="fit-log-icon" style="border-color:${color}20; background:${color}15">${iconHtml}</div>
                        <div class="fit-log-info">
                            <div class="fit-log-name">${log.exercise}
                                <span class="fit-cat-pill" style="background:${color}22;color:${color}">${catLabels[log.category] || log.category}</span>
                            </div>
                            <div class="fit-log-detail">${detailText}${log.note ? ` <span class="fit-note">— ${log.note}</span>` : ''}</div>
                        </div>
                    </div>
                    <button class="fit-delete-btn" onclick="deleteFitnessLog(${log.id})" title="Smazat">×</button>
                </div>`;
        });

        dayCard.innerHTML = dayHTML;
        container.appendChild(dayCard);
    });
}

function deleteFitnessLog(id) {
    if (confirm("Smazat tento záznam?")) {
        workouts = workouts.filter(w => w.id !== id);
        saveFitness();
        renderFitnessLogs();
        populateExerciseSelect();
    }
}

// ══════════════════════════════════════════════
//  STREAK & HEATMAP
// ══════════════════════════════════════════════
function _getStreak() {
    if (!workouts.length) return 0;
    const days = [...new Set(workouts.map(w => w.date))].sort((a, b) => new Date(b) - new Date(a));
    let streak = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);
    for (let i = 0; i < days.length; i++) {
        const d = new Date(days[i]);
        d.setHours(0, 0, 0, 0);
        const diff = Math.round((current - d) / 86400000);
        if (diff <= 1) { streak++; current = d; } else break;
    }
    return streak;
}

function updateStreakBadge() {
    const streak = _getStreak();
    const el = document.getElementById("streakCount");
    if (el) el.innerText = streak;
    const fire = document.getElementById("streakFire");
    if (fire) fire.style.opacity = streak > 0 ? "1" : "0.3";
}

function renderActivityHeatmap() {
    const container = document.getElementById("activityHeatmap");
    if (!container) return;

    const today = new Date();
    const weeks = 16;
    const days = weeks * 7;
    const dateMap = {};
    workouts.forEach(w => { dateMap[w.date] = (dateMap[w.date] || 0) + 1; });

    let html = '<div class="heatmap-grid">';
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days + 1);

    const dayLabels = ['Po', '', 'St', '', 'Pá', '', 'Ne'];
    html += '<div class="heatmap-labels">';
    dayLabels.forEach(l => html += `<div class="heatmap-day-label">${l}</div>`);
    html += '</div><div class="heatmap-weeks">';

    for (let w = 0; w < weeks; w++) {
        html += '<div class="heatmap-col">';
        for (let d = 0; d < 7; d++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + w * 7 + d);
            const dateStr = date.toISOString().split('T')[0];
            const count = dateMap[dateStr] || 0;
            const level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4;
            const isFuture = date > today;
            html += `<div class="heatmap-cell level-${level}${isFuture ? ' future' : ''}" title="${dateStr}: ${count} trénink${count !== 1 ? 'ů' : ''}"></div>`;
        }
        html += '</div>';
    }

    html += '</div></div>';
    html += `<div class="heatmap-legend">
        <span class="text-muted small">Méně</span>
        ${[0,1,2,3,4].map(l => `<div class="heatmap-cell level-${l}"></div>`).join('')}
        <span class="text-muted small">Více</span>
    </div>`;

    container.innerHTML = html;
}

// ══════════════════════════════════════════════
//  STATS
// ══════════════════════════════════════════════
function updateStats() {
    const uniqueDays = new Set(workouts.map(w => w.date)).size;
    const statsTotal = document.getElementById("statTotalWorkouts");
    if (statsTotal) statsTotal.innerText = uniqueDays;

    const totalKm = workouts.filter(w => w.category === 'cardio').reduce((sum, w) => sum + (w.details.dist || 0), 0);
    const statsKm = document.getElementById("statTotalKm");
    if (statsKm) statsKm.innerText = totalKm.toFixed(1);

    const totalVol = workouts.filter(w => w.category === 'strength').reduce((sum, w) => sum + (w.details.weight * w.details.reps * (w.details.sets || 1)), 0);
    const statsVol = document.getElementById("statTotalVolume");
    if (statsVol) statsVol.innerText = (totalVol / 1000).toFixed(1) + 't';

    const totalReps = workouts.filter(w => w.category === 'calisthenics').reduce((sum, w) => sum + (w.details.count || 0), 0);
    const statsReps = document.getElementById("statTotalReps");
    if (statsReps) statsReps.innerText = totalReps;

    const weekEl = document.getElementById("statThisWeek");
    if (weekEl) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        weekStart.setHours(0, 0, 0, 0);
        const weekDays = new Set(workouts.filter(w => new Date(w.date) >= weekStart).map(w => w.date)).size;
        weekEl.innerText = weekDays;
    }
}

// ══════════════════════════════════════════════
//  CHART
// ══════════════════════════════════════════════
function populateExerciseSelect() {
    const select = document.getElementById("chartExerciseSelect");
    if (!select) return;
    const exercises = [...new Set(workouts.map(w => w.exercise))].sort();
    const currentVal = select.value;
    select.innerHTML = '<option value="">Vyber aktivitu...</option>';
    exercises.forEach(ex => {
        const option = document.createElement("option");
        option.value = ex;
        option.innerText = ex;
        select.appendChild(option);
    });
    if (currentVal && exercises.includes(currentVal)) select.value = currentVal;
}

let fitnessChart = null;
function updateChart() {
    const exName = document.getElementById("chartExerciseSelect").value;
    if (!exName) return;

    const dataPoints = workouts
        .filter(w => w.exercise === exName)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const labels = dataPoints.map(d => new Date(d.date).toLocaleDateString('cs-CZ'));
    const values = dataPoints.map(d => d.chartValue);

    const ctx = document.getElementById('fitnessChart').getContext('2d');
    if (fitnessChart) fitnessChart.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(255, 193, 7, 0.35)');
    gradient.addColorStop(1, 'rgba(255, 193, 7, 0.01)');

    fitnessChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: exName,
                data: values,
                borderColor: '#ffc107',
                backgroundColor: gradient,
                borderWidth: 2.5,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#ffc107',
                pointBorderColor: '#111',
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } },
                x: { grid: { display: false }, ticks: { color: '#888', maxRotation: 0 } }
            },
            plugins: {
                legend: { labels: { color: '#fff', font: { size: 13 } } },
                tooltip: { backgroundColor: '#1a1a1a', borderColor: '#ffc107', borderWidth: 1, titleColor: '#ffc107', bodyColor: '#fff' }
            }
        }
    });

    if (values.length > 0) {
        const max = Math.max(...values);
        const prIdx = values.lastIndexOf(max);
        const prEl = document.getElementById("chartPR");
        if (prEl) prEl.innerHTML = `Osobní rekord: <strong>${max}</strong> (${labels[prIdx]})`;
    }
}

// ══════════════════════════════════════════════
//  DIET — Open Food Facts API (free, bez klice)
// ══════════════════════════════════════════════
function addDietEntry() {
    const food = document.getElementById("dietFood").value.trim();
    const kcal = parseInt(document.getElementById("dietKcal").value);

    if (!food || isNaN(kcal)) {
        _showToast("Vyplň název jídla a kalorie.", "warning");
        return;
    }

    diet.unshift({
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        food,
        kcal
    });

    document.getElementById("dietFood").value = "";
    document.getElementById("dietKcal").value = "";
    document.getElementById("foodSearchResults").innerHTML = "";
    saveDiet();
    _showToast(`${food} přidáno (${kcal} kcal)`, "success");
}

let _dietSearchTimeout = null;
function searchFood(query) {
    clearTimeout(_dietSearchTimeout);
    const resultsEl = document.getElementById("foodSearchResults");
    if (!query || query.length < 2) { resultsEl.innerHTML = ""; return; }

    resultsEl.innerHTML = '<div class="food-search-loading">Hledám...</div>';

    _dietSearchTimeout = setTimeout(async () => {
        try {
            const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=6&fields=product_name,nutriments,brands`;
            const res = await fetch(url);
            const data = await res.json();

            if (!data.products || data.products.length === 0) {
                resultsEl.innerHTML = '<div class="food-search-empty">Nic nenalezeno. Zadej kalorie ručně.</div>';
                return;
            }

            resultsEl.innerHTML = "";
            data.products.forEach(p => {
                if (!p.product_name) return;
                const kcalPer100 = Math.round(p.nutriments?.['energy-kcal_100g'] || p.nutriments?.['energy-kcal'] || 0);
                const brand = p.brands ? `<span class="food-brand">${p.brands.split(',')[0]}</span>` : '';
                const item = document.createElement("div");
                item.className = "food-search-item";
                item.innerHTML = `
                    <div class="food-search-name">${p.product_name} ${brand}</div>
                    <div class="food-search-kcal">${kcalPer100 ? kcalPer100 + ' kcal/100g' : '? kcal'}</div>`;
                item.onclick = () => {
                    document.getElementById("dietFood").value = p.product_name;
                    if (kcalPer100) document.getElementById("dietKcal").value = kcalPer100;
                    resultsEl.innerHTML = "";
                };
                resultsEl.appendChild(item);
            });
        } catch (e) {
            resultsEl.innerHTML = '<div class="food-search-empty">Chyba připojení. Zadej kcal ručně.</div>';
        }
    }, 400);
}

function renderDiet() {
    const list = document.getElementById("dietList");
    const todayKcalDisplay = document.getElementById("dailyKcalDisplay");
    if (!list) return;

    list.innerHTML = "";
    const today = new Date().toISOString().split('T')[0];
    const todayItems = diet.filter(d => d.date === today);
    const totalKcal = todayItems.reduce((sum, item) => sum + item.kcal, 0);

    todayKcalDisplay.innerText = `${totalKcal} kcal`;

    const goal = parseInt(localStorage.getItem(window.getAppKey("darkdash-kcal-goal")) || 2500);
    const pct = Math.min(100, Math.round((totalKcal / goal) * 100));
    const ringEl = document.getElementById("kcalRingBar");
    if (ringEl) {
        const color = pct > 110 ? '#dc3545' : pct > 90 ? '#ffc107' : '#198754';
        ringEl.style.background = `conic-gradient(${color} ${pct * 3.6}deg, #1a1a1a 0deg)`;
    }
    const goalDisplay = document.getElementById("kcalGoalDisplay");
    if (goalDisplay) goalDisplay.innerText = `/ ${goal} kcal cíl`;

    todayItems.forEach(item => {
        const li = document.createElement("li");
        li.className = "diet-entry";
        li.innerHTML = `
            <div class="diet-entry-info">
                <span class="diet-entry-name">${item.food}</span>
                ${item.protein ? `<span class="diet-macro">B:${item.protein}g</span>` : ''}
                ${item.carbs ? `<span class="diet-macro">S:${item.carbs}g</span>` : ''}
                ${item.fat ? `<span class="diet-macro">T:${item.fat}g</span>` : ''}
            </div>
            <div class="d-flex align-items-center gap-2">
                <span class="diet-entry-kcal">${item.kcal} kcal</span>
                <button class="fit-delete-btn" onclick="deleteDietEntry(${item.id})">×</button>
            </div>`;
        list.appendChild(li);
    });

    if (todayItems.length === 0) {
        list.innerHTML = '<li class="diet-empty">Zatím žádné jídlo dnes. Přidej první!</li>';
    }
}

function deleteDietEntry(id) {
    diet = diet.filter(d => d.id !== id);
    saveDiet();
}

function setKcalGoal() {
    const goal = prompt("Nastav denní kalorický cíl (kcal):", localStorage.getItem(window.getAppKey("darkdash-kcal-goal")) || 2500);
    if (goal && !isNaN(goal)) {
        localStorage.setItem(window.getAppKey("darkdash-kcal-goal"), goal);
        renderDiet();
    }
}

// ══════════════════════════════════════════════
//  CHALLENGES
// ══════════════════════════════════════════════
function renderChallenges() {
    const container = document.getElementById("challengesContainer");
    if (!container) return;
    container.innerHTML = "";

    const done = challenges.filter(c => c.done).length;
    const total = challenges.length;

    const header = document.createElement("div");
    header.className = "challenges-header w-100 mb-3";
    header.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="text-muted small">Splněno ${done}/${total}</span>
            <span class="text-warning small">${Math.round((done/total)*100)}%</span>
        </div>
        <div class="challenges-progress-bar">
            <div class="challenges-progress-fill" style="width:${(done/total)*100}%"></div>
        </div>`;
    container.appendChild(header);

    challenges.forEach(ch => {
        const card = document.createElement("div");
        card.className = `challenge-card ${ch.done ? 'done' : ''}`;
        const iconHtml = ch.done
            ? (ICONS?.challenges?.done || '<img src="assets/icons/challenge-done.png" style="width:22px;">')
            : (ICONS?.challenges?.active || '<img src="assets/icons/challenge-done.png" style="width:22px; opacity:0.4;">');
        card.innerHTML = `
            <div class="challenge-icon-wrap">${iconHtml}</div>
            <div class="challenge-body">
                <div class="challenge-text">${ch.text}</div>
                <div class="challenge-xp">+${ch.xp || 100} XP</div>
            </div>
            <button class="challenge-btn ${ch.done ? 'done' : ''}" onclick="toggleChallenge(${ch.id})">
                ${ch.done ? 'Splněno' : 'Splnit'}
            </button>`;
        container.appendChild(card);
    });

    const addBtn = document.createElement("div");
    addBtn.className = "challenge-add-card";
    addBtn.innerHTML = `<span>+ Přidat výzvu</span>`;
    addBtn.onclick = addCustomChallenge;
    container.appendChild(addBtn);
}

function toggleChallenge(id) {
    const ch = challenges.find(c => c.id === id);
    if (ch) {
        ch.done = !ch.done;
        if (ch.done) {
            if (window.addXP) window.addXP(ch.xp || 100, `Výzva splněna: ${ch.text}`);
            _showToast(`Výzva splněna! +${ch.xp || 100} XP`, "success");
        }
        saveChallenges();
    }
}

function addCustomChallenge() {
    const text = prompt("Text výzvy:");
    if (!text) return;
    const xp = parseInt(prompt("Kolik XP za splnění?", "100")) || 100;
    challenges.push({ id: Date.now(), text, done: false, xp });
    saveChallenges();
}

// ══════════════════════════════════════════════
//  TOOLS — 1RM + BMI + TDEE
// ══════════════════════════════════════════════
function calculate1RM() {
    const w = parseFloat(document.getElementById("rmWeight").value);
    const r = parseInt(document.getElementById("rmReps").value);
    if (!w || !r) return;
    const oneRepMax = Math.round(w * (1 + r / 30));
    const resultEl = document.getElementById("rmResult");
    document.getElementById("rmValue").innerText = `${oneRepMax} kg`;
    resultEl.classList.remove("d-none");

    const percEl = document.getElementById("rmPercentages");
    if (percEl) {
        const percs = [100, 95, 90, 85, 80, 75, 70];
        percEl.innerHTML = percs.map(p => `
            <div class="rm-pct-row">
                <span class="rm-pct-label">${p}%</span>
                <span class="rm-pct-bar-wrap"><span class="rm-pct-bar" style="width:${p}%"></span></span>
                <span class="rm-pct-value">${Math.round(oneRepMax * p / 100)} kg</span>
            </div>`).join('');
    }
}

function calculateBMI() {
    const weight = parseFloat(document.getElementById("bmiWeight").value);
    const height = parseFloat(document.getElementById("bmiHeight").value) / 100;
    if (!weight || !height) return;

    const bmi = (weight / (height * height)).toFixed(1);
    let category, color;
    if (bmi < 18.5) { category = "Podváha"; color = "#0dcaf0"; }
    else if (bmi < 25) { category = "Normální váha"; color = "#198754"; }
    else if (bmi < 30) { category = "Nadváha"; color = "#ffc107"; }
    else { category = "Obezita"; color = "#dc3545"; }

    const el = document.getElementById("bmiResult");
    if (el) {
        el.classList.remove("d-none");
        el.innerHTML = `
            <div class="bmi-display" style="color:${color}">
                <span class="bmi-number">${bmi}</span>
                <span class="bmi-category">${category}</span>
            </div>`;
    }
}

function calculateTDEE() {
    const weight = parseFloat(document.getElementById("tdeeWeight").value);
    const height = parseFloat(document.getElementById("tdeeHeight").value);
    const age = parseInt(document.getElementById("tdeeAge").value);
    const gender = document.getElementById("tdeeGender").value;
    const activity = parseFloat(document.getElementById("tdeeActivity").value);

    if (!weight || !height || !age) return;

    let bmr;
    if (gender === 'm') bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    else bmr = 10 * weight + 6.25 * height - 5 * age - 161;

    const tdee = Math.round(bmr * activity);
    const el = document.getElementById("tdeeResult");
    if (el) {
        el.classList.remove("d-none");
        el.innerHTML = `
            <div class="tdee-display">
                <div class="tdee-main"><span class="tdee-number">${tdee}</span> kcal/den</div>
                <div class="tdee-breakdown">
                    <span class="tdee-goal loss">Hubnutí: ${tdee - 500} kcal</span>
                    <span class="tdee-goal maintain">Udržování: ${tdee} kcal</span>
                    <span class="tdee-goal gain">Nabírání: ${tdee + 300} kcal</span>
                </div>
            </div>`;
    }
}

// ══════════════════════════════════════════════
//  EXPORT / IMPORT
// ══════════════════════════════════════════════
function exportFitnessData() {
    const data = { workouts, diet, challenges, exportDate: new Date().toISOString(), version: "2.1" };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `darkdash_fitness_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    _showToast("Data exportována!", "success");
}

function importFitnessData(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.workouts) workouts = data.workouts;
            if (data.diet) diet = data.diet;
            if (data.challenges) challenges = data.challenges;
            saveFitness();
            saveDiet();
            saveChallenges();
            renderFitnessLogs();
            _showToast("Data úspěšně nahrána!", "success");
        } catch (err) {
            _showToast("Chyba při čtení souboru.", "error");
        }
    };
    reader.readAsText(file);
}

// ══════════════════════════════════════════════
//  HELPER UTILS
// ══════════════════════════════════════════════
function _calcPace(dist, timeStr) {
    if (!dist || !timeStr) return "";
    const parts = timeStr.split(':').map(Number);
    let totalMin = 0;
    if (parts.length === 2) totalMin = parts[0] + parts[1] / 60;
    else if (parts.length === 3) totalMin = parts[0] * 60 + parts[1] + parts[2] / 60;
    else return "";
    if (!totalMin || !dist) return "";
    const paceMin = Math.floor(totalMin / dist);
    const paceSec = Math.round(((totalMin / dist) - paceMin) * 60);
    return `${paceMin}:${paceSec.toString().padStart(2, '0')}`;
}

function _checkPersonalRecord(workout) {
    const same = workouts.filter(w => w.exercise === workout.exercise && w.id !== workout.id);
    if (same.length === 0) return;
    const prevMax = Math.max(...same.map(w => w.chartValue));
    if (workout.chartValue > prevMax) {
        _showToast(`Nový rekord! ${workout.exercise}: ${workout.chartValue}`, "pr");
    }
}

function _showToast(msg, type = "success") {
    let container = document.getElementById("fitToastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "fitToastContainer";
        container.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;";
        document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    const colors = { success: "#198754", warning: "#ffc107", error: "#dc3545", pr: "#6f42c1" };
    toast.style.cssText = `background:#1a1a1a;border-left:3px solid ${colors[type] || '#ffc107'};color:#fff;padding:10px 16px;border-radius:6px;font-size:14px;box-shadow:0 4px 20px rgba(0,0,0,0.5);animation:fitToastIn .25s ease;max-width:280px;`;
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = "0"; toast.style.transition = "opacity .3s"; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ══════════════════════════════════════════════
//  CSS INJECTION
// ══════════════════════════════════════════════
function _injectFitnessStyles() {
    if (document.getElementById("fit-enhanced-styles")) return;
    const style = document.createElement("style");
    style.id = "fit-enhanced-styles";
    style.textContent = `
        @keyframes fitToastIn { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes fitFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes btn-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        .btn-pulse { animation: btn-pulse .5s ease; }

        .fit-day-card {
            background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.07);
            border-radius: 12px; padding: 14px 16px; margin-bottom: 14px;
            animation: fitFadeUp .35s ease both;
        }
        .fit-day-header { display: flex; align-items: center; gap: 10px; padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .fit-day-name { color: #0dcaf0; font-weight: 600; font-size: 13px; text-transform: capitalize; flex: 1; }
        .fit-today-badge { background: #ffc10720; color: #ffc107; border: 1px solid #ffc10740; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 99px; letter-spacing: 1px; }
        .fit-day-count { color: #555; font-size: 12px; }

        .fit-log-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .fit-log-row:last-child { border-bottom: none; padding-bottom: 0; }
        .fit-log-left { display: flex; align-items: center; gap: 12px; }
        .fit-log-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; border: 1px solid transparent; flex-shrink: 0; }
        .fit-log-icon img { width: 18px; height: 18px; }
        .fit-log-name { font-weight: 600; color: #eee; font-size: 14px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .fit-log-detail { font-size: 12px; color: #888; margin-top: 2px; }
        .fit-cat-pill { font-size: 10px; padding: 1px 7px; border-radius: 99px; font-weight: 600; }
        .fit-volume-badge { font-size: 10px; background: rgba(255,255,255,0.07); color: #aaa; padding: 1px 6px; border-radius: 99px; }
        .fit-note { color: #555; font-style: italic; }
        .fit-delete-btn { background: none; border: none; color: #555; font-size: 18px; line-height: 1; cursor: pointer; padding: 0 4px; border-radius: 4px; transition: color .2s; }
        .fit-delete-btn:hover { color: #dc3545; }

        .fit-empty-state { text-align: center; padding: 60px 20px; }
        .fit-empty-icon-img { width: 40px; opacity: 0.3; margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto; }
        .fit-empty-title { color: #eee; font-size: 16px; font-weight: 600; margin-bottom: 6px; }
        .fit-empty-sub { color: #555; font-size: 13px; }

        .heatmap-grid { display: flex; gap: 4px; align-items: flex-start; overflow-x: auto; padding-bottom: 4px; }
        .heatmap-labels { display: flex; flex-direction: column; gap: 3px; padding-top: 2px; }
        .heatmap-day-label { font-size: 9px; color: #555; height: 12px; display: flex; align-items: center; }
        .heatmap-weeks { display: flex; gap: 3px; }
        .heatmap-col { display: flex; flex-direction: column; gap: 3px; }
        .heatmap-cell { width: 12px; height: 12px; border-radius: 2px; cursor: default; transition: transform .15s; }
        .heatmap-cell:hover { transform: scale(1.4); }
        .heatmap-cell.level-0 { background: #1a1a1a; }
        .heatmap-cell.level-1 { background: #1a4a2a; }
        .heatmap-cell.level-2 { background: #1d7a3a; }
        .heatmap-cell.level-3 { background: #25a84a; }
        .heatmap-cell.level-4 { background: #2ecc61; }
        .heatmap-cell.future { opacity: 0.2; }
        .heatmap-legend { display: flex; align-items: center; gap: 4px; margin-top: 8px; }

        #streakFire { transition: opacity .3s; }

        .diet-entry { list-style: none; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between; animation: fitFadeUp .3s ease both; }
        .diet-entry-info { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .diet-entry-name { color: #eee; font-size: 14px; }
        .diet-entry-kcal { color: #dc3545; font-weight: 700; font-size: 14px; }
        .diet-macro { font-size: 10px; background: rgba(255,255,255,0.06); color: #888; padding: 2px 6px; border-radius: 99px; }
        .diet-empty { list-style: none; text-align: center; color: #555; padding: 30px; font-size: 13px; }

        #foodSearchResults { max-height: 200px; overflow-y: auto; border-radius: 8px; margin-top: 4px; }
        .food-search-item { padding: 8px 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; transition: background .15s; }
        .food-search-item:hover { background: rgba(255,255,255,0.06); }
        .food-search-name { font-size: 13px; color: #eee; }
        .food-brand { font-size: 11px; color: #666; margin-left: 4px; }
        .food-search-kcal { font-size: 12px; color: #ffc107; font-weight: 600; flex-shrink: 0; }
        .food-search-loading, .food-search-empty { padding: 10px; color: #666; font-size: 13px; text-align: center; }

        #kcalRingBar { width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; transition: background 0.5s ease; }
        .kcal-ring-inner { width: 72px; height: 72px; background: #111; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }

        .challenges-header { padding: 0 4px; }
        .challenges-progress-bar { height: 4px; background: #1a1a1a; border-radius: 99px; overflow: hidden; }
        .challenges-progress-fill { height: 100%; background: linear-gradient(90deg, #198754, #2ecc61); border-radius: 99px; transition: width .5s ease; }
        .challenge-card { background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; width: 100%; transition: border-color .2s, background .2s; animation: fitFadeUp .3s ease both; }
        .challenge-card.done { border-color: rgba(25,135,84,0.4); background: rgba(25,135,84,0.08); }
        .challenge-icon-wrap { width: 28px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .challenge-icon-wrap img { width: 22px; height: 22px; }
        .challenge-body { flex: 1; }
        .challenge-text { color: #eee; font-size: 14px; font-weight: 500; }
        .challenge-xp { color: #ffc107; font-size: 11px; margin-top: 2px; }
        .challenge-btn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #aaa; font-size: 12px; padding: 5px 14px; border-radius: 99px; cursor: pointer; transition: all .2s; white-space: nowrap; }
        .challenge-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .challenge-btn.done { background: rgba(25,135,84,0.2); border-color: #198754; color: #2ecc61; }
        .challenge-add-card { background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; padding: 14px; text-align: center; cursor: pointer; color: #555; font-size: 13px; width: 100%; transition: all .2s; }
        .challenge-add-card:hover { border-color: rgba(255,255,255,0.25); color: #aaa; }

        .rm-pct-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .rm-pct-label { color: #888; font-size: 12px; width: 34px; text-align: right; flex-shrink: 0; }
        .rm-pct-bar-wrap { flex: 1; height: 6px; background: rgba(255,255,255,0.07); border-radius: 99px; overflow: hidden; }
        .rm-pct-bar { height: 100%; background: linear-gradient(90deg, #ffc107, #fd7e14); border-radius: 99px; }
        .rm-pct-value { color: #ffc107; font-size: 12px; font-weight: 600; width: 50px; flex-shrink: 0; }

        .bmi-display { text-align: center; padding: 16px; }
        .bmi-number { font-size: 48px; font-weight: 700; display: block; }
        .bmi-category { font-size: 14px; opacity: .8; }
        .tdee-display { text-align: center; }
        .tdee-main { font-size: 28px; font-weight: 700; color: #fff; margin-bottom: 12px; }
        .tdee-number { font-size: 42px; color: #ffc107; }
        .tdee-breakdown { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
        .tdee-goal { font-size: 12px; padding: 4px 12px; border-radius: 99px; font-weight: 600; }
        .tdee-goal.loss { background: rgba(13,202,240,0.15); color: #0dcaf0; }
        .tdee-goal.maintain { background: rgba(25,135,84,0.15); color: #2ecc61; }
        .tdee-goal.gain { background: rgba(255,193,7,0.15); color: #ffc107; }
    `;
    document.head.appendChild(style);
}

// ══════════════════════════════════════════════
//  EVENTS
// ══════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", loadFitness);
document.addEventListener("darkdash-reload", loadFitness);