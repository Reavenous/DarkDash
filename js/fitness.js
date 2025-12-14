let workouts = [];
let diet = [];
let challenges = [
    { id: 1, text: "30 dní dřepování", done: false },
    { id: 2, text: "Uběhni 50 km tento měsíc", done: false },
    { id: 3, text: "1000 kliků za týden", done: false },
    { id: 4, text: "Žádný cukr 7 dní", done: false }
];
let fitnessChart = null;

// --- INIT ---
function loadFitness() {
    // Načtení Tréninků
    const stored = localStorage.getItem("darkdash-fitness-v2");
    if (stored) workouts = JSON.parse(stored);
    
    // Načtení Jídla
    const storedDiet = localStorage.getItem("darkdash-diet");
    if (storedDiet) diet = JSON.parse(storedDiet);

    // Načtení Výzev (pokud nejsou, použijeme default)
    const storedChallenges = localStorage.getItem("darkdash-challenges");
    if (storedChallenges) challenges = JSON.parse(storedChallenges);

    // Defaultně dnešní datum
    const today = new Date().toISOString().split('T')[0];
    const fitDateEl = document.getElementById("fitDate");
    if(fitDateEl) fitDateEl.value = today;
    
    toggleFitInputs();
    renderFitnessLogs();
    updateStats();
    populateExerciseSelect();
    renderDiet();
    renderChallenges();
}

function saveFitness() {
    localStorage.setItem("darkdash-fitness-v2", JSON.stringify(workouts));
    updateStats();
}

function saveDiet() {
    localStorage.setItem("darkdash-diet", JSON.stringify(diet));
    renderDiet();
}

function saveChallenges() {
    localStorage.setItem("darkdash-challenges", JSON.stringify(challenges));
    renderChallenges();
}

// --- PŘEPÍNÁNÍ UI ---
function toggleFitInputs() {
    const cat = document.getElementById("fitCategory").value;
    document.querySelectorAll('.fit-inputs').forEach(el => el.style.display = 'none');
    
    if (cat === 'strength') document.getElementById('inputStrength').style.display = 'block';
    else if (cat === 'cardio') document.getElementById('inputCardio').style.display = 'block';
    else if (cat === 'calisthenics') document.getElementById('inputCalisthenics').style.display = 'block';
    else if (cat === 'sport') document.getElementById('inputSport').style.display = 'block';
}

// --- PŘIDÁNÍ TRÉNINKU ---
function addFitnessLog() {
    const date = document.getElementById("fitDate").value;
    const category = document.getElementById("fitCategory").value;
    const exercise = document.getElementById("fitExercise").value.trim();
    const note = document.getElementById("fitNote").value.trim();

    if (!date || !exercise) {
        alert("Vyplň datum a název aktivity.");
        return;
    }

    let details = {};
    let valueForChart = 0;

    if (category === 'strength') {
        const weight = parseFloat(document.getElementById("valWeight").value) || 0;
        const reps = parseInt(document.getElementById("valReps").value) || 0;
        details = { weight, reps };
        valueForChart = weight;
    } 
    else if (category === 'cardio') {
        const dist = parseFloat(document.getElementById("valDist").value) || 0;
        const time = document.getElementById("valTime").value || "";
        details = { dist, time };
        valueForChart = dist;
    }
    else if (category === 'calisthenics') {
        const count = parseInt(document.getElementById("valCount").value) || 0;
        details = { count };
        valueForChart = count;
    }
    else if (category === 'sport') {
        const score = parseInt(document.getElementById("valScore").value) || 0;
        details = { score };
        valueForChart = score;
    }

    workouts.unshift({
        id: Date.now(),
        date: date,
        exercise: exercise,
        category: category,
        details: details,
        chartValue: valueForChart,
        note: note
    });

    saveFitness();
    renderFitnessLogs();
    populateExerciseSelect();

    // Vyčistit hodnoty (ale ne datum a kategorii)
    document.querySelectorAll('.fit-inputs input').forEach(i => i.value = '');
    document.getElementById("fitNote").value = '';
}

