// Globální proměnné pro hry
let canvas, ctx;
const box = 20; 
let snake = [];
let food = {};
let score = 0;
let d = null; // Směr
let gameLoop;
let isGameRunning = false;

// --- INIT FUNKCE ---
// Zajistí, že máme přístup ke Canvasu
function initGameVars() {
    canvas = document.getElementById('snakeCanvas');
    if (canvas) ctx = canvas.getContext('2d');
}

// --- PŘEPÍNÁNÍ HER ---
function switchGame(game) {
    const snakeEl = document.getElementById('game-snake');
    const tictacEl = document.getElementById('game-tictac');
    const btnSnake = document.getElementById('btnSnake');
    const btnTictac = document.getElementById('btnTictac');

    // Reset tlačítek
    btnSnake.classList.remove('active');
    btnTictac.classList.remove('active');

    if (game === 'snake') {
        // Zobrazit hada, skrýt piškvorky (použití !important pro přebití Bootstrapu)
        if(snakeEl) snakeEl.style.setProperty('display', 'flex', 'important');
        if(tictacEl) tictacEl.style.setProperty('display', 'none', 'important');
        
        btnSnake.classList.add('active');
        resetSnakeUI();
    } else {
        // Zobrazit piškvorky, skrýt hada
        if(snakeEl) snakeEl.style.setProperty('display', 'none', 'important');
        if(tictacEl) tictacEl.style.setProperty('display', 'flex', 'important');
        
        btnTictac.classList.add('active');
        initTicTac();
    }
}

// --- LOGIKA HADA ---

