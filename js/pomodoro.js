let timerInterval = null;
let timeLeft = 25 * 60; 
let currentMode = 'work'; 
let isRunning = false;

const MODES = {
    work: 25,
    short: 5,
    long: 15
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playAlarm() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); 
    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5); 
    
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
}

function toggleTimer() {
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        document.getElementById("startStopBtn").innerText = "▶ Start";
        document.querySelector(".pomodoro-circle").classList.remove("active-work", "active-rest");
        
        // Když pauzneme, necháme čas v titulku (aby uživatel viděl, kde skončil), 
        // nebo ho můžeme smazat. Necháme ho, dokud nedá Reset.
    } else {
        isRunning = true;
        document.getElementById("startStopBtn").innerText = "⏸ Pauza";
        
        const circle = document.querySelector(".pomodoro-circle");
        if (currentMode === 'work' || currentMode === 'custom') circle.classList.add("active-work");
        else circle.classList.add("active-rest");

        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                clearInterval(timerInterval);
                isRunning = false;
                document.getElementById("startStopBtn").innerText = "▶ Start";
                document.querySelector(".pomodoro-circle").classList.remove("active-work", "active-rest");
                document.title = "DarkDash"; // Vyčistit titulek po dokončení
                playAlarm();
                alert("Čas vypršel!");
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    
    // Pokud je custom, vrátíme tam custom hodnotu, jinak podle módu
    if (currentMode === 'custom') {
        const customVal = document.getElementById("customTimeInput").value;
        timeLeft = (customVal && customVal > 0) ? customVal * 60 : 25 * 60;
    } else {
        timeLeft = MODES[currentMode] * 60;
    }

    updateDisplay(false); // false = neaktualizovat titulek prohlížeče
    document.title = "DarkDash"; // Natvrdo vyčistit titulek

    document.getElementById("startStopBtn").innerText = "▶ Start";
    document.querySelector(".pomodoro-circle").classList.remove("active-work", "active-rest");
}

function setMode(mode) {
    currentMode = mode;
    
    document.querySelectorAll('#pomodoroModal .btn-group button').forEach(btn => btn.classList.remove('active'));
    
    if(mode === 'work') document.getElementById('btnWork').classList.add('active');
    else if(mode === 'short') document.getElementById('btnShort').classList.add('active');
    else if(mode === 'long') document.getElementById('btnLong').classList.add('active');
    
    // Custom mód nemá tlačítko v grupě, takže pokud je custom, všechna tlačítka jsou neaktivní

    const statusText = document.getElementById("timerStatus");
    if(mode === 'work') statusText.innerText = "Práce";
    else if(mode === 'custom') statusText.innerText = "Vlastní";
    else statusText.innerText = "Odpočinek";

    // Vyčistíme custom input pokud přepínáme na preset
    if (mode !== 'custom') {
        document.getElementById("customTimeInput").value = "";
    }

    resetTimer();
}

// NOVÉ: Funkce pro vlastní čas
function setCustomTime() {
    const input = document.getElementById("customTimeInput");
    const minutes = parseInt(input.value);

    if (minutes > 0) {
        // Odznačíme ostatní tlačítka
        document.querySelectorAll('#pomodoroModal .btn-group button').forEach(btn => btn.classList.remove('active'));
        
        currentMode = 'custom';
        document.getElementById("timerStatus").innerText = "Vlastní";
        timeLeft = minutes * 60;
        
        // Resetujeme stav (zastavíme pokud běží)
        clearInterval(timerInterval);
        isRunning = false;
        document.getElementById("startStopBtn").innerText = "▶ Start";
        document.querySelector(".pomodoro-circle").classList.remove("active-work", "active-rest");
        
        updateDisplay(false); // Aktualizujeme display, ale ne titulek (zatím neběží)
        document.title = "DarkDash";
    }
}

function updateDisplay(updateTitle = true) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    const displayString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById("timerDisplay").innerText = displayString;
    
    // Titulek aktualizujeme jen když běží (nebo když chceme explicitně)
    if (isRunning && updateTitle) {
        document.title = `(${displayString}) DarkDash`;
    }
}

// Inicializace
updateDisplay(false); // Na začátku neukazovat čas v liště