// --- KONFIGURACE TÉMAT (Playlisty MP3) ---
const themes = [
    {
        id: 'gothic',
        name: 'Gothic Castle',
        author: 'Temné hvozdy',
        bg: 'linear-gradient(135deg, #1a0b2e 0%, #000000 100%)',
        glow: '#9d4edd',
        fontHead: "'Cinzel', serif",
        playlist: [
            { file: 'Blod Besvimelse - Misanthrop (Remastered).mp3', title: 'Misanthrop', author: 'Blod Besvimelse' },
            { file: 'Pure pagan hatred.mp3', title: 'Pure Pagan Hatred', author: 'Pestilence of Philosophy' },
            { file: 'kratze.mp3', title: 'Krätze (Piano Cover)', author: 'Grausamkeit' }
        ]
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk City',
        author: 'Night City',
        bg: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        glow: '#00ff9d',
        fontHead: "'Rajdhani', sans-serif",
        playlist: [
            { file: 'stayathouse.mp3', title: 'I Really Want to Stay at Your House', author: 'Rosa Walton' },
            { file: 'Pon Pon Shit.mp3', title: 'Pon Pon Shit (Cover)', author: 'Cateek' },
            { file: 'The Rebel Path (Cyberpunk 2077 Soundtrack).mp3', title: 'The Rebel Path', author: 'P.T. Adamczyk' }
        ]
    },
    {
        id: 'nature',
        name: 'Deep Forest',
        author: 'Matka Příroda',
        bg: 'linear-gradient(to bottom, #134e5e, #71b280)',
        glow: '#4ade80',
        fontHead: "'Cormorant Garamond', serif",
        playlist: [
            { file: 'Echoing Woods [MChf-0jdk7I].mp3', title: 'Echoing Woods', author: 'Derek Fiechter' },
            { file: 'The Singing Woods [26vbyf_AFsc].mp3', title: 'The Singing Woods', author: 'Derek Fiechter' },
            { file: 'Beautiful Fantasy Music - Tree of Wonder [fQq6rZeTo-M].mp3', title: 'Tree of Wonder', author: 'Derek Fiechter' }
        ]
    },
    {
        id: 'skyrim',
        name: 'Skyrim',
        author: 'Dovahkiin',
        bg: 'linear-gradient(to bottom, #2c3e50, #bdc3c7)',
        glow: '#fbbf24',
        fontHead: "'MedievalSharp', cursive",
        playlist: [
            { file: 'TES V Skyrim Soundtrack - Far Horizons.mp3', title: 'Far Horizons', author: 'Jeremy Soule' },
            { file: 'TES V Skyrim Soundtrack - From Past to Present.mp3', title: 'From Past to Present', author: 'Jeremy Soule' },
            { file: 'Secunda.mp3', title: 'Secunda', author: 'Jeremy Soule' }
        ]
    },
    {
        id: 'darkfantasy',
        name: 'Dark Fantasy',
        author: 'Abyss',
        bg: 'linear-gradient(160deg, #4b0000 0%, #000000 70%)',
        glow: '#ef4444',
        fontHead: "'Cinzel', serif",
        playlist: [
            { file: 'STXSTN - LITSAR PEKLA (feat. snxff).mp3', title: 'Litsár Pekla', author: 'STXSTN' },
            { file: "Dorian Concept - 'Hide (CS01 Version)' (Official Video).mp3", title: 'Hide', author: 'Dorian Concept' },
            { file: 'Dorian Concept - Space II (Official Video).mp3', title: 'Space II', author: 'Dorian Concept' }
        ]
    },
    {
        id: 'pirate',
        name: 'Pirate Ship',
        author: 'Sedm moří',
        bg: 'linear-gradient(to top, #0f2027, #203a43, #2c5364)',
        glow: '#f97316',
        fontHead: "'Pirata One', cursive",
        playlist: [
            { file: 'You and Me and the Devil Makes Three.mp3', title: 'You, Me & The Devil', author: 'Ye Banished Privateers' },
            { file: 'L Harmonica.mp3', title: "L'Harmonica", author: 'Les Naufragés' },
            { file: "A Drop of Nelson's Blood (2012).mp3", title: "A Drop of Nelson's Blood", author: 'Storm Weather Shanty Choir' }
        ]
    },
    {
        id: 'witcher',
        name: 'The Witcher',
        author: 'Geralt z Rivie',
        bg: 'linear-gradient(to bottom right, #2b2b2b, #4a4a4a, #1a1a1a)',
        glow: '#cd202c',
        fontHead: "'Cinzel Decorative', cursive",
        playlist: [
            { file: 'The Trail.mp3', title: 'The Trail', author: 'Marcin Przybyłowicz' },
            { file: 'silverformonsters.mp3', title: 'Silver For Monsters', author: 'Percival Schuttenbach' },
            { file: '_SteelForHumans.mp3', title: 'Steel For Humans', author: 'Percival Schuttenbach' }
        ]
    },
    {
        id: 'lotr',
        name: 'Middle Earth',
        author: 'Společenstvo',
        bg: 'linear-gradient(to bottom, #2b1d0e, #785a2d)',
        glow: '#ffd700',
        fontHead: "'Uncial Antiqua', cursive",
        playlist: [
            { file: 'Samwise the Brave.mp3', title: 'Samwise the Brave', author: 'Howard Shore' },
            { file: 'The Shire.mp3', title: 'The Shire', author: 'Howard Shore' },
            { file: 'Song of Durin (Complete Edition) - Clamavi De Profundis.mp3', title: 'Song of Durin', author: 'Clamavi De Profundis' }
        ]
    },
    {
        id: 'metro',
        name: 'Metro 2033',
        author: 'Arťom',
        bg: 'linear-gradient(160deg, #1c1c1c, #3E2723)',
        glow: '#ff6d00',
        fontHead: "'Share Tech Mono', monospace",
        playlist: [
            { file: 'Metro Exodus - In The House In A Heartbeat.mp3', title: 'In The House In A Heartbeat', author: 'John Murphy' },
            { file: 'Race Against Fate.mp3', title: 'Race Against Fate', author: 'Alexey Omelchuk' },
            { file: 'premonition.mp3', title: 'Premonition', author: 'Alexey Omelchuk' }
        ]
    },
    {
        id: 'fireplace',
        name: 'Cozy Fireplace',
        author: 'Odpočinek',
        bg: 'linear-gradient(to right, #451e11, #873e23)',
        glow: '#ea580c',
        fontHead: "'Playfair Display', serif",
        playlist: [
            { file: 'Scarborough fair.mp3', title: 'Scarborough Fair', author: 'Simon & Garfunkel' },
            { file: 'Embers Tale.mp3', title: 'Embers Tale', author: 'Fl. Ochre' },
            { file: 'Campfire.mp3', title: 'Campfire', author: 'Stephen Barton' }
        ]
    },
    {
        id: 'starwars',
        name: 'Star Wars',
        author: 'Galactic Empire',
        bg: 'radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)',
        glow: '#3b82f6',
        fontHead: "'Rajdhani', sans-serif",
        playlist: [
            { file: 'Eerin Siinaa.mp3', title: 'Eerin Siinaa', author: 'Stephen Barton' },
            { file: 'clonemarch.mp3', title: 'Clone Army March', author: 'Kevin Kiner' },
            { file: 'Duel of the Fates.mp3', title: 'Duel of the Fates', author: 'John Williams' }
        ]
    },
    {
        id: 'celtic',
        name: 'Celtic Highlands',
        author: 'Horalé',
        bg: 'linear-gradient(to bottom, #11998e, #38ef7d)',
        glow: '#22c55e',
        fontHead: "'IM Fell English SC', serif",
        playlist: [
            { file: 'The Rumjacks - An Irish Pub Song (Official Music Video).mp3', title: 'An Irish Pub Song', author: 'The Rumjacks' },
            { file: 'The High Kings, Rocky Road to Dublin.mp3', title: 'Rocky Road to Dublin', author: 'The High Kings' },
            { file: 'Star of the County Down.mp3', title: 'Star of the County Down', author: 'The Irish Rovers' }
        ]
    }
];

