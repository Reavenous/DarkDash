// ============================================================
//  DarkDash Root Terminal — js/terminal.js
//  Otevři klávesou [T] · Zavři [T] nebo [Esc]
// ============================================================

(function () {
    'use strict';

    // ── Stav terminálu ──────────────────────────────────────
    let termOpen   = false;
    let cmdHistory = [];          // Historie příkazů (šipky nahoru/dolů)
    let histIndex  = -1;
    let activeTimer = null;       // Aktivní /timer interval
    let activeTimerLine = null;   // DOM element progress baru
    let matrixInterval = null;    // Matrix efekt

    // ── Reference na DOM ────────────────────────────────────
    const terminal   = () => document.getElementById('darkTerminal');
    const output     = () => document.getElementById('termOutput');
    const input      = () => document.getElementById('termInput');
    const promptEl   = () => document.getElementById('termPrompt');

    // ── Otevřít/Zavřít ──────────────────────────────────────
    function openTerminal() {
        const el = terminal();
        if (!el) return;
        el.style.display = 'flex';
        el.classList.remove('closing');
        termOpen = true;
        document.body.classList.add('term-open');
        setTimeout(() => input() && input().focus(), 80);
        updatePrompt();
    }

    function closeTerminal() {
        const el = terminal();
        if (!el) return;
        el.classList.add('closing');
        setTimeout(() => {
            el.style.display = 'none';
            el.classList.remove('closing');
        }, 200);
        termOpen = false;
        document.body.classList.remove('term-open');
    }

    window.toggleTerminal = function () {
        termOpen ? closeTerminal() : openTerminal();
    };

    // ── Aktualizace promptu dle přihlášeného uživatele ──────
    function updatePrompt() {
        const el = promptEl();
        if (!el) return;
        const uid  = window.currentUserUID;
        const name = uid ? `agent@darkdash` : `guest@darkdash`;
        el.textContent = `${name}:~# `;
    }

    // ── Výpis do terminálu ──────────────────────────────────
    /**
     * @param {string} text   - Text k zobrazení
     * @param {'cmd'|'ok'|'err'|'info'|'dim'|'sys'|'warn'|'ascii'} cls
     */
    function print(text, cls = 'ok') {
        const out  = output();
        if (!out) return;
        const line = document.createElement('div');
        line.className = `term-line ${cls}`;
        line.textContent = text;
        out.appendChild(line);
        out.scrollTop = out.scrollHeight;
        return line;
    }

    function printRaw(html, cls = 'ok') {
        const out  = output();
        if (!out) return;
        const line = document.createElement('div');
        line.className = `term-line ${cls}`;
        line.innerHTML = html;
        out.appendChild(line);
        out.scrollTop = out.scrollHeight;
        return line;
    }

    function printSep() {
        print('─'.repeat(60), 'dim');
    }

    // ── Pomocníci pro data ───────────────────────────────────
    function getKey(base) {
        return window.getAppKey ? window.getAppKey(base) : base;
    }

    function lsGet(base) {
        try { return JSON.parse(localStorage.getItem(getKey(base))); } catch { return null; }
    }

    function lsSet(base, data) {
        localStorage.setItem(getKey(base), JSON.stringify(data));
    }

    // ── Zpracování příkazů ───────────────────────────────────
    function processCommand(raw) {
        const trimmed = raw.trim();
        if (!trimmed) return;

        // Zapamatuj do historie
        if (cmdHistory[0] !== trimmed) cmdHistory.unshift(trimmed);
        if (cmdHistory.length > 50) cmdHistory.pop();
        histIndex = -1;

        // Echo příkazu
        const promptTxt = promptEl() ? promptEl().textContent : 'darkdash:~# ';
        print(promptTxt + trimmed, 'cmd');

        // Parsování
        const parts   = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        const cmd     = (parts[0] || '').toLowerCase();
        const args    = parts.slice(1).map(a => a.replace(/^"|"$/g, ''));
        const allArgs = args.join(' ');

        switch (cmd) {

            // ── /help ──────────────────────────────────────
            case '/help': {
                printSep();
                print('  DARKDASH ROOT TERMINAL — Dostupné příkazy', 'sys');
                printSep();
                const cmds = [
                    ['/todo [text]',               'Přidat misi do Quest Logu'],
                    ['/note [text]',               'Rychlý záznam do Deníku'],
                    ['/calendar [YYYY-MM-DD] [t]', 'Přidat událost do Kalendáře'],
                    ['/timer [minuty]',             'Spustit odpočítávač'],
                    ['/ls todos',                  'Vypsat posledních 5 misí'],
                    ['/ls notes',                  'Vypsat posledních 5 poznámek'],
                    ['/ls events [YYYY-MM-DD]',    'Vypsat události dne'],
                    ['/theme [id]',                'Přepnout téma (gothic, cyberpunk...)'],
                    ['/themes',                    'Vypsat dostupná témata'],
                    ['/music play|pause|next|prev','Ovládat přehrávač'],
                    ['/volume [0-100]',            'Nastavit hlasitost'],
                    ['/xp',                        'Zobrazit XP a úroveň'],
                    ['/whoami',                    'Info o přihlášeném agentovi'],
                    ['/stat',                      'Statistiky dashboardu'],
                    ['/weather',                   'Aktuální počasí'],
                    ['/quote',                     'Nová motivační citace'],
                    ['/neofetch',                  'System info (hacker styl)'],
                    ['/matrix',                    'Aktivovat Matrix efekt'],
                    ['/hack',                      'Simulace hackování'],
                    ['/clear',                     'Vymazat historii terminálu'],
                    ['/exit',                      'Zavřít terminál'],
                ];
                cmds.forEach(([c, d]) => {
                    printRaw(`  <span style="color:#00ff41;min-width:240px;display:inline-block">${c}</span><span style="color:#00802a"> — ${d}</span>`, '');
                });
                printSep();
                break;
            }

            // ── /todo ──────────────────────────────────────
            case '/todo': {
                if (!allArgs) { print('✗ Použití: /todo [název úkolu]', 'err'); break; }
                const newTodo = {
                    text:      allArgs,
                    rarity:    'common',
                    folder:    'Inbox',
                    deadline:  '',
                    completed: false,
                    id:        Date.now()
                };
                // Použij in-memory pole z todo.js (globální proměnná) + zavolej saveTodos() pro UI refresh
                if (typeof todos !== 'undefined' && typeof saveTodos === 'function') {
                    todos.unshift(newTodo);
                    saveTodos(); // saveTodos() zapíše do localStorage + zavolá renderTodoUI()
                } else {
                    // Fallback: přímý zápis pokud modul není načtený
                    const arr = lsGet('darkdash-todos') || [];
                    arr.unshift(newTodo);
                    lsSet('darkdash-todos', arr);
                    if (window.saveToCloud) window.saveToCloud('todos', arr);
                }
                print(`✓ Mise přidána do Quest Logu: "${allArgs}"`, 'ok');
                print(`  ID: ${newTodo.id} · Složka: Inbox · Vzácnost: common`, 'dim');
                break;
            }

            // ── /note ──────────────────────────────────────
            case '/note': {
                if (!allArgs) { print('✗ Použití: /note [text poznámky]', 'err'); break; }
                const newNote = { folder: 'Terminál', text: allArgs };
                // Použij in-memory pole z notes.js + zavolej saveNotesToStorage() pro UI refresh
                if (typeof notes !== 'undefined' && typeof saveNotesToStorage === 'function') {
                    if (typeof folders !== 'undefined' && !folders.includes('Terminál')) {
                        folders.push('Terminál');
                    }
                    notes.push(newNote);
                    saveNotesToStorage();
                } else {
                    const arr = lsGet('darkdash-notes') || [];
                    arr.push(newNote);
                    lsSet('darkdash-notes', arr);
                    if (window.saveToCloud) window.saveToCloud('notes', arr);
                }
                print(`✓ Záznam uložen do Deníku (složka: Terminál)`, 'ok');
                print(`  "${allArgs.substring(0, 60)}${allArgs.length > 60 ? '…' : ''}"`, 'dim');
                break;
            }

            // ── /calendar ──────────────────────────────────
            case '/calendar': {
                const dateArg = args[0];
                const eventText = args.slice(1).join(' ');
                if (!dateArg || !eventText) {
                    print('✗ Použití: /calendar [YYYY-MM-DD] [název události]', 'err');
                    print('  Příklad: /calendar 2025-12-24 Vánoční setkání', 'dim');
                    break;
                }
                if (!/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
                    print('✗ Neplatný formát data. Požadováno: YYYY-MM-DD', 'err');
                    break;
                }
                const evKey  = getKey('darkdash-events');
                const stored = localStorage.getItem(evKey);
                const events = stored ? JSON.parse(stored) : {};
                if (!events[dateArg]) events[dateArg] = [];
                events[dateArg].push(eventText);
                localStorage.setItem(evKey, JSON.stringify(events));
                if (window.saveToCloud) window.saveToCloud('events', events);
                // Obnov UI kalendáře pokud je načtený
                if (typeof renderCalendar === 'function') renderCalendar();
                print(`✓ Událost přidána: ${dateArg} — "${eventText}"`, 'ok');
                break;
            }

            // ── /timer ─────────────────────────────────────
            case '/timer': {
                const mins = parseFloat(args[0]);
                if (!mins || mins <= 0 || mins > 999) {
                    print('✗ Použití: /timer [minuty] (1–999)', 'err');
                    break;
                }
                if (activeTimer) {
                    clearInterval(activeTimer);
                    activeTimer = null;
                    print('⚠ Předchozí časovač zrušen.', 'warn');
                }
                const totalSec = Math.round(mins * 60);
                let elapsed    = 0;
                const barWidth = 30; // znaky

                print(`⏱ Časovač spuštěn: ${mins} min (${totalSec}s)`, 'sys');
                const progressLine = printRaw(buildTimerBar(0, barWidth, totalSec), 'info');

                activeTimer = setInterval(() => {
                    elapsed++;
                    if (progressLine) progressLine.innerHTML = buildTimerBar(elapsed, barWidth, totalSec);
                    if (elapsed >= totalSec) {
                        clearInterval(activeTimer);
                        activeTimer = null;
                        print('✓ ČASOVAČ DOKONČEN! ⏰', 'sys');
                        if (window.playSound) window.playSound('success');
                        // Notifikace
                        if (Notification.permission === 'granted') {
                            new Notification('DarkDash Terminál', { body: `Časovač ${mins} min vypršel!` });
                        }
                    }
                }, 1000);
                break;
            }

            // ── /ls ────────────────────────────────────────
            case '/ls': {
                const sub = (args[0] || '').toLowerCase();
                if (sub === 'todos') {
                    const todos = lsGet('darkdash-todos') || [];
                    if (!todos.length) { print('ℹ Quest Log je prázdný.', 'info'); break; }
                    print(`Quest Log (${todos.length} misí, zobrazuji posledních 5):`, 'sys');
                    todos.slice(0, 5).forEach((t, i) => {
                        const status = t.completed ? '✓' : '○';
                        print(`  ${status} [${i + 1}] ${t.text} (${t.rarity})`, t.completed ? 'dim' : 'ok');
                    });
                } else if (sub === 'notes') {
                    const notes = lsGet('darkdash-notes') || [];
                    if (!notes.length) { print('ℹ Deník je prázdný.', 'info'); break; }
                    print(`Deník (${notes.length} záznamů, zobrazuji posledních 5):`, 'sys');
                    notes.slice(-5).reverse().forEach((n, i) => {
                        print(`  [${i + 1}] [${n.folder}] ${n.text.substring(0, 55)}${n.text.length > 55 ? '…' : ''}`, 'ok');
                    });
                } else if (sub === 'events') {
                    const dateArg = args[1] || new Date().toISOString().split('T')[0];
                    const evKey   = getKey('darkdash-events');
                    const stored  = localStorage.getItem(evKey);
                    const events  = stored ? JSON.parse(stored) : {};
                    const list    = events[dateArg] || [];
                    if (!list.length) { print(`ℹ Žádné události pro ${dateArg}.`, 'info'); break; }
                    print(`Události ${dateArg} (${list.length}):`, 'sys');
                    list.forEach((ev, i) => print(`  [${i + 1}] ${ev}`, 'ok'));
                } else {
                    print('✗ Použití: /ls todos | /ls notes | /ls events [YYYY-MM-DD]', 'err');
                }
                break;
            }

            // ── /theme ─────────────────────────────────────
            case '/theme': {
                if (!allArgs) { print('✗ Použití: /theme [id]  →  zkus: /themes', 'err'); break; }
                if (typeof setTheme === 'function') {
                    setTheme(allArgs);
                    print(`✓ Téma přepnuto na: "${allArgs}"`, 'ok');
                } else {
                    print('✗ Modul témat není dostupný.', 'err');
                }
                break;
            }

            // ── /themes ────────────────────────────────────
            case '/themes': {
                if (typeof themes !== 'undefined') {
                    print('Dostupná témata:', 'sys');
                    themes.forEach(t => print(`  ${t.id.padEnd(16)} — ${t.name}`, 'ok'));
                } else {
                    print('✗ Modul témat není dostupný.', 'err');
                }
                break;
            }

            // ── /music ─────────────────────────────────────
            case '/music': {
                const sub = (args[0] || '').toLowerCase();
                switch (sub) {
                    case 'play':  case 'pause':
                        if (typeof toggleMusic === 'function') { toggleMusic(); print(`✓ Přehrávač: ${sub}`, 'ok'); }
                        else print('✗ Modul hudby není dostupný.', 'err');
                        break;
                    case 'next':
                        if (typeof nextTrack === 'function') { nextTrack(); print('✓ Přeskočeno na další skladbu.', 'ok'); }
                        else print('✗ Modul hudby není dostupný.', 'err');
                        break;
                    case 'prev':
                        if (typeof prevTrack === 'function') { prevTrack(); print('✓ Přeskočeno na předchozí.', 'ok'); }
                        else print('✗ Modul hudby není dostupný.', 'err');
                        break;
                    default:
                        print('✗ Použití: /music play | pause | next | prev', 'err');
                }
                break;
            }

            // ── /volume ────────────────────────────────────
            case '/volume': {
                const vol = parseInt(args[0]);
                if (isNaN(vol) || vol < 0 || vol > 100) {
                    print('✗ Použití: /volume [0-100]', 'err');
                    break;
                }
                if (typeof setVolume === 'function') {
                    setVolume(vol / 100);
                    const bar = '█'.repeat(Math.round(vol / 5)) + '░'.repeat(20 - Math.round(vol / 5));
                    print(`✓ Hlasitost: [${bar}] ${vol}%`, 'ok');
                } else {
                    print('✗ Modul hudby není dostupný.', 'err');
                }
                break;
            }

            // ── /xp ────────────────────────────────────────
            case '/xp': {
                const xp      = parseInt(localStorage.getItem(getKey('darkdash-xp')))  || 0;
                const level   = parseInt(localStorage.getItem(getKey('darkdash-level'))) || 1;
                const xpNext  = level * 100;
                const pct     = Math.min(100, Math.round((xp % xpNext) / xpNext * 100));
                const bar     = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
                print(`⚡ Úroveň: ${level}  ·  XP: ${xp}`, 'sys');
                print(`   Progres: [${bar}] ${pct}%  (do dalšího levelu: ${xpNext - (xp % xpNext)} XP)`, 'info');
                break;
            }

            // ── /whoami ────────────────────────────────────
            case '/whoami': {
                const uid    = window.currentUserUID || null;
                const todos  = (lsGet('darkdash-todos')  || []).length;
                const notes  = (lsGet('darkdash-notes')  || []).length;
                const xp     = parseInt(localStorage.getItem(getKey('darkdash-xp'))) || 0;
                const level  = parseInt(localStorage.getItem(getKey('darkdash-level'))) || 1;
                const theme  = localStorage.getItem('darkdash-theme-id') || 'gothic';
                printSep();
                print(`  Agent    : ${uid ? uid.substring(0, 16) + '...' : 'Guest (nepřihlášen)'}`, 'sys');
                print(`  Mise     : ${todos}`, 'ok');
                print(`  Záznamy  : ${notes}`, 'ok');
                print(`  XP / Lvl : ${xp} / ${level}`, 'ok');
                print(`  Téma     : ${theme}`, 'ok');
                print(`  Terminál : DarkDash Root Terminal v1.0`, 'dim');
                printSep();
                break;
            }

            // ── /stat ──────────────────────────────────────
            case '/stat': {
                const todos     = lsGet('darkdash-todos')  || [];
                const notes     = lsGet('darkdash-notes')  || [];
                const countdowns = lsGet('darkdash-countdowns') || [];
                const done      = todos.filter(t => t.completed).length;
                const pending   = todos.length - done;
                printSep();
                print('  STATISTIKY DARKDASH', 'sys');
                printSep();
                print(`  Quest Log  : ${todos.length} misí  (✓ ${done} splněno, ○ ${pending} čeká)`, 'ok');
                print(`  Deník      : ${notes.length} záznamů`, 'ok');
                print(`  Odpočítávání: ${countdowns.length} aktivních`, 'ok');
                print(`  localStorage: ${Math.round(JSON.stringify(localStorage).length / 1024)} KB využito`, 'dim');
                printSep();
                break;
            }

            // ── /weather ───────────────────────────────────
            case '/weather': {
                const cityEl = document.getElementById('weatherCity');
                const tempEl = document.getElementById('weatherTemp');
                const descEl = document.getElementById('weatherDesc');
                if (cityEl && tempEl) {
                    print(`☁ ${cityEl.textContent || '?'}  —  ${tempEl.textContent || '?'}  ${descEl ? descEl.textContent : ''}`, 'info');
                } else {
                    print('ℹ Počasí není načteno. Otevři dashboard a počkej na aktualizaci.', 'warn');
                }
                break;
            }

            // ── /quote ─────────────────────────────────────
            case '/quote': {
                if (typeof generateQuote === 'function') {
                    generateQuote();
                    const q = document.getElementById('quoteText');
                    print(`📜 ${q ? q.innerText : 'Citace byla aktualizována.'}`, 'info');
                } else {
                    print('✗ Modul citací není dostupný.', 'err');
                }
                break;
            }

            // ── /neofetch ──────────────────────────────────
            case '/neofetch': {
                const ua      = navigator.userAgent;
                const browser = ua.includes('Firefox') ? 'Firefox' :
                                ua.includes('Edg')     ? 'Edge' :
                                ua.includes('Chrome')  ? 'Chrome' :
                                ua.includes('Safari')  ? 'Safari' : 'Unknown';
                const os      = navigator.platform || 'Unknown';
                const theme   = localStorage.getItem('darkdash-theme-id') || 'gothic';
                const xp      = parseInt(localStorage.getItem(getKey('darkdash-xp'))) || 0;
                const now     = new Date();
                const uptime  = Math.round((now - performance.timeOrigin) / 1000);

                print('', 'ascii');
                print('  ██████╗  █████╗ ██████╗ ██╗  ██╗', 'ascii');
                print('  ██╔══██╗██╔══██╗██╔══██╗██║ ██╔╝', 'ascii');
                print('  ██║  ██║███████║██████╔╝█████╔╝ ', 'ascii');
                print('  ██║  ██║██╔══██║██╔══██╗██╔═██╗ ', 'ascii');
                print('  ██████╔╝██║  ██║██║  ██║██║  ██╗', 'ascii');
                print('  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝', 'ascii');
                print('', '');
                print(`  OS       : DarkDash / ${os}`, 'ok');
                print(`  Browser  : ${browser}`, 'ok');
                print(`  Theme    : ${theme}`, 'ok');
                print(`  Uptime   : ${uptime}s`, 'ok');
                print(`  XP       : ${xp}`, 'ok');
                print(`  Terminal : DarkDash Root Terminal v1.0`, 'ok');
                print(`  Kernel   : ${navigator.userAgent.split(' ').slice(-1)[0]}`, 'dim');
                print('', '');
                break;
            }

            // ── /hack ──────────────────────────────────────
            case '/hack': {
                const target = allArgs || 'mainframe.darkdash.local';
                print(`⚡ Zahajuji útok na: ${target}`, 'warn');
                const steps = [
                    [500,  '  [▓░░░░░░░░░] Skenování portů...'],
                    [1000, '  [▓▓▓░░░░░░░] Port 22 (SSH) otevřen!'],
                    [1500, '  [▓▓▓▓▓░░░░░] Injekce payloadu...'],
                    [2000, '  [▓▓▓▓▓▓▓░░░] Obcházení firewallu...'],
                    [2500, '  [▓▓▓▓▓▓▓▓▓░] Dešifrování hash...'],
                    [3200, '  [▓▓▓▓▓▓▓▓▓▓] ACCESS GRANTED'],
                    [3600, `  ✓ Root přístup k ${target} získán.`],
                ];
                steps.forEach(([delay, msg]) => {
                    setTimeout(() => {
                        print(msg, msg.includes('GRANTED') || msg.includes('✓') ? 'sys' : 'dim');
                        if (output()) output().scrollTop = output().scrollHeight;
                    }, delay);
                });
                break;
            }

            // ── /matrix ────────────────────────────────────
            case '/matrix': {
                const canvas = document.getElementById('matrixCanvas');
                if (!canvas) { print('✗ Matrix canvas nenalezen.', 'err'); break; }

                if (matrixInterval) {
                    clearInterval(matrixInterval);
                    matrixInterval = null;
                    canvas.style.display = 'none';
                    print('Matrix deaktivován.', 'dim');
                    break;
                }

                canvas.style.display = 'block';
                canvas.width  = window.innerWidth;
                canvas.height = window.innerHeight;
                const ctx   = canvas.getContext('2d');
                const cols  = Math.floor(canvas.width / 16);
                const drops = Array(cols).fill(1);
                const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';

                matrixInterval = setInterval(() => {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#00ff41';
                    ctx.font = '14px Share Tech Mono, monospace';
                    drops.forEach((y, i) => {
                        const c = chars[Math.floor(Math.random() * chars.length)];
                        ctx.fillText(c, i * 16, y * 16);
                        if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
                        drops[i]++;
                    });
                }, 50);

                print('Matrix aktivován. Znovu /matrix pro vypnutí.', 'sys');
                setTimeout(() => {
                    clearInterval(matrixInterval);
                    matrixInterval = null;
                    canvas.style.display = 'none';
                }, 30000); // auto-stop po 30s
                break;
            }

            // ── /clear ─────────────────────────────────────
            case '/clear': {
                if (output()) output().innerHTML = '';
                break;
            }

            // ── /exit ──────────────────────────────────────
            case '/exit': {
                print('Odpojuji se od sítě...', 'dim');
                setTimeout(closeTerminal, 400);
                break;
            }

            // ── Neznámý příkaz ─────────────────────────────
            default: {
                print(`✗ Neznámý příkaz: "${cmd}". Zkus /help`, 'err');
            }
        }
    }

    // ── Timer progress bar ────────────────────────────────
    function buildTimerBar(elapsed, width, total) {
        const pct    = Math.min(1, elapsed / total);
        const filled = Math.round(pct * width);
        const empty  = width - filled;
        const rem    = total - elapsed;
        const m      = String(Math.floor(rem / 60)).padStart(2, '0');
        const s      = String(rem % 60).padStart(2, '0');
        const bar    = '█'.repeat(filled) + '░'.repeat(empty);
        return `⏱ [${bar}] ${m}:${s} zbývá`;
    }

    // ── Klávesové zkratky ─────────────────────────────────
    document.addEventListener('keydown', (e) => {
        // Klávesa T otevře/zavře terminál (pokud nepíšeme do inputu)
        if (e.key.toLowerCase() === 't') {
            const active = document.activeElement;
            const isTyping = active && (
                active.tagName === 'INPUT' ||
                active.tagName === 'TEXTAREA' ||
                active.isContentEditable
            );
            // Pokud jsme v terminálu, necháme T projít do inputu
            if (termOpen && active && active.id === 'termInput') return;
            if (!isTyping) {
                e.preventDefault();
                window.toggleTerminal();
            }
        }

        // Esc zavře terminál
        if (e.key === 'Escape' && termOpen) {
            // Pokud je otevřený modal, nechej Esc na něj
            if (!document.querySelector('.modal.show')) {
                closeTerminal();
            }
        }
    });

    // ── Input: Enter, šipky, autocomplete ────────────────
    function initInput() {
        const inp = input();
        if (!inp) return;

        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const val = inp.value;
                inp.value = '';
                processCommand(val);
            }

            // Šipka nahoru — předchozí příkaz
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (histIndex < cmdHistory.length - 1) histIndex++;
                inp.value = cmdHistory[histIndex] || '';
                setTimeout(() => inp.setSelectionRange(inp.value.length, inp.value.length), 0);
            }

            // Šipka dolů — novější příkaz
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (histIndex > 0) histIndex--;
                else { histIndex = -1; inp.value = ''; return; }
                inp.value = cmdHistory[histIndex] || '';
            }

            // Tab — autocomplete příkazů
            if (e.key === 'Tab') {
                e.preventDefault();
                const allCmds = [
                    '/help','/todo','/note','/calendar','/timer','/ls',
                    '/theme','/themes','/music','/volume','/xp','/whoami',
                    '/stat','/weather','/quote','/neofetch','/hack','/matrix',
                    '/clear','/exit'
                ];
                const val = inp.value;
                const matches = allCmds.filter(c => c.startsWith(val));
                if (matches.length === 1) {
                    inp.value = matches[0] + ' ';
                } else if (matches.length > 1) {
                    print(matches.join('  '), 'dim');
                }
            }
        });
    }

    // ── Boot sekvence (uvítací zprávy) ───────────────────
    function bootSequence() {
        const lines = [
            { text: '╔══════════════════════════════════════════════════════╗', cls: 'dim' },
            { text: '║         DARKDASH ROOT TERMINAL  v1.0                ║', cls: 'sys' },
            { text: '║         Všechna práva vyhrazena · Vstup povolen      ║', cls: 'dim' },
            { text: '╚══════════════════════════════════════════════════════╝', cls: 'dim' },
            { text: '', cls: 'ok' },
            { text: '  Inicializuji moduly...', cls: 'dim' },
        ];
        const modules = [
            ['todo.js', lsGet('darkdash-todos')],
            ['notes.js', lsGet('darkdash-notes')],
            ['calendar.js', null],
            ['pomodoro.js', null],
            ['themes.js', null],
        ];

        lines.forEach((l, i) => {
            setTimeout(() => print(l.text, l.cls), i * 60);
        });

        const base = lines.length * 60;
        modules.forEach(([mod], i) => {
            setTimeout(() => print(`  ✓ ${mod} načten`, 'dim'), base + i * 80);
        });

        setTimeout(() => {
            print('', 'ok');
            print('  Připojení navázáno. Zadej /help pro seznam příkazů.', 'ok');
            print('', 'ok');
        }, base + modules.length * 80 + 100);
    }

    // ── Inicializace ──────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        // Ujisti se, že terminál existuje
        const el = terminal();
        if (!el) { console.warn('DarkDash Terminal: #darkTerminal nenalezen v HTML.'); return; }

        initInput();

        // Hint button kliknutí
        const hint = document.getElementById('termHint');
        if (hint) hint.addEventListener('click', window.toggleTerminal);

        // Při prvním otevření spusť boot sekvenci (jen jednou)
        let booted = false;
        const origOpen = openTerminal;
        const openWithBoot = function () {
            origOpen();
            if (!booted) {
                booted = true;
                bootSequence();
            }
        };
        // Přepsat openTerminal
        openTerminal = openWithBoot;

        console.log('%c DarkDash Terminal ready. Press [T] to open. ', 'background:#000;color:#00ff41;font-family:monospace;padding:4px 8px;');
    });

})();