function resetSnakeUI() {
    initGameVars();
    clearInterval(gameLoop);
    isGameRunning = false;
    d = null; // Reset směru

    // Zobrazit startovací overlay
    const overlay = document.getElementById('snakeOverlay');
    if(overlay) overlay.style.setProperty('display', 'flex', 'important');
    
    // Vykreslit černé pozadí
    if(ctx) {
        ctx.fillStyle = "#0a0a0a"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    score = 0;
    const scoreEl = document.getElementById('snakeScore');
    if(scoreEl) scoreEl.innerText = score;
}

function startSnakeGame() {
    initGameVars();
    if (!ctx) {
        console.error("Canvas nenalezen! Hra nemůže začít.");
        return;
    }
    
    // Skrýt overlay
    const overlay = document.getElementById('snakeOverlay');
    if(overlay) overlay.style.setProperty('display', 'none', 'important');
    
    isGameRunning = true;
    
    // Startovní pozice hada (uprostřed)
    snake = [];
    snake[0] = { x: 9 * box, y: 10 * box };
    
    // Generování jídla
    food = {
        x: Math.floor(Math.random() * 15 + 1) * box,
        y: Math.floor(Math.random() * 15 + 1) * box
    };
    
    d = null; // Čekáme na klávesu
    score = 0;
    
    clearInterval(gameLoop);
    drawSnakeFrame(); // První vykreslení
    gameLoop = setInterval(drawSnakeFrame, 100);
}

// Ovládání klávesnicí
document.addEventListener("keydown", direction);

function direction(event) {
    if (!isGameRunning) return;
    
    // Kontrola, zda je had viditelný
    const snakeContainer = document.getElementById('game-snake');
    if(!snakeContainer || getComputedStyle(snakeContainer).display === 'none') return;
    
    let key = event.keyCode;
    
    // Zákaz scrollování šipkami
    if([37, 38, 39, 40].includes(key)) event.preventDefault();

    // Logika změny směru (nelze se otočit o 180 stupňů)
    if(key == 37 && d != "RIGHT") d = "LEFT";
    else if(key == 38 && d != "DOWN") d = "UP";
    else if(key == 39 && d != "LEFT") d = "RIGHT";
    else if(key == 40 && d != "UP") d = "DOWN";
}

function drawSnakeFrame() {
    if (!ctx) return;

    // 1. Vykreslit pozadí (smazat minulé)
    ctx.fillStyle = "#0a0a0a"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Vykreslit hada
    for(let i = 0; i < snake.length; i++) {
        // Hlava svítí fialově, tělo tmavší
        ctx.fillStyle = (i == 0) ? "#9d4edd" : "#7b2cbf"; 
        
        // Efekt záře pro hlavu
        ctx.shadowBlur = (i == 0) ? 15 : 0;
        ctx.shadowColor = "#9d4edd";
        
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
        
        // Obrys
        ctx.strokeStyle = "#000";
        ctx.shadowBlur = 0; // Reset stínu pro obrys
        ctx.strokeRect(snake[i].x, snake[i].y, box, box);
    }

    // 3. Vykreslit jídlo
    ctx.fillStyle = "#ef4444";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ef4444";
    ctx.fillRect(food.x, food.y, box, box);
    ctx.shadowBlur = 0; // Reset

    // 4. Pokud se had nehýbe (start hry), končíme vykreslování zde
    if(!d) return; 

    // 5. Výpočet nové hlavy
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if( d == "LEFT") snakeX -= box;
    if( d == "UP") snakeY -= box;
    if( d == "RIGHT") snakeX += box;
    if( d == "DOWN") snakeY += box;

    // 6. Logika jídla a pohybu
    if(snakeX == food.x && snakeY == food.y) {
        // Snědl jídlo -> Had roste (nepoužijeme pop), skóre +1
        score++;
        const scoreEl = document.getElementById('snakeScore');
        if(scoreEl) scoreEl.innerText = score;
        
        // Nové jídlo
        food = {
            x: Math.floor(Math.random() * 15 + 1) * box,
            y: Math.floor(Math.random() * 15 + 1) * box
        }
    } else {
        // Nesnědl -> Odstraníme ocas (pohyb)
        snake.pop();
    }

    // 7. Kontrola kolize (Zdí nebo sám se sebou)
    let newHead = { x: snakeX, y: snakeY };

    if(snakeX < 0 || snakeX > canvas.width - box || 
       snakeY < 0 || snakeY > canvas.height - box || 
       collision(newHead, snake)) {
        gameOver();
        return;
    }

    // 8. Přidání nové hlavy
    snake.unshift(newHead);
}

function collision(head, array) {
    for(let i = 0; i < array.length; i++) {
        if(head.x == array[i].x && head.y == array[i].y) return true;
    }
    return false;
}

function gameOver() {
    clearInterval(gameLoop);
    isGameRunning = false;
    d = null;
    
    // Obrazovka prohry
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0,0,canvas.width, canvas.height);
    
    ctx.fillStyle = "#ef4444";
    ctx.font = "30px Cinzel"; 
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width/2, canvas.height/2);
    
    // Zobrazení tlačítka Start po chvíli
    setTimeout(() => { 
        const overlay = document.getElementById('snakeOverlay');
        if(overlay) overlay.style.setProperty('display', 'flex', 'important'); 
    }, 2000);
}

// --- LOGIKA PIŠKVOREK ---
let tttBoard = ['', '', '', '', '', '', '', '', ''];
let tttGameActive = true;

function initTicTac() {
    const tttGrid = document.getElementById('tictacGrid');
    const tttStatus = document.getElementById('tictacStatus');
    if (!tttGrid) return;

    tttBoard = ['', '', '', '', '', '', '', '', ''];
    tttGameActive = true;
    tttGrid.innerHTML = '';
    tttStatus.innerText = "Jsi na tahu (X)";
    
    for(let i=0; i<9; i++) {
        let cell = document.createElement('div');
        cell.classList.add('ttt-cell');
        cell.setAttribute('data-index', i);
        cell.addEventListener('click', handleCellClick);
        tttGrid.appendChild(cell);
    }
}

function handleCellClick(e) {
    const clickedCell = e.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));
    if(tttBoard[clickedCellIndex] !== '' || !tttGameActive) return;
    
    handlePlayerMove(clickedCell, clickedCellIndex, 'X');
    checkResult();
    
    if(tttGameActive) setTimeout(cpuMove, 400);
}

