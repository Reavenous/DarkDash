// ============================================================
//  epicquests.js – Epické questy (dlouhodobé cíle) pro DarkDash
//  Cíle s milníky, progress barem a XP odměnami
// ============================================================

let epicQuests = [];

const EQ_KEY = () => window.getAppKey
    ? window.getAppKey('darkdash-epic-quests')
    : 'darkdash-epic-quests';

// ── Load / Save ─────────────────────────────────────────────
function loadEpicQuests() {
    try {
        const raw = localStorage.getItem(EQ_KEY());
        epicQuests = raw ? JSON.parse(raw) : [];
    } catch { epicQuests = []; }
    renderEpicQuests();
}

function saveEpicQuests() {
    localStorage.setItem(EQ_KEY(), JSON.stringify(epicQuests));
    if (window.saveToCloud) window.saveToCloud('epic-quests', epicQuests);
    renderEpicQuests();
}

// ── Přidat quest ────────────────────────────────────────────
window.openAddEpicQuestModal = function() {
    const title     = prompt('Název epického questu:\n(např. "Přečíst 12 knih za rok")');
    if (!title || !title.trim()) return;

    const targetStr = prompt('Celkový cíl (číslo):\n(např. 12 pro 12 knih, 365 pro 365 dní...)');
    const target    = parseInt(targetStr);
    if (!target || target <= 0) { alert('Zadej platné číslo.'); return; }

    const unit = prompt('Jednotka:\n(např. "knih", "km", "hodin", "tréninků", "dní"...)') || 'cílů';
    const xpReward = Math.max(50, target * 10);

    epicQuests.unshift({
        id:        Date.now(),
        title:     title.trim(),
        target,
        current:   0,
        unit:      unit.trim(),
        xpReward,
        completed: false,
        createdAt: new Date().toISOString().split('T')[0]
    });
    saveEpicQuests();
};

// ── Přidat progres ──────────────────────────────────────────
window.addEpicQuestProgress = function(id) {
    const quest = epicQuests.find(q => q.id === id);
    if (!quest || quest.completed) return;

    const addStr = prompt(`Přidat progres k "${quest.title}"\nAktuálně: ${quest.current} / ${quest.target} ${quest.unit}\n\nKolik přidat?`, '1');
    const add    = parseFloat(addStr);
    if (!add || isNaN(add) || add <= 0) return;

    quest.current = Math.min(quest.target, quest.current + add);

    if (quest.current >= quest.target && !quest.completed) {
        quest.completed = true;
        if (window.addXP) window.addXP(quest.xpReward, `Epický quest splněn: ${quest.title}`);
        if (window.NotificationSystem) NotificationSystem.show('🏆 EPICKÝ QUEST SPLNĚN!', `${quest.title} (+${quest.xpReward} XP)`);
        else alert(`🏆 Epický quest splněn! +${quest.xpReward} XP`);
    } else if (window.addXP) {
        const partial = Math.round(add * 5);
        window.addXP(partial, `Progres: ${quest.title}`);
    }

    saveEpicQuests();
};

// ── Smazat quest ────────────────────────────────────────────
window.deleteEpicQuest = function(id) {
    if (!confirm('Smazat tento epický quest?')) return;
    epicQuests = epicQuests.filter(q => q.id !== id);
    saveEpicQuests();
};

// ── Reset questus ───────────────────────────────────────────
window.resetEpicQuest = function(id) {
    const quest = epicQuests.find(q => q.id === id);
    if (!quest) return;
    if (!confirm(`Resetovat progres questu "${quest.title}"?`)) return;
    quest.current   = 0;
    quest.completed = false;
    saveEpicQuests();
};

