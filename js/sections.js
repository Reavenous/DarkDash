// ============================================================
//  DarkDash — Správce viditelnosti sekcí
//  js/sections.js
// ============================================================

const SECTIONS_KEY = 'darkdash-sections-visibility';

// ── Definice všech sekcí ────────────────────────────────────
// id       → ID elementu v HTML (přidáme je níže)
// label    → Zobrazované jméno
// icon     → FontAwesome třída
// category → Skupina v nastavení
// default  → Výchozí stav (true = viditelný)
const SECTION_DEFS = [
    // ── Střed – widgety ─────────────────────────────────────
    { id: 'widget-music',    label: 'Hudební přehrávač',  icon: 'fa-music',          category: 'Střed – Widgety', def: true  },
    { id: 'widget-quote',    label: 'Temná moudrost',     icon: 'fa-scroll',         category: 'Střed – Widgety', def: true  },
    { id: 'widget-weather',  label: 'Předpověď počasí',   icon: 'fa-cloud-sun',      category: 'Střed – Widgety', def: true  },
    { id: 'widget-news',     label: 'Zprávy ze světa',    icon: 'fa-newspaper',      category: 'Střed – Widgety', def: true  },
    { id: 'widget-games',    label: 'Digihry',            icon: 'fa-gamepad',        category: 'Střed – Widgety', def: true  },
    { id: 'widget-tarot',    label: 'Dark Tarot',         icon: 'fa-eye',            category: 'Střed – Widgety', def: true  },
    { id: 'widget-loot',     label: 'Tajná Truhla',       icon: 'fa-box-open',       category: 'Střed – Widgety', def: true  },

    // ── Levý panel ──────────────────────────────────────────
    { id: 'left-nameday',    label: 'Svátek (jmeniny)',   icon: 'fa-birthday-cake',  category: 'Levý panel', def: true  },
    { id: 'left-zodiac',     label: 'Znamení zvěrokruhu', icon: 'fa-star',           category: 'Levý panel', def: true  },
    { id: 'left-moon',       label: 'Fáze měsíce',        icon: 'fa-moon',           category: 'Levý panel', def: true  },

    // ── Pravý panel – tlačítka ───────────────────────────────
    { id: 'btn-sec-chat',       label: 'DarkChat',        icon: 'fa-comments',       category: 'Pravý panel – Tlačítka', def: true  },
    { id: 'btn-sec-fitness',    label: 'Fitness',         icon: 'fa-dumbbell',       category: 'Pravý panel – Tlačítka', def: true  },
    { id: 'btn-sec-todo',       label: 'Úkoly (Quest Log)', icon: 'fa-tasks',        category: 'Pravý panel – Tlačítka', def: true  },
    { id: 'btn-sec-journal',    label: 'Deník',           icon: 'fa-book',           category: 'Pravý panel – Tlačítka', def: true  },
    { id: 'btn-sec-cookbook',   label: 'Kuchařka',        icon: 'fa-utensils',       category: 'Pravý panel – Tlačítka', def: true  },
    { id: 'btn-sec-notes',      label: 'Poznámky',        icon: 'fa-sticky-note',    category: 'Pravý panel – Tlačítka', def: true  },
    { id: 'btn-sec-calendar',   label: 'Kalendář',        icon: 'fa-calendar',       category: 'Pravý panel – Tlačítka', def: true  },
    { id: 'btn-sec-pomodoro',   label: 'Pomodoro Časovač', icon: 'fa-clock',         category: 'Pravý panel – Tlačítka', def: true  },
    { id: 'btn-sec-countdown',  label: 'Odpočet',         icon: 'fa-hourglass-half', category: 'Pravý panel – Tlačítka', def: true  },
    { id: 'btn-sec-dreams',     label: 'Sny & Watchlist', icon: 'fa-cloud',          category: 'Pravý panel – Tlačítka', def: true  },
    { id: 'btn-sec-links',      label: 'Záložky & Odkazy', icon: 'fa-link',          category: 'Pravý panel – Tlačítka', def: true  },
    { id: 'btn-sec-qr',         label: 'QR Kódy',         icon: 'fa-qrcode',         category: 'Pravý panel – Tlačítka', def: true  },
];

