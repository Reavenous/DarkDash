// ============================================================
//  habits.js – Daily Rituals (Denní Rituály) pro DarkDash
//  Habitica-style denní návyky s půlnočním resetem a XP
// ============================================================

// ---- DATA ----

let habits = [];

const HABIT_DAYS = [
    { key: 'mon', label: 'Po' },
    { key: 'tue', label: 'Út' },
    { key: 'wed', label: 'St' },
    { key: 'thu', label: 'Čt' },
    { key: 'fri', label: 'Pá' },
    { key: 'sat', label: 'So' },
    { key: 'sun', label: 'Ne' },
];

const JS_DAY_MAP = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const DIFFICULTY_CONFIG = {
    easy:   { label: '☀️ Lehký',    xp: 10,  color: '#20c997', border: 'rgba(32, 201, 151, 0.3)'  },
    medium: { label: '⚔️ Střední',  xp: 20,  color: '#ffc107', border: 'rgba(255, 193, 7, 0.3)'   },
    hard:   { label: '💀 Těžký',    xp: 35,  color: '#dc3545', border: 'rgba(220, 53, 69, 0.3)'   },
};

const HABIT_ICONS = ['🧘','🏃','🚿','🥗','📖','💧','🧹','🛏️','🐶','🎸','✍️','🧠','🌿','⚡','🔥','🌙','☀️','🏋️','🚴','🧘‍♂️'];

// ---- STORAGE ----

function getHabitsKey() {
    return window.getAppKey ? window.getAppKey('darkdash-habits') : 'darkdash-habits';
}

function loadHabits() {
    const raw = localStorage.getItem(getHabitsKey());
    habits = raw ? JSON.parse(raw) : [];

    // Půlnoční reset – projdeme každý habit a resetujeme, pokud je nový den
    const todayStr = getTodayStr();
    habits.forEach(h => {
        if (h.lastResetDate !== todayStr) {
            h.completedToday = false;
            h.lastResetDate = todayStr;
        }
    });

    saveHabits(false); // uložit reset beze znovu-renderování (zabraňuje smyčce)
    renderHabitsUI();
}

function saveHabits(doRender = true) {
    localStorage.setItem(getHabitsKey(), JSON.stringify(habits));
    if (window.saveToCloud) window.saveToCloud('habits', habits);
    if (doRender) renderHabitsUI();
}

// ---- HELPERS ----

function getTodayStr() {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function getTodayKey() {
    return JS_DAY_MAP[new Date().getDay()]; // 'mon'...'sun'
}

/** Vrací True, pokud se habit má zobrazit dnes */
function isHabitForToday(habit) {
    return habit.days.includes(getTodayKey());
}

/** Počet aktivních / splněných dnes */
function getTodayStats() {
    const todayHabits = habits.filter(isHabitForToday);
    const done = todayHabits.filter(h => h.completedToday).length;
    return { total: todayHabits.length, done };
}

// ---- RENDER ----

function renderHabitsUI() {
    renderHabitsList();
    renderHabitsProgress();
    renderHabitsCalendar();
}

function renderHabitsProgress() {
    const bar  = document.getElementById('habitsProgressBar');
    const text = document.getElementById('habitsProgressText');
    if (!bar || !text) return;

    const { total, done } = getTodayStats();
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);

    bar.style.width = pct + '%';
    bar.style.background = pct === 100
        ? 'linear-gradient(90deg, #20c997, #0dcaf0)'
        : pct >= 60
        ? 'linear-gradient(90deg, #ffc107, #fd7e14)'
        : 'linear-gradient(90deg, #dc3545, #9d4edd)';

    text.innerHTML = pct === 100
        ? `<span class="text-success fw-bold">⚔️ Všechny rituály splněny!</span>`
        : `<span class="text-muted">${done} / ${total} rituálů dnes</span>`;
}