// ── Render ──────────────────────────────────────────────────
function renderEpicQuests() {
    const el = document.getElementById('epicQuestsContent');
    if (!el) return;

    if (!epicQuests.length) {
        el.innerHTML = `
            <div class="text-center py-4 text-muted">
                <div style="font-size:2.5rem; opacity:.3;">🎯</div>
                <div class="mt-2 small">Žádné epické questy</div>
                <div class="small opacity-75">Nastav si dlouhodobý cíl a sleduj progres</div>
            </div>
            <button class="btn btn-outline-warning w-100 mt-3" onclick="window.openAddEpicQuestModal()">
                + Přidat epický quest
            </button>`;
        return;
    }

    const active    = epicQuests.filter(q => !q.completed);
    const completed = epicQuests.filter(q =>  q.completed);

    let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="text-muted small">${active.length} aktivních · ${completed.length} splněných</span>
            <button class="btn btn-sm btn-outline-warning" onclick="window.openAddEpicQuestModal()" style="font-size:.78rem;">
                + Nový quest
            </button>
        </div>`;

    [...active, ...completed].forEach(quest => {
        const pct     = Math.min(100, Math.round((quest.current / quest.target) * 100));
        const done    = quest.completed;
        const color   = done ? '#20c997' : (pct >= 75 ? '#ffc107' : 'var(--primary-glow, #9d4edd)');
        const milestones = [25, 50, 75, 100];

        html += `
        <div class="mb-3 p-3 rounded-3"
             style="background: rgba(255,255,255,0.03); border: 1px solid ${done ? 'rgba(32,201,151,0.3)' : 'rgba(255,255,255,0.08)'};">

            <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <span style="font-size:.95rem; font-weight:700; color:${color};">
                        ${done ? '🏆 ' : '🎯 '}${quest.title}
                    </span>
                    <div class="text-muted" style="font-size:.72rem; margin-top:2px;">
                        Odměna: ⚡ ${quest.xpReward} XP · Začato: ${quest.createdAt}
                    </div>
                </div>
                <div class="d-flex gap-1">
                    ${!done ? `<button class="btn btn-sm btn-outline-success" style="font-size:.7rem; padding:2px 8px;"
                                onclick="window.addEpicQuestProgress(${quest.id})">+</button>` : ''}
                    <button class="btn btn-sm btn-outline-secondary" style="font-size:.7rem; padding:2px 8px;"
                            onclick="window.resetEpicQuest(${quest.id})" title="Reset">↺</button>
                    <button class="btn btn-sm btn-outline-danger" style="font-size:.7rem; padding:2px 8px;"
                            onclick="window.deleteEpicQuest(${quest.id})">✕</button>
                </div>
            </div>

            <!-- Progress bar se milníky -->
            <div class="position-relative mb-1">
                <div class="progress bg-black" style="height:12px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
                    <div class="progress-bar" role="progressbar"
                         style="width:${pct}%; background:${color}; border-radius:6px; transition:width .6s;"></div>
                </div>
                <!-- Milníkové značky -->
                ${milestones.map(m => `
                    <div style="position:absolute; left:${m}%; top:-2px; transform:translateX(-50%);
                                width:2px; height:16px; background: rgba(255,255,255,${pct >= m ? '.5' : '.15'});
                                border-radius:1px;"></div>
                `).join('')}
            </div>

            <div class="d-flex justify-content-between" style="font-size:.72rem; color:#888;">
                <span>${quest.current} / ${quest.target} ${quest.unit}</span>
                <span style="color:${color}; font-weight:700;">${pct}%</span>
            </div>

            <!-- Milníkové odzaky -->
            <div class="d-flex gap-1 mt-2 flex-wrap">
                ${milestones.map(m => `
                    <span class="badge" style="font-size:.62rem;
                          background: ${pct >= m ? color + '22' : 'rgba(255,255,255,0.05)'};
                          color: ${pct >= m ? color : '#666'};
                          border: 1px solid ${pct >= m ? color + '44' : 'rgba(255,255,255,0.08)'};">
                        ${pct >= m ? '✓' : '○'} ${m}%
                    </span>
                `).join('')}
            </div>
        </div>`;
    });

    el.innerHTML = html;
}

window.renderEpicQuests = renderEpicQuests;
document.addEventListener('DOMContentLoaded', loadEpicQuests);
document.addEventListener('darkdash-reload',  loadEpicQuests);