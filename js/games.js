// ══════════════════════════════════════════════
//  DARKDASH — DIGIHRY  (Enhanced v2.0)
//  Hry: Snake | Piškvorky | Memory
//  Easter egg: DOOM (pravý klik na Zavřít)
// ══════════════════════════════════════════════

// --- GLOBÁLNÍ PROMĚNNÉ: SNAKE ---
let canvas, ctx;
const box = 20;
let snake = [];
let food = {};
let score = 0;
let d = null;
let nextD = null;          // Buffer pro směr — fix pro rychlé otočení
let gameLoop;
let isGameRunning = false;
let snakeHighScore = 0;

// --- INIT ---
function initGameVars() {
    canvas = document.getElementById('snakeCanvas');
    if (canvas) ctx = canvas.getContext('2d');
}

// ══════════════════════════════════════════════
//  PŘEPÍNÁNÍ HER
// ══════════════════════════════════════════════
function switchGame(game) {
    // Zastavit snake pokud běží
    if (isGameRunning) {
        clearInterval(gameLoop);
        isGameRunning = false;
    }

    const snakeEl   = document.getElementById('game-snake');
    const tictacEl  = document.getElementById('game-tictac');
    const memoryEl  = document.getElementById('game-memory');
    const btnSnake  = document.getElementById('btnSnake');
    const btnTictac = document.getElementById('btnTictac');
    const btnMemory = document.getElementById('btnMemory');

    // Skrýt vše
    [snakeEl, tictacEl, memoryEl].forEach(el => {
        if (el) el.style.setProperty('display', 'none', 'important');
    });
    [btnSnake, btnTictac, btnMemory].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });

    if (game === 'snake') {
        if (snakeEl) snakeEl.style.setProperty('display', 'flex', 'important');
        if (btnSnake) btnSnake.classList.add('active');
        resetSnakeUI();
    } else if (game === 'tictac') {
        if (tictacEl) tictacEl.style.setProperty('display', 'flex', 'important');
        if (btnTictac) btnTictac.classList.add('active');
        initTicTac();
    } else if (game === 'memory') {
        if (memoryEl) memoryEl.style.setProperty('display', 'flex', 'important');
        if (btnMemory) btnMemory.classList.add('active');
        initMemory();
    }
}

// ══════════════════════════════════════════════
//  SNAKE — OPRAVENÁ VERZE
// ══════════════════════════════════════════════
function _generateFood() {
    // Spawn food uvnitř hranic gridu (1..14), ne na okraji
    const cols = Math.floor(canvas.width  / box);
    const rows = Math.floor(canvas.height / box);
    let fx, fy, tries = 0;
    do {
        fx = Math.floor(Math.random() * (cols - 2) + 1) * box;
        fy = Math.floor(Math.random() * (rows - 2) + 1) * box;
        tries++;
    } while (collision({ x: fx, y: fy }, snake) && tries < 100);
    return { x: fx, y: fy };
}