function cpuMove() {
    let bestMoveIndex = -1;
    // 1. Zkusit vyhrát
    bestMoveIndex = findWinningMove('O');
    // 2. Blokovat hráče
    if (bestMoveIndex === -1) bestMoveIndex = findWinningMove('X');
    // 3. Střed
    if (bestMoveIndex === -1 && tttBoard[4] === '') bestMoveIndex = 4;
    // 4. Náhoda
    if (bestMoveIndex === -1) {
        let emptyIndices = tttBoard.map((e, i) => e === '' ? i : null).filter(e => e !== null);
        if(emptyIndices.length > 0) bestMoveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    if (bestMoveIndex !== -1) {
        let cpuCell = document.querySelector(`.ttt-cell[data-index='${bestMoveIndex}']`);
        handlePlayerMove(cpuCell, bestMoveIndex, 'O');
        checkResult();
    }
}

function findWinningMove(player) {
    const winConditions = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    for (let condition of winConditions) {
        let [a, b, c] = condition;
        let vals = [tttBoard[a], tttBoard[b], tttBoard[c]];
        if (vals.filter(v => v === player).length === 2 && vals.includes('')) {
            if (tttBoard[a] === '') return a;
            if (tttBoard[b] === '') return b;
            if (tttBoard[c] === '') return c;
        }
    }
    return -1;
}

function handlePlayerMove(cell, index, player) {
    tttBoard[index] = player;
    cell.innerText = player === 'X' ? '†' : '☠'; 
    cell.classList.add(player.toLowerCase());
}

function checkResult() {
    const tttStatus = document.getElementById('tictacStatus');
    const winConditions = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    let roundWon = false;
    
    for (let i = 0; i <= 7; i++) {
        const winCondition = winConditions[i];
        let a = tttBoard[winCondition[0]];
        let b = tttBoard[winCondition[1]];
        let c = tttBoard[winCondition[2]];
        if (a === '' || b === '' || c === '') continue;
        if (a === b && b === c) { roundWon = true; break; }
    }
    
    if (roundWon) { 
        tttStatus.innerText = tttGameActive ? "Vítězství!" : "Prohra!"; 
        tttGameActive = false; 
        return; 
    }
    
    if (!tttBoard.includes("")) { 
        tttStatus.innerText = "Remíza!"; 
        tttGameActive = false; 
        return; 
    }
}

// --- DOOM LOGIKA (LAZY LOADING) ---
let dosboxInstance = null;

function triggerDoom(event) {
    event.preventDefault(); // Zruší menu pravého tlačítka
    
    const container = document.getElementById('doom-container');
    const loading = document.getElementById('doom-loading');
    
    // 1. Zobrazit herní okno a načítání
    if(container) container.style.setProperty('display', 'flex', 'important');
    if(loading) loading.style.display = 'block';

    // Pomocná funkce pro samotný start (aby se nepsala 2x)
    const runDosBox = () => {
        if(!dosboxInstance && window.Dosbox) {
            dosboxInstance = new Dosbox({
                id: "dosbox",
                onload: function (dosbox) {
                    dosbox.run("https://js-dos.com/cdn/doom.zip", "./DOOM"); 
                },
                onrun: function (dosbox, app) {
                    console.log("Doom běží!");
                    if(loading) loading.style.display = 'none';
                }
            });
        } else if (dosboxInstance) {
            // Pokud už běží, jen schováme loading
            if(loading) loading.style.display = 'none';
        }
    };

    // 2. MAGIE: Je knihovna načtená?
    if (window.Dosbox) {
        // A) Ano, knihovna už tam je -> Spustit hru
        runDosBox();
    } else {
        // B) Ne, knihovna chybí -> Stáhnout ji teď hned!
        console.log("Stahuji DOOM engine...");
        const script = document.createElement('script');
        script.src = "https://js-dos.com/cdn/js-dos-api.js";
        
        script.onload = () => {
            console.log("Engine stažen via Lazy Load.");
            runDosBox(); // Jakmile se dotáhne, spustit hru
        };
        
        document.body.appendChild(script);
    }
}

// Inicializace po načtení stránky
document.addEventListener('DOMContentLoaded', () => {
    initGameVars();
    // Pokud je stránka načtena a vidíme hada, resetujeme ho
    const snakeEl = document.getElementById('game-snake');
    if(snakeEl && getComputedStyle(snakeEl).display !== 'none') {
        resetSnakeUI();
    }
});