// --- VYKRESLENÍ DENÍKU (S IKONAMI) ---
function renderFitnessLogs() {
    const container = document.getElementById("fitnessLogContainer");
    if(!container) return;
    container.innerHTML = "";

    const grouped = {};
    workouts.forEach(log => {
        if (!grouped[log.date]) grouped[log.date] = [];
        grouped[log.date].push(log);
    });

    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

    if (sortedDates.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-5">Zatím žádné tréninky. Makej! 💪</div>';
        return;
    }

    sortedDates.forEach(date => {
        const dayLogs = grouped[date];
        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' });

        const dayCard = document.createElement("div");
        dayCard.className = "mb-4 bg-black bg-opacity-25 border border-secondary rounded p-3";
        
        let dayHTML = `<h6 class="text-info border-bottom border-secondary pb-2 mb-3 text-capitalize">${dayName}</h6>`;
        
        dayLogs.forEach(log => {
            let detailText = "";
            // VÝMĚNA EMOJI ZA OBRÁZKY Z ICONS
            let iconHtml = ICONS.fit.energy; // Default

            if (log.category === 'strength') {
                iconHtml = ICONS.fit.strength;
                detailText = `<span class="text-warning">${log.details.weight}kg</span> x ${log.details.reps}`;
            } else if (log.category === 'cardio') {
                iconHtml = ICONS.fit.cardio;
                detailText = `<span class="text-info">${log.details.dist}km</span> (${log.details.time})`;
            } else if (log.category === 'calisthenics') {
                iconHtml = ICONS.fit.calisthenics;
                detailText = `<span class="text-success">${log.details.count} reps</span>`;
            } else if (log.category === 'sport') {
                iconHtml = ICONS.fit.sport;
                detailText = `Skóre: <span class="text-light">${log.details.score}</span>`;
            }

            dayHTML += `
                <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-25">
                    <div class="d-flex align-items-center gap-3">
                        <div class="fit-icon-wrapper">${iconHtml}</div>
                        <div>
                            <div class="fw-bold text-light">${log.exercise}</div>
                            <div class="small text-muted">${detailText} ${log.note ? '<span class="fst-italic text-secondary"> - ' + log.note + '</span>' : ''}</div>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-outline-danger border-0 opacity-50" onclick="deleteFitnessLog(${log.id})">×</button>
                </div>
            `;
        });

        dayCard.innerHTML = dayHTML;
        container.appendChild(dayCard);
    });
}

function deleteFitnessLog(id) {
    if(confirm("Smazat tento záznam?")) {
        workouts = workouts.filter(w => w.id !== id);
        saveFitness();
        renderFitnessLogs();
    }
}

// --- JÍDLO (DIET) ---
function addDietEntry() {
    const food = document.getElementById("dietFood").value.trim();
    const kcal = parseInt(document.getElementById("dietKcal").value);

    if(!food || isNaN(kcal)) return;

    diet.unshift({
        id: Date.now(),
        date: new Date().toISOString().split('T')[0], // Dnešek
        food: food,
        kcal: kcal
    });

    document.getElementById("dietFood").value = "";
    document.getElementById("dietKcal").value = "";
    saveDiet();
}

function renderDiet() {
    const list = document.getElementById("dietList");
    const todayKcalDisplay = document.getElementById("dailyKcalDisplay");
    if(!list) return;

    list.innerHTML = "";
    
    // Filtrujeme jen dnešek
    const today = new Date().toISOString().split('T')[0];
    const todayItems = diet.filter(d => d.date === today);
    const totalKcal = todayItems.reduce((sum, item) => sum + item.kcal, 0);

    todayKcalDisplay.innerText = `${totalKcal} kcal`;

    todayItems.forEach(item => {
        const li = document.createElement("li");
        li.className = "list-group-item bg-transparent text-light border-bottom border-secondary d-flex justify-content-between";
        li.innerHTML = `<span>${item.food}</span> <span class="text-danger fw-bold">${item.kcal} kcal</span>`;
        list.appendChild(li);
    });
}