function resetSnakeUI() {
    initGameVars();
    clearInterval(gameLoop);
    isGameRunning = false;
    d = null;
    nextD = null;

    const overlay = document.getElementById('snakeOverlay');
    if (overlay) overlay.style.setProperty('display', 'flex', 'important');

    if (ctx) {
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    score = 0;
    _updateSnakeScore();
}

function startSnakeGame() {
    initGameVars();
    if (!ctx) { console.error("Canvas nenalezen!"); return; }

    const overlay = document.getElementById('snakeOverlay');
    if (overlay) overlay.style.setProperty('display', 'none', 'important');

    isGameRunning = true;
    d = null;
    nextD = null;
    score = 0;
    _updateSnakeScore();

    // Had — startovní pozice uprostřed, délka 3
    const midX = Math.floor(canvas.width  / box / 2) * box;
    const midY = Math.floor(canvas.height / box / 2) * box;
    snake = [
        { x: midX,         y: midY },
        { x: midX - box,   y: midY },
        { x: midX - 2*box, y: midY }
    ];

    food = _generateFood();

    clearInterval(gameLoop);
    drawSnakeFrame();
    gameLoop = setInterval(drawSnakeFrame, 110);
}

// Klávesnice — buffered direction
document.addEventListener("keydown", direction);

function direction(event) {
    if (!isGameRunning) return;
    const snakeContainer = document.getElementById('game-snake');
    if (!snakeContainer || getComputedStyle(snakeContainer).display === 'none') return;

    const key = event.keyCode;
    if ([37, 38, 39, 40].includes(key)) event.preventDefault();

    // Ukládat do bufferu, aby rychlé dvojité stisknutí nezpůsobilo 180° otočení
    const cur = d || "RIGHT";
    if (key === 37 && cur !== "RIGHT")  nextD = "LEFT";
    else if (key === 38 && cur !== "DOWN")   nextD = "UP";
    else if (key === 39 && cur !== "LEFT")   nextD = "RIGHT";
    else if (key === 40 && cur !== "UP")     nextD = "DOWN";
}

function drawSnakeFrame() {
    if (!ctx) return;

    // Aplikovat buffer směru
    if (nextD) { d = nextD; nextD = null; }

    // Pozadí
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid (jemný)
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += box) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += box) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    ctx.lineWidth = 1;

    // Had
    for (let i = 0; i < snake.length; i++) {
        const isHead = i === 0;
        ctx.shadowBlur = isHead ? 18 : 4;
        ctx.shadowColor = isHead ? "#c77dff" : "#7b2cbf";
        ctx.fillStyle = isHead ? "#c77dff" : (i % 2 === 0 ? "#9d4edd" : "#7b2cbf");

        const pad = isHead ? 1 : 2;
        ctx.beginPath();
        ctx.roundRect
            ? ctx.roundRect(snake[i].x + pad, snake[i].y + pad, box - pad*2, box - pad*2, isHead ? 5 : 3)
            : ctx.rect(snake[i].x + pad, snake[i].y + pad, box - pad*2, box - pad*2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Jídlo — pulzující
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 200);
    ctx.shadowBlur = 20 * pulse;
    ctx.shadowColor = "#ef4444";
    ctx.fillStyle = "#ef4444";
    const fp = 3;
    ctx.beginPath();
    ctx.roundRect
        ? ctx.roundRect(food.x + fp, food.y + fp, box - fp*2, box - fp*2, 4)
        : ctx.rect(food.x + fp, food.y + fp, box - fp*2, box - fp*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Pokud se nehýbeme (čekáme na klávesu)
    if (!d) return;

    // Nová hlava
    let nx = snake[0].x;
    let ny = snake[0].y;
    if (d === "LEFT")  nx -= box;
    if (d === "UP")    ny -= box;
    if (d === "RIGHT") nx += box;
    if (d === "DOWN")  ny += box;

    const newHead = { x: nx, y: ny };

    // Kolize — kontrola PŘED přidáním hlavy (fix původního bugu)
    if (nx < 0 || nx >= canvas.width ||
        ny < 0 || ny >= canvas.height ||
        collision(newHead, snake)) {
        gameOver();
        return;
    }

    // Jídlo
    if (nx === food.x && ny === food.y) {
        score++;
        _updateSnakeScore();
        food = _generateFood();
        // Při každém 5. jídle trochu zrychlit
        if (score % 5 === 0) {
            clearInterval(gameLoop);
            const speed = Math.max(60, 110 - score * 3);
            gameLoop = setInterval(drawSnakeFrame, speed);
        }
    } else {
        snake.pop();
    }

    snake.unshift(newHead);
}

function _updateSnakeScore() {
    const scoreEl = document.getElementById('snakeScore');
    if (scoreEl) scoreEl.innerText = score;
    if (score > snakeHighScore) {
        snakeHighScore = score;
        const hsEl = document.getElementById('snakeHighScore');
        if (hsEl) hsEl.innerText = snakeHighScore;
    }
}

function collision(head, array) {
    for (let i = 0; i < array.length; i++) {
        if (head.x === array[i].x && head.y === array[i].y) return true;
    }
    return false;
}

function gameOver() {
    clearInterval(gameLoop);
    isGameRunning = false;
    d = null;
    nextD = null;

    // Overlay game over
    ctx.fillStyle = "rgba(0,0,0,0.82)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ef4444";
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 28px Cinzel, serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 16);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#aaa";
    ctx.font = "14px sans-serif";
    ctx.fillText(`Skóre: ${score}`, canvas.width / 2, canvas.height / 2 + 14);

    setTimeout(() => {
        const overlay = document.getElementById('snakeOverlay');
        if (overlay) overlay.style.setProperty('display', 'flex', 'important');
    }, 1800);
}

// ══════════════════════════════════════════════
//  PIŠKVORKY — OPRAVENÁ VERZE
// ══════════════════════════════════════════════
let tttBoard = ['', '', '', '', '', '', '', '', ''];
let tttGameActive = true;
let tttCpuThinking = false;   // Zamezí double-click během CPU tahu