function renderHabitsList() {
    const container = document.getElementById('habitsList');
    if (!container) return;

    const todayKey = getTodayKey();
    const todayHabits  = habits.filter(h => h.days.includes(todayKey));
    const otherHabits  = habits.filter(h => !h.days.includes(todayKey));

    container.innerHTML = '';

    // --- DNEŠNÍ RITUÁLY ---
    if (todayHabits.length === 0 && habits.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-5">
                <div style="font-size:3rem;">🌑</div>
                <p class="mt-3">Žádné rituály nejsou definovány.<br>Přidej svůj první denní rituál!</p>
            </div>`;
        return;
    }

    if (todayHabits.length > 0) {
        container.innerHTML += `<h6 class="text-uppercase text-muted mb-3" style="font-size:.75rem; letter-spacing:2px;">⚡ Dnešní výzvy</h6>`;
        const grid = document.createElement('div');
        grid.className = 'habits-grid mb-4';
        todayHabits.forEach(h => grid.appendChild(createHabitCard(h, true)));
        container.appendChild(grid);
    }

    // --- OSTATNÍ (ostatní dny) ---
    if (otherHabits.length > 0) {
        const sep = document.createElement('div');
        sep.innerHTML = `<h6 class="text-uppercase text-muted mb-3 mt-2" style="font-size:.75rem; letter-spacing:2px;">📅 Jiné dny</h6>`;
        container.appendChild(sep);

        const grid2 = document.createElement('div');
        grid2.className = 'habits-grid';
        otherHabits.forEach(h => grid2.appendChild(createHabitCard(h, false)));
        container.appendChild(grid2);
    }
}

function createHabitCard(habit, isToday) {
    const cfg = DIFFICULTY_CONFIG[habit.difficulty] || DIFFICULTY_CONFIG.easy;
    const isDone = habit.completedToday && isToday;
    const streakBonus = habit.streak > 0 ? Math.floor(habit.streak / 7) * 5 : 0;
    const totalXP = cfg.xp + streakBonus;

    const card = document.createElement('div');
    card.className = 'habit-card' + (isDone ? ' habit-done' : '') + (!isToday ? ' habit-other-day' : '');
    card.style.borderColor = isDone ? '#2d3748' : cfg.color;
    card.style.background   = isDone
        ? 'rgba(255,255,255,0.03)'
        : `linear-gradient(135deg, #0d0d0d 60%, ${cfg.border})`;

    // Dny – malé tagy
    const dayTags = HABIT_DAYS.map(d =>
        `<span class="habit-day-tag ${habit.days.includes(d.key) ? 'active' : ''}">${d.label}</span>`
    ).join('');

    card.innerHTML = `
        <div class="habit-card-header">
            <span class="habit-icon">${habit.icon || '🔥'}</span>
            <div class="habit-info">
                <div class="habit-name ${isDone ? 'text-decoration-line-through text-muted' : ''}">${habit.name}</div>
                <div class="habit-meta">
                    <span style="color:${cfg.color}; font-size:.75rem;">${cfg.label}</span>
                    <span class="habit-xp-badge">+${totalXP} XP${streakBonus > 0 ? ` <span class="streak-bonus">(+${streakBonus} streak)</span>` : ''}</span>
                </div>
            </div>
            <div class="habit-actions">
                <button class="habit-edit-btn" onclick="openEditHabitModal(${habit.id})" title="Upravit">✏️</button>
                <button class="habit-delete-btn" onclick="deleteHabit(${habit.id})" title="Smazat">×</button>
            </div>
        </div>

        <div class="habit-days-row">${dayTags}</div>

        ${habit.streak > 0 ? `
        <div class="habit-streak">
            🔥 <span class="streak-count">${habit.streak}</span> dní v řadě
        </div>` : ''}

        ${isToday ? `
        <button class="habit-complete-btn ${isDone ? 'done' : ''}" onclick="toggleHabit(${habit.id})">
            ${isDone ? '✓ Splněno' : '⚔️ Splnit rituál'}
        </button>` : `
        <div class="habit-not-today">Dnes není na programu</div>`}
    `;

    return card;
}

/** Mini aktivitní kalendář – posledních 7 dní */
function renderHabitsCalendar() {
    const cal = document.getElementById('habitsWeekCalendar');
    if (!cal) return;

    cal.innerHTML = '';
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayKey = JS_DAY_MAP[d.getDay()];
        const dayLabel = HABIT_DAYS.find(x => x.key === dayKey)?.label || '?';

        // Kolik habitů bylo aktivních a kolik splněných ten den
        // (data se ukládají v historii)
        const dateStr = d.toISOString().split('T')[0];
        const dayHabits = habits.filter(h => h.days.includes(dayKey));
        const completedOnDay = habits.filter(h =>
            h.days.includes(dayKey) && h.history && h.history.includes(dateStr)
        ).length;
        const total = dayHabits.length;

        const pct = total === 0 ? 0 : completedOnDay / total;
        const isToday = i === 0;

        const cell = document.createElement('div');
        cell.className = 'habits-week-cell' + (isToday ? ' today' : '');
        cell.style.opacity = pct === 0 && !isToday ? '0.4' : '1';
        cell.style.background = pct === 1
            ? 'linear-gradient(135deg, #20c997, #0dcaf0)'
            : pct > 0
            ? 'rgba(255,193,7,0.3)'
            : 'rgba(255,255,255,0.04)';
        cell.innerHTML = `
            <div class="week-cell-day">${dayLabel}</div>
            <div class="week-cell-dot">${pct === 1 ? '⚔️' : pct > 0 ? '🔸' : total === 0 ? '–' : '○'}</div>
            <div class="week-cell-count" style="font-size:.65rem; color:#666;">${total > 0 ? `${completedOnDay}/${total}` : ''}</div>
        `;
        cal.appendChild(cell);
    }
}

// ---- AKCE ----

function toggleHabit(id) {
    const habit = habits.find(h => h.id === id);
    if (!habit || !isHabitForToday(habit)) return;

    const todayStr = getTodayStr();

    if (!habit.completedToday) {
        // SPLNIT
        habit.completedToday = true;

        // Streak logika
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (habit.history && habit.history.includes(yesterdayStr)) {
            habit.streak = (habit.streak || 0) + 1;
        } else {
            habit.streak = 1;
        }

        // Uložit do historie
        if (!habit.history) habit.history = [];
        if (!habit.history.includes(todayStr)) habit.history.push(todayStr);

        // Omezit historii na posledních 90 dní
        if (habit.history.length > 90) habit.history = habit.history.slice(-90);

        // XP
        const cfg = DIFFICULTY_CONFIG[habit.difficulty] || DIFFICULTY_CONFIG.easy;
        const streakBonus = habit.streak > 0 ? Math.floor(habit.streak / 7) * 5 : 0;
        const totalXP = cfg.xp + streakBonus;

        if (window.addXP) window.addXP(totalXP, `Rituál splněn: ${habit.name}`);
        if (window.playSound) window.playSound('success');

        // Streak milestone notifikace
        if (habit.streak > 0 && habit.streak % 7 === 0) {
            if (window.NotificationSystem) {
                NotificationSystem.show(`🔥 ${habit.streak} dní v řadě!`, `Ritual "${habit.name}" – získáváš bonus XP!`);
            }
        }

    } else {
        // ODZNAČIT
        habit.completedToday = false;

        // Odstranit dnešek z historie
        if (habit.history) {
            habit.history = habit.history.filter(d => d !== todayStr);
        }

        // Streak reset
        if (habit.streak > 0) habit.streak--;
    }

    saveHabits();
}

function deleteHabit(id) {
    if (!confirm('Opravdu chceš smazat tento rituál?')) return;
    habits = habits.filter(h => h.id !== id);
    saveHabits();
}

// ---- MODAL: PŘIDAT / UPRAVIT ----

let editingHabitId = null;

function openAddHabitModal() {
    editingHabitId = null;

    document.getElementById('habitModalTitle').innerText = '+ Nový Rituál';
    document.getElementById('habitNameInput').value = '';
    document.getElementById('habitDifficultySelect').value = 'easy';
    document.getElementById('habitIconDisplay').innerText = '🔥';
    document.getElementById('habitIconInput').value = '🔥';

    // Reset dnů – všechny
    document.querySelectorAll('.habit-day-toggle').forEach(btn => btn.classList.add('selected'));

    renderIconPicker();
    new bootstrap.Modal(document.getElementById('habitEditorModal')).show();
}

function openEditHabitModal(id) {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    editingHabitId = id;
    document.getElementById('habitModalTitle').innerText = '✏️ Upravit Rituál';
    document.getElementById('habitNameInput').value = habit.name;
    document.getElementById('habitDifficultySelect').value = habit.difficulty;
    document.getElementById('habitIconDisplay').innerText = habit.icon || '🔥';
    document.getElementById('habitIconInput').value = habit.icon || '🔥';

    document.querySelectorAll('.habit-day-toggle').forEach(btn => {
        btn.classList.toggle('selected', habit.days.includes(btn.dataset.day));
    });

    renderIconPicker();
    new bootstrap.Modal(document.getElementById('habitEditorModal')).show();
}

function saveHabitFromModal() {
    const name = document.getElementById('habitNameInput').value.trim();
    if (!name) { alert('Rituál musí mít název!'); return; }

    const difficulty = document.getElementById('habitDifficultySelect').value;
    const icon       = document.getElementById('habitIconInput').value || '🔥';

    const selectedDays = [];
    document.querySelectorAll('.habit-day-toggle.selected').forEach(btn => {
        selectedDays.push(btn.dataset.day);
    });

    if (selectedDays.length === 0) {
        alert('Vyber alespoň jeden den!');
        return;
    }

    const todayStr = getTodayStr();

    if (editingHabitId) {
        // EDITACE
        const habit = habits.find(h => h.id === editingHabitId);
        if (habit) {
            habit.name       = name;
            habit.difficulty = difficulty;
            habit.icon       = icon;
            habit.days       = selectedDays;
        }
    } else {
        // NOVÝ
        habits.unshift({
            id:            Date.now(),
            name:          name,
            difficulty:    difficulty,
            icon:          icon,
            days:          selectedDays,
            completedToday: false,
            streak:        0,
            lastResetDate: todayStr,
            history:       []
        });
    }

    saveHabits();

    const modalEl = document.getElementById('habitEditorModal');
    bootstrap.Modal.getInstance(modalEl)?.hide();
}

// ---- ICON PICKER ----

function renderIconPicker() {
    const picker = document.getElementById('habitIconPicker');
    if (!picker) return;
    picker.innerHTML = '';
    HABIT_ICONS.forEach(icon => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'habit-icon-btn';
        btn.innerText = icon;
        btn.onclick = () => {
            document.getElementById('habitIconDisplay').innerText = icon;
            document.getElementById('habitIconInput').value = icon;
            picker.querySelectorAll('.habit-icon-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        };
        picker.appendChild(btn);
    });
}

// ---- TOGGLE DNÍ (event delegation) ----

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('habit-day-toggle')) {
        e.target.classList.toggle('selected');
    }
});

