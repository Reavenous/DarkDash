// ============================================================
//  dailychallenge.js – Denní výzva pro DarkDash
//  Každý den nový náhodný challenge za bonus XP
// ============================================================

const DAILY_CHALLENGES = [
    // Pohyb
    { text: "Udělej 20 dřepů",               category: "💪 Pohyb",    xp: 25 },
    { text: "Udělej 10 kliků",                category: "💪 Pohyb",    xp: 20 },
    { text: "Protáhni se 5 minut",             category: "💪 Pohyb",    xp: 15 },
    { text: "Jdi na procházku alespoň 15 min", category: "💪 Pohyb",    xp: 30 },
    { text: "Udělej 30 skoků přes švihadlo",   category: "💪 Pohyb",    xp: 20 },
    { text: "Drž plank 30 sekund",             category: "💪 Pohyb",    xp: 20 },
    // Mysl
    { text: "Napiš 3 věci, za které jsi dnes vděčný", category: "🧠 Mysl", xp: 20 },
    { text: "Medituj 5 minut",                          category: "🧠 Mysl", xp: 25 },
    { text: "Přečti 10 stran knihy",                    category: "🧠 Mysl", xp: 20 },
    { text: "Napiš myšlenky dne do deníku",             category: "🧠 Mysl", xp: 25 },
    { text: "Nauč se 5 nových slovíček",                category: "🧠 Mysl", xp: 15 },
    { text: "Bez telefonu po dobu 1 hodiny",            category: "🧠 Mysl", xp: 35 },
    // Produktivita
    { text: "Splň 3 úkoly z Quest Logu",                 category: "⚡ Produktivita", xp: 30 },
    { text: "Uklid svůj pracovní stůl",                  category: "⚡ Produktivita", xp: 20 },
    { text: "Napiš to-do list na zítra",                 category: "⚡ Produktivita", xp: 15 },
    { text: "Vyřiď všechny neodpovězené zprávy",         category: "⚡ Produktivita", xp: 20 },
    { text: "Udělej 25minutový Pomodoro sprint",         category: "⚡ Produktivita", xp: 25 },
    // Sociální
    { text: "Napiš někomu blízkému",           category: "🤝 Sociální", xp: 15 },
    { text: "Pochval někoho upřímně",           category: "🤝 Sociální", xp: 20 },
    { text: "Pomoz někomu s čímkoliv",          category: "🤝 Sociální", xp: 25 },
    // Kreativita
    { text: "Nakresli cokoliv — i blbě",        category: "🎨 Kreativita", xp: 20 },
    { text: "Zahraj si na hudební nástroj",      category: "🎨 Kreativita", xp: 25 },
    { text: "Napiš báseň nebo krátký příběh",   category: "🎨 Kreativita", xp: 30 },
    // Zdraví
    { text: "Vypij 2 litry vody",               category: "💚 Zdraví", xp: 20 },
    { text: "Jez zeleninu k každému jídlu",     category: "💚 Zdraví", xp: 20 },
    { text: "Lehni si spát před půlnocí",       category: "💚 Zdraví", xp: 25 },
    { text: "Vynech dnes slazené nápoje",       category: "💚 Zdraví", xp: 20 },
];

const CHALLENGE_KEY = () => window.getAppKey
    ? window.getAppKey('darkdash-daily-challenge')
    : 'darkdash-daily-challenge';

// ── Vrátí dnešní challenge (deterministicky z data) ─────────
function getTodayChallenge() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const stored = localStorage.getItem(CHALLENGE_KEY());

    if (stored) {
        const obj = JSON.parse(stored);
        if (obj.date === today) return obj; // Stejný den → vrať uložený
    }

    // Nový den → vygeneruj nový challenge
    // Seed z data pro konzistenci (stejný pro všechny uživatele ve stejný den)
    const seed = today.replace(/-/g, '');
    const index = parseInt(seed) % DAILY_CHALLENGES.length;
    const challenge = {
        ...DAILY_CHALLENGES[index],
        date:      today,
        completed: false
    };
    localStorage.setItem(CHALLENGE_KEY(), JSON.stringify(challenge));
    return challenge;
}

// ── Splnit výzvu ────────────────────────────────────────────
window.completeChallenge = function() {
    const stored = localStorage.getItem(CHALLENGE_KEY());
    if (!stored) return;
    const ch = JSON.parse(stored);
    if (ch.completed) return;
    ch.completed = true;
    localStorage.setItem(CHALLENGE_KEY(), JSON.stringify(ch));
    if (window.addXP) window.addXP(ch.xp, `Denní výzva: ${ch.text}`);
    if (window.NotificationSystem) NotificationSystem.show(`+${ch.xp} XP`, `Výzva splněna! 🎉`);
    renderDailyChallenge();
};

// ── Vykreslit ───────────────────────────────────────────────
function renderDailyChallenge() {
    const el = document.getElementById('dailyChallengeContent');
    if (!el) return;

    const ch = getTodayChallenge();
    const done = ch.completed;

    el.innerHTML = `
        <div class="text-center py-2 mb-3">
            <span class="badge bg-secondary" style="font-size:.7rem; letter-spacing:1px;">DNEŠNÍ VÝZVA</span>
        </div>

        <div class="p-4 rounded-3 mb-3 text-center"
             style="background: ${done ? 'rgba(32,201,151,0.08)' : 'rgba(255,193,7,0.06)'};
                    border: 1px solid ${done ? 'rgba(32,201,151,0.3)' : 'rgba(255,193,7,0.25)'};">

            <div class="mb-2" style="font-size:.75rem; color:#888; letter-spacing:1px;">
                ${ch.category}
            </div>

            <div class="mb-3" style="font-size:1.3rem; font-weight:700;
                 color: ${done ? '#20c997' : '#ffc107'};
                 text-shadow: 0 0 12px ${done ? 'rgba(32,201,151,0.3)' : 'rgba(255,193,7,0.3)'};">
                ${done ? '✓ ' : ''}${ch.text}
            </div>

            <div class="mb-3">
                <span class="badge" style="background: rgba(255,193,7,0.15); color:#ffc107;
                      border: 1px solid rgba(255,193,7,0.3); font-size:.85rem;">
                    ⚡ +${ch.xp} XP
                </span>
            </div>

            ${done
                ? `<div class="text-success fw-bold">🏆 Výzva splněna!</div>`
                : `<button class="btn btn-warning fw-bold px-4" onclick="window.completeChallenge()">
                       Splněno! ⚡ +${ch.xp} XP
                   </button>`
            }
        </div>

        <div class="text-center text-muted" style="font-size:.72rem;">
            Výzva se obnoví po půlnoci • ${DAILY_CHALLENGES.length} různých výzev
        </div>
    `;
}

window.renderDailyChallenge = renderDailyChallenge;
document.addEventListener('DOMContentLoaded', renderDailyChallenge);
document.addEventListener('darkdash-reload',  renderDailyChallenge);