function initTicTac() {
    const tttGrid   = document.getElementById('tictacGrid');
    const tttStatus = document.getElementById('tictacStatus');
    if (!tttGrid) return;

    tttBoard = ['', '', '', '', '', '', '', '', ''];
    tttGameActive  = true;
    tttCpuThinking = false;
    tttGrid.innerHTML = '';

    if (tttStatus) tttStatus.innerText = "Jsi na tahu";

    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('ttt-cell');
        cell.setAttribute('data-index', i);
        cell.addEventListener('click', handleCellClick);
        tttGrid.appendChild(cell);
    }
}

function handleCellClick(e) {
    const cell  = e.target;
    const index = parseInt(cell.getAttribute('data-index'));
    if (tttBoard[index] !== '' || !tttGameActive || tttCpuThinking) return;

    handlePlayerMove(cell, index, 'X');
    const result = checkResult('X');

    if (!result && tttGameActive) {
        tttCpuThinking = true;
        setTimeout(cpuMove, 420);
    }
}

function cpuMove() {
    if (!tttGameActive) return;

    let idx = -1;
    // 1. Vyhrát
    idx = findWinningMove('O');
    // 2. Blokovat
    if (idx === -1) idx = findWinningMove('X');
    // 3. Roh
    if (idx === -1) {
        const corners = [0, 2, 6, 8].filter(i => tttBoard[i] === '');
        if (corners.length) idx = corners[Math.floor(Math.random() * corners.length)];
    }
    // 4. Střed
    if (idx === -1 && tttBoard[4] === '') idx = 4;
    // 5. Náhoda
    if (idx === -1) {
        const empty = tttBoard.map((v, i) => v === '' ? i : null).filter(v => v !== null);
        if (empty.length) idx = empty[Math.floor(Math.random() * empty.length)];
    }

    if (idx !== -1) {
        const cpuCell = document.querySelector(`.ttt-cell[data-index='${idx}']`);
        if (cpuCell) {
            handlePlayerMove(cpuCell, idx, 'O');
            checkResult('O');
        }
    }

    tttCpuThinking = false;
}

function findWinningMove(player) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a, b, c] of wins) {
        const vals = [tttBoard[a], tttBoard[b], tttBoard[c]];
        if (vals.filter(v => v === player).length === 2 && vals.includes('')) {
            if (tttBoard[a] === '') return a;
            if (tttBoard[b] === '') return b;
            return c;
        }
    }
    return -1;
}

function handlePlayerMove(cell, index, player) {
    tttBoard[index] = player;
    cell.innerText = player === 'X' ? '†' : '☠';
    cell.classList.add(player.toLowerCase());
}

// Vrací true pokud hra skončila
function checkResult(lastPlayer) {
    const tttStatus = document.getElementById('tictacStatus');
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

    for (const [a, b, c] of wins) {
        if (tttBoard[a] && tttBoard[a] === tttBoard[b] && tttBoard[b] === tttBoard[c]) {
            tttGameActive = false;
            // Zvýraznit vítězné políčka
            [a, b, c].forEach(i => {
                const el = document.querySelector(`.ttt-cell[data-index='${i}']`);
                if (el) el.classList.add('winner');
            });
            if (tttStatus) {
                tttStatus.innerText = lastPlayer === 'X' ? "Vítězství!" : "Prohra!";
            }
            return true;
        }
    }

    if (!tttBoard.includes('')) {
        tttGameActive = false;
        if (tttStatus) tttStatus.innerText = "Remíza!";
        return true;
    }

    // Informovat kdo je na tahu
    if (tttStatus && tttGameActive) {
        tttStatus.innerText = lastPlayer === 'X' ? "Tah soupeře..." : "Jsi na tahu";
    }

    return false;
}

// ══════════════════════════════════════════════
//  MEMORY — NOVÁ HRA
//  Otočit všechny páry karet co nejrychleji
// ══════════════════════════════════════════════
let memoryCards = [];
let memoryFlipped = [];
let memoryMatched = [];
let memoryLocked = false;
let memoryMoves = 0;
let memoryTimer = null;
let memorySeconds = 0;
let memoryGameStarted = false;

// Gothic symboly jako páry
const MEMORY_SYMBOLS = ['✝', '☽', '⚔', '☠', '♦', '⚜', '†', '⚡'];

