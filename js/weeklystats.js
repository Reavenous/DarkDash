// ============================================================
//  weeklystats.js – Týdenní statistiky pro DarkDash
//  XP za 7 dní, splněné úkoly, aktivní dny, top modul
// ============================================================

// ── XP Log — ukládáme každý přírůstek s timestampem ─────────
const XP_LOG_KEY = () => window.getAppKey
    ? window.getAppKey('darkdash-xp-log')
    : 'darkdash-xp-log';

// Patch addXP aby logoval do XP logu
(function patchAddXP() {
    const _orig = window.addXP;
    window.addXP = function(amount, reason) {
        if (_orig) _orig(amount, reason);
        // Zapsat do logu
        try {
            const raw = localStorage.getItem(XP_LOG_KEY());
            const log = raw ? JSON.parse(raw) : [];
            log.push({ ts: Date.now(), amount, reason: reason || '' });
            // Drž jen 90 dní
            const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
            const trimmed = log.filter(e => e.ts > cutoff);
            localStorage.setItem(XP_LOG_KEY(), JSON.stringify(trimmed));
        } catch(e) {}
    };
})();

// ── Pomocníci ────────────────────────────────────────────────
function getDateKey(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().split('T')[0];
}

function getDayLabel(offsetDays) {
    const labels = ['Dnes', 'Včera', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
    if (offsetDays === 0) return 'Dnes';
    if (offsetDays === 1) return 'Včera';
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return ['Ne','Po','Út','St','Čt','Pá','So'][d.getDay()];
}

// ── Render statistik ─────────────────────────────────────────
function renderWeeklyStats() {
    const el = document.getElementById('weeklyStatsContent');
    if (!el) return;

    // ── XP za posledních 7 dní ───────────────────────────────
    const xpLog = (() => {
        try { return JSON.parse(localStorage.getItem(XP_LOG_KEY()) || '[]'); } catch { return []; }
    })();

    const dayXP = Array.from({length: 7}, (_, i) => {
        const dateStr = getDateKey(i);
        const start   = new Date(dateStr + 'T00:00:00').getTime();
        const end     = start + 86400000;
        const total   = xpLog
            .filter(e => e.ts >= start && e.ts < end)
            .reduce((sum, e) => sum + (e.amount || 0), 0);
        return { label: getDayLabel(i), xp: total, date: dateStr };
    }).reverse(); // Nejstarší vlevo

    const maxXP  = Math.max(...dayXP.map(d => d.xp), 1);
    const totalXP = dayXP.reduce((s, d) => s + d.xp, 0);
    const activeDays = dayXP.filter(d => d.xp > 0).length;

    // ── Splněné úkoly za 7 dní ──────────────────────────────
    const todosRaw = (() => {
        try {
            const key = window.getAppKey ? window.getAppKey('darkdash-todos') : 'darkdash-todos';
            return JSON.parse(localStorage.getItem(key) || '[]');
        } catch { return []; }
    })();
    const completedTodos = todosRaw.filter(t => t.completed).length;

    // ── Top XP zdroj z logu ─────────────────────────────────
    const reasonCounts = {};
    xpLog.forEach(e => {
        if (!e.reason) return;
        const key = e.reason.split(':')[0].trim();
        reasonCounts[key] = (reasonCounts[key] || 0) + (e.amount || 0);
    });
    const topReason = Object.entries(reasonCounts)
        .sort((a, b) => b[1] - a[1])[0];

    // ── HTML ────────────────────────────────────────────────
    el.innerHTML = `
        <!-- Summary badges -->
        <div class="d-flex gap-2 flex-wrap mb-4">
            <div class="flex-fill p-3 rounded-3 text-center"
                 style="background:rgba(157,78,221,0.1); border:1px solid rgba(157,78,221,0.25);">
                <div style="font-size:1.4rem; font-weight:800; color:var(--primary-glow,#9d4edd);">${totalXP}</div>
                <div class="text-muted" style="font-size:.72rem;">XP za 7 dní</div>
            </div>
            <div class="flex-fill p-3 rounded-3 text-center"
                 style="background:rgba(32,201,151,0.08); border:1px solid rgba(32,201,151,0.2);">
                <div style="font-size:1.4rem; font-weight:800; color:#20c997;">${activeDays}</div>
                <div class="text-muted" style="font-size:.72rem;">Aktivních dní</div>
            </div>
            <div class="flex-fill p-3 rounded-3 text-center"
                 style="background:rgba(255,193,7,0.08); border:1px solid rgba(255,193,7,0.2);">
                <div style="font-size:1.4rem; font-weight:800; color:#ffc107;">${completedTodos}</div>
                <div class="text-muted" style="font-size:.72rem;">Splněných misí</div>
            </div>
        </div>

        <!-- XP Graf (sloupcový) -->
        <div class="mb-1" style="font-size:.72rem; color:#888; letter-spacing:1px; text-transform:uppercase;">
            XP za posledních 7 dní
        </div>
        <div class="d-flex align-items-end gap-1 mb-1" style="height:80px;">
            ${dayXP.map(day => {
                const h   = maxXP > 0 ? Math.max(4, Math.round((day.xp / maxXP) * 72)) : 4;
                const col = day.xp > 0 ? 'var(--primary-glow,#9d4edd)' : 'rgba(255,255,255,0.08)';
                const isToday = day.label === 'Dnes';
                return `
                <div class="flex-fill d-flex flex-column align-items-center justify-content-end" title="${day.xp} XP">
                    <div style="
                        height: ${h}px;
                        width: 100%;
                        background: ${col};
                        border-radius: 4px 4px 0 0;
                        opacity: ${isToday ? '1' : '0.7'};
                        box-shadow: ${day.xp > 0 ? '0 0 8px ' + col + '66' : 'none'};
                        transition: height .5s;
                    "></div>
                </div>`;
            }).join('')}
        </div>
        <!-- X-osa popisky -->
        <div class="d-flex gap-1 mb-4">
            ${dayXP.map(day => `
                <div class="flex-fill text-center" style="font-size:.65rem; color:${day.label === 'Dnes' ? '#fff' : '#666'};">
                    ${day.label}
                    ${day.xp > 0 ? `<br><span style="color:var(--primary-glow,#9d4edd); font-size:.62rem;">${day.xp}</span>` : ''}
                </div>
            `).join('')}
        </div>

        <!-- Top XP zdroj -->
        ${topReason ? `
        <div class="p-3 rounded-3" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);">
            <div class="text-muted mb-1" style="font-size:.7rem; letter-spacing:1px;">TOP XP ZDROJ (7 DNÍ)</div>
            <div style="font-size:.9rem; color:#fff;">⚡ ${topReason[0]}</div>
            <div style="font-size:.8rem; color:var(--primary-glow,#9d4edd);">+${topReason[1]} XP celkem</div>
        </div>
        ` : `
        <div class="text-center text-muted p-3" style="font-size:.8rem;">
            Zatím žádná XP aktivita — splň pár úkolů!
        </div>
        `}
    `;
}

window.renderWeeklyStats = renderWeeklyStats;
document.addEventListener('DOMContentLoaded', renderWeeklyStats);
document.addEventListener('darkdash-reload',  renderWeeklyStats);