// ---- PŮLNOČNÍ RESET (interval) ----

function scheduleMidnightReset() {
    const now  = new Date();
    const next = new Date();
    next.setHours(24, 0, 1, 0); // 00:00:01 příštího dne
    const msUntilMidnight = next - now;

    setTimeout(() => {
        const todayStr = getTodayStr();
        habits.forEach(h => {
            h.completedToday  = false;
            h.lastResetDate   = todayStr;
        });
        saveHabits();
        if (window.NotificationSystem) {
            NotificationSystem.show('🌑 Nový den', 'Rituály byly resetovány. Čeká tě nová výzva!');
        }
        scheduleMidnightReset(); // znovu naplánuj na příští noc
    }, msUntilMidnight);
}

// ---- INIT ----

document.addEventListener('DOMContentLoaded', () => {
    loadHabits();
    scheduleMidnightReset();
});

document.addEventListener('darkdash-reload', loadHabits);
// ── Tab přepínání v Daily Rituals widgetu ────────────────────
window.switchHabTab = function(tab) {
    const tabs = ['habits', 'challenge', 'stats', 'quests'];
    const tabMap = {
        habits:    { el: 'tabHabits',    btn: 'btnHabTab'    },
        challenge: { el: 'tabChallenge', btn: 'btnChalTab'   },
        stats:     { el: 'tabStats',     btn: 'btnStatsTab'  },
        quests:    { el: 'tabQuests',    btn: 'btnQuestsTab' },
    };
    const btnAddHabit = document.getElementById('btnAddHabit');

    tabs.forEach(t => {
        const cfg = tabMap[t];
        const el  = document.getElementById(cfg.el);
        const btn = document.getElementById(cfg.btn);
        if (el)  el.classList.toggle('d-none', t !== tab);
        if (btn) {
            btn.classList.toggle('active', t === tab);
        }
    });

    // Zobraz/skryj tlačítko "Přidat rituál" jen na záložce Rituály
    if (btnAddHabit) btnAddHabit.style.display = tab === 'habits' ? '' : 'none';

    // Refresh obsahu při přepnutí
    if (tab === 'challenge' && window.renderDailyChallenge) window.renderDailyChallenge();
    if (tab === 'stats'     && window.renderWeeklyStats)    window.renderWeeklyStats();
    if (tab === 'quests'    && window.renderEpicQuests)     window.renderEpicQuests();
};