// ── Načtení uloženého stavu ze storage ──────────────────────
function loadSectionVisibility() {
    try {
        const saved = localStorage.getItem(SECTIONS_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
}

// ── Uložení stavu ────────────────────────────────────────────
function saveSectionVisibility(state) {
    localStorage.setItem(SECTIONS_KEY, JSON.stringify(state));
}

// ── Aplikovat viditelnost na jeden element ──────────────────
function applyVisibility(id, visible) {
    const el = document.getElementById(id);
    if (!el) return;
    if (visible) {
        el.style.removeProperty('display');
        el.classList.remove('dd-section-hidden');
    } else {
        el.style.display = 'none';
        el.classList.add('dd-section-hidden');
    }
}

// ── Aplikovat vše ze storage ─────────────────────────────────
function applyAllVisibility() {
    const state = loadSectionVisibility();
    SECTION_DEFS.forEach(sec => {
        const visible = sec.id in state ? state[sec.id] : sec.def;
        applyVisibility(sec.id, visible);
    });
}

// ── Toggle jedné sekce + uložit ──────────────────────────────
window.toggleSection = function(id, visible) {
    const state = loadSectionVisibility();
    state[id] = visible;
    saveSectionVisibility(state);
    applyVisibility(id, visible);

    // Sync toggle v UI
    const toggle = document.querySelector(`#sections-panel input[data-sec="${id}"]`);
    if (toggle) toggle.checked = visible;
};

// ── Reset všech sekcí na výchozí ────────────────────────────
window.resetSectionsToDefault = function() {
    saveSectionVisibility({});
    applyAllVisibility();
    renderSectionsPanel(); // překreslit checkboxy
};

// ── Vykreslit panel v nastavení ──────────────────────────────
window.renderSectionsPanel = function() {
    const container = document.getElementById('sections-panel');
    if (!container) return;

    const state = loadSectionVisibility();

    // Skupiny
    const categories = [...new Set(SECTION_DEFS.map(s => s.category))];

    container.innerHTML = categories.map(cat => {
        const items = SECTION_DEFS.filter(s => s.category === cat);
        return `
            <div class="mb-4">
                <h6 class="text-secondary text-uppercase small mb-2" style="letter-spacing:1px; font-size:0.7rem;">
                    <i class="fas fa-layer-group me-1 opacity-50"></i>${cat}
                </h6>
                <div class="d-flex flex-column gap-2">
                    ${items.map(sec => {
                        const visible = sec.id in state ? state[sec.id] : sec.def;
                        return `
                        <div class="d-flex align-items-center justify-content-between px-3 py-2 rounded"
                             style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);">
                            <span class="small d-flex align-items-center gap-2 text-light">
                                <i class="fas ${sec.icon} opacity-50" style="width:16px;"></i>
                                ${sec.label}
                            </span>
                            <div class="form-check form-switch mb-0">
                                <input class="form-check-input" type="checkbox"
                                       style="cursor:pointer;"
                                       data-sec="${sec.id}"
                                       ${visible ? 'checked' : ''}
                                       onchange="window.toggleSection('${sec.id}', this.checked)">
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
    }).join('');

    // Tlačítko reset
    container.insertAdjacentHTML('beforeend', `
        <div class="border-top border-secondary pt-3 mt-2">
            <button class="btn btn-sm btn-outline-secondary w-100" onclick="window.resetSectionsToDefault()">
                <i class="fas fa-undo me-2"></i>Obnovit výchozí nastavení
            </button>
        </div>
    `);
};

// ── Inicializace po načtení stránky ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    applyAllVisibility();
});

// ── Vykreslit panel při otevření profil modalu ───────────────
document.addEventListener('shown.bs.modal', (e) => {
    if (e.target && e.target.id === 'profileModal') {
        window.renderSectionsPanel();
    }
});