// --- VÝZVY (CHALLENGES) ---
function renderChallenges() {
    const container = document.getElementById("challengesContainer");
    if(!container) return;
    container.innerHTML = "";

    challenges.forEach(ch => {
        const card = document.createElement("div");
        card.className = `p-3 border rounded text-center ${ch.done ? 'border-success bg-success bg-opacity-10' : 'border-secondary bg-black bg-opacity-25'}`;
        card.style.width = "200px";
        
        // VÝMĚNA EMOJI ZA OBRÁZKY
        const iconHtml = ch.done ? ICONS.challenges.done : ICONS.challenges.active;
        
        card.innerHTML = `
            <div class="mb-2">${iconHtml}</div>
            <div class="fw-bold mb-2">${ch.text}</div>
            <button class="btn btn-sm ${ch.done ? 'btn-success' : 'btn-outline-secondary'}" onclick="toggleChallenge(${ch.id})">
                ${ch.done ? 'Splněno' : 'Splnit'}
            </button>
        `;
        container.appendChild(card);
    });
}

function toggleChallenge(id) {
    const ch = challenges.find(c => c.id === id);
    if(ch) {
        ch.done = !ch.done;
        saveChallenges();
    }
}

// --- NÁSTROJE (TOOLS) ---
function calculate1RM() {
    const w = parseFloat(document.getElementById("rmWeight").value);
    const r = parseInt(document.getElementById("rmReps").value);
    
    if (!w || !r) return;

    const oneRepMax = Math.round(w * (1 + r / 30));
    const resultEl = document.getElementById("rmResult");
    document.getElementById("rmValue").innerText = `${oneRepMax} kg`;
    resultEl.classList.remove("d-none");
}

function exportFitnessData() {
    const data = {
        workouts: workouts,
        diet: diet,
        challenges: challenges
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "darkdash_fitness_backup.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importFitnessData(input) {
    const file = input.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if(data.workouts) workouts = data.workouts;
            if(data.diet) diet = data.diet;
            if(data.challenges) challenges = data.challenges;
            
            saveFitness();
            saveDiet();
            saveChallenges();
            alert("Data úspěšně nahrána!");
            location.reload(); // Obnovit pro jistotu
        } catch(err) {
            alert("Chyba při čtení souboru.");
            console.error(err);
        }
    };
    reader.readAsText(file);
}

// --- STATS & GRAFY ---
function updateStats() {
    const uniqueDays = new Set(workouts.map(w => w.date)).size;
    document.getElementById("statTotalWorkouts").innerText = uniqueDays;

    const totalKm = workouts.filter(w => w.category === 'cardio').reduce((sum, w) => sum + (w.details.dist || 0), 0);
    document.getElementById("statTotalKm").innerText = totalKm.toFixed(1);

    const totalVol = workouts.filter(w => w.category === 'strength').reduce((sum, w) => sum + (w.details.weight * w.details.reps), 0);
    document.getElementById("statTotalVolume").innerText = (totalVol / 1000).toFixed(1) + 't';

    const totalReps = workouts.filter(w => w.category === 'calisthenics').reduce((sum, w) => sum + (w.details.count || 0), 0);
    document.getElementById("statTotalReps").innerText = totalReps;
}

function populateExerciseSelect() {
    const select = document.getElementById("chartExerciseSelect");
    const exercises = [...new Set(workouts.map(w => w.exercise))].sort();
    const currentVal = select.value;
    
    select.innerHTML = '<option value="">Vyber aktivitu...</option>';
    exercises.forEach(ex => {
        const option = document.createElement("option");
        option.value = ex;
        option.innerText = ex;
        select.appendChild(option);
    });

    if(currentVal && exercises.includes(currentVal)) select.value = currentVal;
}

function updateChart() {
    const exName = document.getElementById("chartExerciseSelect").value;
    if (!exName) return;

    const dataPoints = workouts.filter(w => w.exercise === exName).sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = dataPoints.map(d => new Date(d.date).toLocaleDateString('cs-CZ'));
    const values = dataPoints.map(d => d.chartValue);

    const ctx = document.getElementById('fitnessChart').getContext('2d');
    if (fitnessChart) fitnessChart.destroy();

    fitnessChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: exName,
                data: values,
                borderColor: '#ffc107',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { grid: { color: '#333' } }, x: { display: false } },
            plugins: { legend: { labels: { color: '#fff' } } }
        }
    });
}

// Start
document.addEventListener("DOMContentLoaded", loadFitness);