function initMemory() {
    clearInterval(memoryTimer);
    memoryFlipped  = [];
    memoryMatched  = [];
    memoryLocked   = false;
    memoryMoves    = 0;
    memorySeconds  = 0;
    memoryGameStarted = false;

    _updateMemoryUI();

    // Vytvořit 16 karet (8 párů) a zamíchat
    const pairs = [...MEMORY_SYMBOLS, ...MEMORY_SYMBOLS];
    memoryCards = pairs
        .map((sym, i) => ({ id: i, sym, matched: false }))
        .sort(() => Math.random() - 0.5);

    const grid = document.getElementById('memoryGrid');
    if (!grid) return;
    grid.innerHTML = '';

    memoryCards.forEach((card, idx) => {
        const el = document.createElement('div');
        el.className = 'memory-card';
        el.setAttribute('data-idx', idx);
        el.innerHTML = `<div class="memory-inner">
            <div class="memory-front">?</div>
            <div class="memory-back">${card.sym}</div>
        </div>`;
        el.addEventListener('click', () => handleMemoryClick(idx));
        grid.appendChild(el);
    });
}

function handleMemoryClick(idx) {
    if (memoryLocked) return;
    if (memoryMatched.includes(idx)) return;
    if (memoryFlipped.includes(idx)) return;
    if (memoryFlipped.length >= 2) return;

    // Start timeru při první kartě
    if (!memoryGameStarted) {
        memoryGameStarted = true;
        memoryTimer = setInterval(() => {
            memorySeconds++;
            _updateMemoryUI();
        }, 1000);
    }

    // Otočit kartu
    memoryFlipped.push(idx);
    _flipCard(idx, true);

    if (memoryFlipped.length === 2) {
        memoryMoves++;
        _updateMemoryUI();
        memoryLocked = true;

        const [a, b] = memoryFlipped;
        if (memoryCards[a].sym === memoryCards[b].sym) {
            // Shoda
            memoryMatched.push(a, b);
            _markMatched(a);
            _markMatched(b);
            memoryFlipped = [];
            memoryLocked  = false;

            if (memoryMatched.length === memoryCards.length) {
                _memoryWin();
            }
        } else {
            // Neodpovídá — schovat po 900ms
            setTimeout(() => {
                _flipCard(a, false);
                _flipCard(b, false);
                memoryFlipped = [];
                memoryLocked  = false;
            }, 900);
        }
    }
}

function _flipCard(idx, show) {
    const el = document.querySelector(`.memory-card[data-idx='${idx}']`);
    if (!el) return;
    if (show) el.classList.add('flipped');
    else el.classList.remove('flipped');
}

function _markMatched(idx) {
    const el = document.querySelector(`.memory-card[data-idx='${idx}']`);
    if (el) el.classList.add('matched');
}

function _memoryWin() {
    clearInterval(memoryTimer);
    const status = document.getElementById('memoryStatus');
    if (status) {
        status.innerHTML = `Hotovo! <span class="text-warning">${memoryMoves} tahů</span> za <span class="text-info">${memorySeconds}s</span>`;
    }
}

function _updateMemoryUI() {
    const movesEl = document.getElementById('memoryMoves');
    const timerEl = document.getElementById('memoryTimer');
    if (movesEl) movesEl.innerText = memoryMoves;
    if (timerEl) timerEl.innerText = memorySeconds + 's';
}

// ══════════════════════════════════════════════
//  DOOM — EASTER EGG
//  js-dos v8 CDN, shareware Doom 1 bundle
//  Skripty se načtou lazy při prvním spuštění
// ══════════════════════════════════════════════
let _doomInstance = null;
let _doomScriptsLoaded = false;

function triggerDoom(event) {
    if (event) event.preventDefault();

    const container  = document.getElementById('doom-container');
    const closeBtn   = document.getElementById('doom-close-btn');
    const loading    = document.getElementById('doom-loading');

    if (!container) return;

    container.style.display = 'block';
    if (closeBtn) closeBtn.style.display = 'inline-block';
    if (loading)  loading.style.display  = 'flex';

    if (_doomScriptsLoaded) {
        _launchDoom();
        return;
    }

    // Lazy load js-dos v8 CSS + JS
    if (!document.getElementById('jsdos-css')) {
        const link = document.createElement('link');
        link.id   = 'jsdos-css';
        link.rel  = 'stylesheet';
        link.href = 'https://v8.js-dos.com/latest/js-dos.css';
        document.head.appendChild(link);
    }

    if (!document.getElementById('jsdos-js')) {
        const script  = document.createElement('script');
        script.id     = 'jsdos-js';
        script.src    = 'https://v8.js-dos.com/latest/js-dos.js';
        script.onload = () => {
            _doomScriptsLoaded = true;
            _launchDoom();
        };
        script.onerror = () => {
            if (loading) loading.innerHTML =
                '<span class="text-danger brand-font">Nepodařilo se načíst engine.</span>';
        };
        document.head.appendChild(script);
    }
}