let audioPlayer = new Audio();
let isPlaying = false;
let currentTheme = themes[0];
let currentTrackIndex = 0;
let lastVolume = 0.5; // Pamatujeme si poslední hlasitost

// --- INIT TÉMAT ---
function initThemes() {
    const container = document.getElementById("themeContainer");
    
    themes.forEach(theme => {
        const div = document.createElement("div");
        div.className = "col-md-4 col-sm-6";
        div.innerHTML = `
            <div class="card bg-dark border-secondary text-center h-100 theme-card" style="cursor: pointer;" onclick="setTheme('${theme.id}')">
                <div class="card-body">
                    <div style="height: 60px; background: ${theme.bg}; border-radius: 4px; margin-bottom: 10px; border: 1px solid #555;"></div>
                    <h6 class="text-light m-0">${theme.name}</h6>
                </div>
            </div>
        `;
        if(container) container.appendChild(div);
    });

    const savedId = localStorage.getItem("darkdash-theme-id");
    if(savedId) setTheme(savedId);
    
    // Auto-play další skladby
    audioPlayer.addEventListener('ended', nextTrack);
    
    // Inicializace hlasitosti (default 50%)
    setVolume(0.5);
}

// --- ZMĚNA TÉMATU ---
function setTheme(id) {
    const theme = themes.find(t => t.id === id);
    if(!theme) return;

    if (currentTheme.id !== theme.id) {
        currentTrackIndex = 0;
    }

    currentTheme = theme;
    localStorage.setItem("darkdash-theme-id", id);

    // Změna vizuálu
    document.body.style.background = theme.bg;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";
    document.documentElement.style.setProperty('--primary-glow', theme.glow);
    document.documentElement.style.setProperty('--font-head', theme.fontHead);

    loadTrack(currentTrackIndex);
}