function _launchDoom() {
    if (_doomInstance) return; // Už běží

    const target  = document.getElementById('jsdos-target');
    const loading = document.getElementById('doom-loading');
    if (!target || typeof Dos === 'undefined') return;

    _doomInstance = Dos(target, {
        url: 'https://v8.js-dos.com/bundles/doom.jsdos',
    });

    // Schovat loading jakmile se emulator inicializuje
    if (_doomInstance && _doomInstance.layers) {
        if (loading) loading.style.display = 'none';
    } else {
        // Fallback — schovat po 4s
        setTimeout(() => {
            if (loading) loading.style.display = 'none';
        }, 4000);
    }
}

function closeDoom() {
    const container = document.getElementById('doom-container');
    const closeBtn  = document.getElementById('doom-close-btn');
    const target    = document.getElementById('jsdos-target');
    const loading   = document.getElementById('doom-loading');

    if (container) container.style.display = 'none';
    if (closeBtn)  closeBtn.style.display  = 'none';

    // Zastavit emulaci
    if (_doomInstance) {
        try { _doomInstance.stop(); } catch(e) {}
        _doomInstance = null;
    }

    // Vyčistit target div pro příště
    if (target) target.innerHTML = '';
    if (loading) loading.style.display = 'flex';
}

// ══════════════════════════════════════════════
//  CSS INJECTION — styly pro nové prvky
// ══════════════════════════════════════════════
function _injectGameStyles() {
    if (document.getElementById('darkdash-game-styles')) return;
    const style = document.createElement('style');
    style.id = 'darkdash-game-styles';
    style.textContent = `
        /* --- TIC TAC TOE --- */
        .ttt-cell {
            width: 80px; height: 80px;
            display: flex; align-items: center; justify-content: center;
            font-size: 28px; cursor: pointer;
            border: 1px solid rgba(157,78,221,0.25);
            border-radius: 8px;
            background: rgba(0,0,0,0.3);
            transition: background .15s, box-shadow .15s;
            user-select: none;
        }
        .ttt-cell:hover:not(.x):not(.o) {
            background: rgba(157,78,221,0.12);
            box-shadow: 0 0 8px rgba(157,78,221,0.3);
        }
        .ttt-cell.x { color: #c77dff; text-shadow: 0 0 10px #c77dff; }
        .ttt-cell.o { color: #ef4444; text-shadow: 0 0 10px #ef4444; }
        .ttt-cell.winner {
            background: rgba(255,193,7,0.15) !important;
            border-color: #ffc107 !important;
            box-shadow: 0 0 14px rgba(255,193,7,0.4);
        }
        .tictac-grid {
            display: grid;
            grid-template-columns: repeat(3, 80px);
            gap: 8px;
        }

        /* --- MEMORY --- */
        .memory-grid {
            display: grid;
            grid-template-columns: repeat(4, 64px);
            gap: 10px;
        }
        .memory-card {
            width: 64px; height: 64px;
            perspective: 600px;
            cursor: pointer;
        }
        .memory-inner {
            width: 100%; height: 100%;
            position: relative;
            transform-style: preserve-3d;
            transition: transform .4s ease;
        }
        .memory-card.flipped .memory-inner,
        .memory-card.matched .memory-inner {
            transform: rotateY(180deg);
        }
        .memory-front, .memory-back {
            position: absolute; inset: 0;
            display: flex; align-items: center; justify-content: center;
            border-radius: 8px;
            backface-visibility: hidden;
            font-size: 24px;
        }
        .memory-front {
            background: rgba(157,78,221,0.15);
            border: 1px solid rgba(157,78,221,0.3);
            color: rgba(157,78,221,0.6);
            font-size: 20px;
            font-weight: bold;
            transition: background .2s;
        }
        .memory-card:hover:not(.flipped):not(.matched) .memory-front {
            background: rgba(157,78,221,0.28);
        }
        .memory-back {
            background: rgba(0,0,0,0.5);
            border: 1px solid rgba(157,78,221,0.5);
            color: #c77dff;
            transform: rotateY(180deg);
            text-shadow: 0 0 10px #c77dff;
        }
        .memory-card.matched .memory-back {
            border-color: #ffc107;
            color: #ffc107;
            text-shadow: 0 0 12px #ffc107;
            background: rgba(255,193,7,0.1);
        }
    `;
    document.head.appendChild(style);
}

// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    initGameVars();
    _injectGameStyles();

    const snakeEl = document.getElementById('game-snake');
    if (snakeEl && getComputedStyle(snakeEl).display !== 'none') {
        resetSnakeUI();
    }
});