// --- PŘEHRÁVÁNÍ SKLADBY ---
function loadTrack(index) {
    if (index >= currentTheme.playlist.length) index = 0;
    if (index < 0) index = currentTheme.playlist.length - 1;
    
    currentTrackIndex = index;
    const track = currentTheme.playlist[index];
    
    const titleEl = document.getElementById("musicTrack");
    const authorEl = document.getElementById("musicAuthor");
    if(titleEl) titleEl.innerText = track.title;
    if(authorEl) authorEl.innerText = track.author;
    
    audioPlayer.src = `assets/audio/${track.file}`;
    
    if(isPlaying) {
        audioPlayer.play().catch(e => console.log("Autoplay blocked:", e));
        startIconAnimation();
    } else {
        stopIconAnimation();
    }
}

// --- OVLÁDÁNÍ ---
function toggleMusic() {
    const playIcon = document.getElementById("btnPlayIcon");
    if(audioPlayer.paused) {
        audioPlayer.play().then(() => {
            isPlaying = true;
            startIconAnimation();
            if(playIcon) playIcon.src = "assets/icons/pause.png"; 
        }).catch(err => {
            console.error("Chyba přehrávání:", err);
            // Lepší diagnostika chyby pro uživatele
            alert(`CHYBA: Nemohu najít soubor "${decodeURIComponent(audioPlayer.src.split('/').pop())}" ve složce assets/audio/. Zkontroluj název!`);
        });
    } else {
        audioPlayer.pause();
        isPlaying = false;
        startIconAnimation(); 
        stopIconAnimation();
        if(playIcon) playIcon.src = "assets/icons/play.png";
    }
}

function nextTrack() {
    currentTrackIndex++;
    if (currentTrackIndex >= currentTheme.playlist.length) currentTrackIndex = 0;
    loadTrack(currentTrackIndex);
    if (isPlaying) { audioPlayer.play(); startIconAnimation(); }
}

function prevTrack() {
    currentTrackIndex--;
    if (currentTrackIndex < 0) currentTrackIndex = currentTheme.playlist.length - 1;
    loadTrack(currentTrackIndex);
    if (isPlaying) { audioPlayer.play(); startIconAnimation(); }
}

// ✅ OPRAVENO: Funkce restartTrack
function restartTrack() {
    audioPlayer.currentTime = 0;
    const playIcon = document.getElementById("btnPlayIcon");
    if (!isPlaying) {
        audioPlayer.play();
        isPlaying = true;
        startIconAnimation();
        if(playIcon) playIcon.src = "assets/icons/pause.png";
    }
}

// --- NOVÁ LOGIKA HLASITOSTI ---

// Funkce pro nastavení hlasitosti (volá se ze slideru)
function setVolume(val) {
    const volume = parseFloat(val);
    audioPlayer.volume = volume;
    
    // Pokud měníme hlasitost sliderem, uložíme ji jako "poslední známou"
    if (volume > 0) {
        lastVolume = volume;
        audioPlayer.muted = false;
    }

    // Aktualizace slideru, pokud existuje (synchronizace)
    const slider = document.getElementById("volumeSlider");
    if (slider && Math.abs(slider.value - volume) > 0.01) {
        slider.value = volume;
    }

    // Aktualizace ikony podle hlasitosti (volitelné)
    updateMuteIcon(volume === 0);
}

// Funkce pro Mute tlačítko
function toggleMute() {
    const slider = document.getElementById("volumeSlider");
    
    if (audioPlayer.volume > 0) {
        // ZTLUMIT
        lastVolume = audioPlayer.volume;
        audioPlayer.volume = 0;
        audioPlayer.muted = true;
        if(slider) slider.value = 0;
        updateMuteIcon(true);
    } else {
        // ODTLUMIT (vrátit na poslední hlasitost)
        audioPlayer.volume = lastVolume || 0.5; // fallback na 50%
        audioPlayer.muted = false;
        if(slider) slider.value = lastVolume || 0.5;
        updateMuteIcon(false);
    }
}

function updateMuteIcon(isMuted) {
    const muteIcon = document.getElementById("btnMuteIcon"); // Předpokládá <img> uvnitř tlačítka
    if (muteIcon) {
        // Zde si můžeš nastavit cesty ke svým ikonám
        muteIcon.src = isMuted ? "assets/icons/mute.png" : "assets/icons/volume.png";
        // Pokud nemáš ikony, můžeme měnit třeba průhlednost:
        muteIcon.style.opacity = isMuted ? "0.5" : "1";
    }
}

// --- ANIMACE IKONY ---
function startIconAnimation() {
    const icon = document.getElementById("musicIcon");
    if(icon) {
        icon.classList.add("icon-pulse"); 
    }
}

function stopIconAnimation() {
    const icon = document.getElementById("musicIcon");
    if(icon) {
        icon.classList.remove("icon-pulse");
    }
}

// Inicializace po načtení stránky
document.addEventListener("DOMContentLoaded", () => {
    initThemes();
    
    // Najdeme slider v HTML a nastavíme mu výchozí hodnotu
    const slider = document.getElementById("volumeSlider");
    if(slider) {
        slider.value = audioPlayer.volume;
        slider.addEventListener("input", (e) => setVolume(e.target.value));
    }
    
    // Najdeme mute tlačítko
    const muteBtn = document.getElementById("btnMute");
    if(muteBtn) {
        muteBtn.addEventListener("click", toggleMute);
    }
});