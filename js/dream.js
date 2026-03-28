let dreams = [];
let dreamFolders = ["Obecné", "Noční můry", "Lucidní sny", "Nápady"]; 
let currentDreamFolder = "Obecné";
let editingDreamIndex = -1;

function loadDreams() {
    const dKey = window.getAppKey ? window.getAppKey("darkdash-dreams") : "darkdash-dreams";
    const storedD = localStorage.getItem(dKey);
    if (storedD) {
        dreams = JSON.parse(storedD);
        // Zpětná kompatibilita: Záchrana starých snů do složky "Obecné"
        dreams = dreams.map(d => d.folder ? d : { ...d, folder: "Obecné" });
    }

    const fKey = window.getAppKey ? window.getAppKey("darkdash-dream-folders") : "darkdash-dream-folders";
    const storedF = localStorage.getItem(fKey);
    if (storedF) {
        dreamFolders = JSON.parse(storedF);
    }
    if (!dreamFolders.includes("Obecné")) dreamFolders.unshift("Obecné");

    renderDreamUI();
}

function saveDreamsToStorage() {
    const dKey = window.getAppKey ? window.getAppKey("darkdash-dreams") : "darkdash-dreams";
    localStorage.setItem(dKey, JSON.stringify(dreams));
    if(window.saveToCloud) window.saveToCloud("dreams", dreams); 

    const fKey = window.getAppKey ? window.getAppKey("darkdash-dream-folders") : "darkdash-dream-folders";
    localStorage.setItem(fKey, JSON.stringify(dreamFolders));
    if(window.saveToCloud) window.saveToCloud("dream-folders", dreamFolders); 

    renderDreamUI();
}

function renderDreamUI() {
    renderDreamFoldersSidebar();
    renderDreamGrid();
    updateDreamFolderSelectInEditor();
}

// VYKRESLENÍ LEVÉHO MENU
function renderDreamFoldersSidebar() {
    const list = document.getElementById("dreamFolderTreeList");
    if (!list) return;
    list.innerHTML = "";

    dreamFolders.forEach(folderName => {
        const a = document.createElement("a");
        a.href = "#";
        a.className = `list-group-item list-group-item-action bg-transparent text-light border-0 py-2 px-3 ${folderName === currentDreamFolder ? 'fw-bold text-info' : ''}`;
        
        if (folderName === currentDreamFolder) {
            a.style.backgroundColor = "rgba(13, 202, 240, 0.1)"; 
            a.style.borderLeft = "3px solid #0dcaf0";
        } else {
            a.style.borderLeft = "3px solid transparent";
            a.style.opacity = "0.7";
        }

        a.innerHTML = `<i class="bi bi-moon me-2"></i>${folderName}`;
        a.onclick = (e) => {
            e.preventDefault();
            currentDreamFolder = folderName;
            renderDreamUI();
        };
        list.appendChild(a);
    });
}

// VYKRESLENÍ PRAVÉ MŘÍŽKY
function renderDreamGrid() {
    const list = document.getElementById("dreamList");
    const title = document.getElementById("currentDreamFolderTitle");
    if(!list || !title) return;
    
    title.innerText = currentDreamFolder;
    list.innerHTML = "";

    const filteredDreams = dreams.map((d, idx) => ({...d, originalIndex: idx}))
                                 .filter(d => (d.folder || "Obecné") === currentDreamFolder);

    if (filteredDreams.length === 0) {
        list.innerHTML = `<div class="col-12 text-muted text-center mt-5"><em>V této kategorii nejsou žádné sny.</em></div>`;
        return;
    }

    filteredDreams.forEach((dream) => {
        const col = document.createElement("div");
        col.className = "col-md-6 col-lg-6"; 

        const dateObj = new Date(dream.date);
        const dateStr = dateObj.toLocaleDateString('cs-CZ');
        const tagsHtml = dream.tags.map(tag => `<span class="badge bg-secondary me-1 mb-1">#${tag}</span>`).join('');
        
        // Markdown podpora pro text snu
        const renderedHTML = typeof marked !== 'undefined' ? marked.parse(dream.description) : dream.description;

        col.innerHTML = `
            <div class="card bg-dark text-light border-secondary h-100 shadow position-relative" style="background: linear-gradient(145deg, #0d1b2a, #000);">
                <div class="card-header border-bottom border-secondary d-flex justify-content-between align-items-center p-2">
                    <span class="text-info small fw-bold">${dateStr}</span>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-warning border-0 p-1" onclick="openDreamEditor(${dream.originalIndex})" title="Upravit">✏️</button>
                        <button class="btn btn-sm btn-outline-danger border-0 p-1" onclick="deleteDream(${dream.originalIndex})" title="Smazat">🗑️</button>
                    </div>
                </div>
                <div class="card-body overflow-auto p-3" style="max-height: 250px;">
                    <div class="markdown-content text-break" style="font-size: 0.9rem;">${renderedHTML}</div>
                </div>
                ${tagsHtml ? `<div class="card-footer border-top border-secondary p-2">${tagsHtml}</div>` : ''}
            </div>
        `;
        list.appendChild(col);
    });
}

function createNewDreamFolder() {
    const folderName = prompt("Zadej název nové složky snů (např. 'Z lucidních nocí'):");
    if (folderName && folderName.trim() !== "") {
        const cleanName = folderName.trim();
        if (!dreamFolders.includes(cleanName)) {
            dreamFolders.push(cleanName);
            currentDreamFolder = cleanName; 
            saveDreamsToStorage();
        } else {
            alert("Tato složka už existuje!");
        }
    }
}

function updateDreamFolderSelectInEditor() {
    const select = document.getElementById("dreamFolderSelect");
    if (!select) return;
    select.innerHTML = "";
    dreamFolders.forEach(folder => {
        const option = document.createElement("option");
        option.value = folder;
        option.innerText = folder;
        select.appendChild(option);
    });
}

function openDreamEditor(index = -1) {
    editingDreamIndex = index;
    const dateInput = document.getElementById("dreamDate");
    const descInput = document.getElementById("dreamDescription");
    const tagsInput = document.getElementById("dreamTags");
    const folderSelect = document.getElementById("dreamFolderSelect");
    const title = document.getElementById("dreamEditorTitle");

    if (index === -1) {
        title.innerText = "Nový sen";
        dateInput.valueAsDate = new Date();
        descInput.value = "";
        tagsInput.value = "";
        if(folderSelect) folderSelect.value = currentDreamFolder;
    } else {
        const d = dreams[index];
        title.innerText = "Upravit sen";
        dateInput.value = d.date;
        descInput.value = d.description;
        tagsInput.value = d.tags.join(", ");
        if(folderSelect) folderSelect.value = d.folder || "Obecné";
    }

    const modal = new bootstrap.Modal(document.getElementById('dreamEditorModal'));
    modal.show();
}

function saveDream() {
    const date = document.getElementById("dreamDate").value;
    const description = document.getElementById("dreamDescription").value.trim();
    const tagsString = document.getElementById("dreamTags").value.trim();
    const folderSelect = document.getElementById("dreamFolderSelect");
    const folder = folderSelect ? folderSelect.value : "Obecné";

    if (!description) {
        alert("Popis snu nemůže být prázdný!");
        return;
    }

    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(t => t) : [];
    const dreamObj = { date, description, tags, folder };

    if (editingDreamIndex === -1) {
        dreams.unshift(dreamObj);
    } else {
        dreams[editingDreamIndex] = dreamObj;
    }

    currentDreamFolder = folder;
    saveDreamsToStorage();

    const modalEl = document.getElementById('dreamEditorModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    modalInstance.hide();
}

function deleteDream(index) {
    if(confirm("Opravdu chceš tento sen vymazat ze své paměti?")) {
        dreams.splice(index, 1);
        saveDreamsToStorage();
    }
}

document.addEventListener("DOMContentLoaded", loadDreams);
document.addEventListener("darkdash-reload", loadDreams);

// Funkce pro přepínání záložek v panelu Snů/Watchlistu
function switchDreamTab(tab) {
    const secDreams = document.getElementById('sectionDreams');
    const secWatchlist = document.getElementById('sectionWatchlist');
    const btnDreams = document.getElementById('btnTabDreams');
    const btnWatchlist = document.getElementById('btnTabWatchlist');

    if (tab === 'dreams') {
        // Ukaž sny, schovej watchlist
        secDreams.classList.remove('d-none');
        secDreams.classList.add('d-flex');
        secWatchlist.classList.remove('d-flex');
        secWatchlist.classList.add('d-none');
        
        // Zvýrazni tlačítko snů
        btnDreams.classList.replace('btn-outline-info', 'btn-info');
        btnWatchlist.classList.replace('btn-info', 'btn-outline-info');
    } else if (tab === 'watchlist') {
        // Ukaž watchlist, schovej sny
        secWatchlist.classList.remove('d-none');
        secWatchlist.classList.add('d-flex');
        secDreams.classList.remove('d-flex');
        secDreams.classList.add('d-none');

        // Zvýrazni tlačítko watchlistu
        btnWatchlist.classList.replace('btn-outline-info', 'btn-info');
        btnDreams.classList.replace('btn-info', 'btn-outline-info');
    }
}
// ============================================================
//  WATCHLIST — kompletní modul
// ============================================================

let watchlistItems   = [];   // Všechny položky
let watchlistFolders = ['Filmy', 'Seriály', 'Anime', 'Dokumenty'];
let currentWatchlistFolder = 'Filmy';
let editingWatchlistIndex  = -1;

// ── Klíče pro storage ────────────────────────────────────────
function wlKey(base) {
    return window.getAppKey ? window.getAppKey(base) : base;
}

// ── Načtení dat ──────────────────────────────────────────────
function loadWatchlist() {
    const items   = localStorage.getItem(wlKey('darkdash-watchlist'));
    const folders = localStorage.getItem(wlKey('darkdash-watchlist-folders'));
    watchlistItems   = items   ? JSON.parse(items)   : [];
    watchlistFolders = folders ? JSON.parse(folders) : ['Filmy', 'Seriály', 'Anime', 'Dokumenty'];
    if (!watchlistFolders.length) watchlistFolders = ['Filmy'];
    currentWatchlistFolder = watchlistFolders[0];
    renderWatchlistUI();
}

// ── Uložení dat ──────────────────────────────────────────────
function saveWatchlist() {
    localStorage.setItem(wlKey('darkdash-watchlist'),         JSON.stringify(watchlistItems));
    localStorage.setItem(wlKey('darkdash-watchlist-folders'), JSON.stringify(watchlistFolders));
    if (window.saveToCloud) window.saveToCloud('watchlist', watchlistItems);
    renderWatchlistUI();
}

// ── Vykreslit celé UI (sidebar + grid) ──────────────────────
function renderWatchlistUI() {
    renderWatchlistFolders();
    renderWatchlistGrid();
}

// ── Sidebar se složkami ──────────────────────────────────────
function renderWatchlistFolders() {
    const list = document.getElementById('watchlistFolderTreeList');
    if (!list) return;
    list.innerHTML = '';

    watchlistFolders.forEach(folder => {
        const count  = watchlistItems.filter(i => i.folder === folder).length;
        const active = folder === currentWatchlistFolder;
        const a      = document.createElement('a');
        a.href        = '#';
        a.className   = `list-group-item list-group-item-action bg-transparent border-0 d-flex justify-content-between align-items-center px-3 py-2 ${active ? 'text-info fw-bold' : 'text-light'}`;
        a.style.borderLeft = active ? '3px solid #0dcaf0' : '3px solid transparent';
        a.innerHTML = `
            <span class="text-truncate small">${folder}</span>
            <div class="d-flex align-items-center gap-1">
                <span class="badge bg-secondary rounded-pill">${count}</span>
                <button class="btn btn-link p-0 text-danger opacity-0 hover-show"
                        style="font-size:0.7rem; line-height:1;"
                        onclick="event.preventDefault(); event.stopPropagation(); deleteWatchlistFolder('${folder.replace(/'/g,"\\'")}')">✕</button>
            </div>`;
        a.addEventListener('mouseenter', () => a.querySelector('.hover-show').style.opacity = '1');
        a.addEventListener('mouseleave', () => a.querySelector('.hover-show').style.opacity = '0');
        a.addEventListener('click', e => {
            e.preventDefault();
            currentWatchlistFolder = folder;
            document.getElementById('currentWatchlistFolderTitle').textContent = folder;
            renderWatchlistUI();
        });
        list.appendChild(a);
    });
}

// ── Grid s kartičkami ────────────────────────────────────────
function renderWatchlistGrid() {
    const grid = document.getElementById('watchlistGrid');
    if (!grid) return;

    const items = watchlistItems.filter(i => i.folder === currentWatchlistFolder);
    grid.innerHTML = '';

    if (!items.length) {
        grid.innerHTML = `<div class="col-12 text-center text-muted py-5 fst-italic">
            Žádné položky v této kategorii.<br>
            <small>Klikni na "+ Přidat do Watchlistu"</small>
        </div>`;
        return;
    }

    const statusColors = {
        'Chci vidět': 'secondary',
        'Rozkoukáno': 'warning',
        'Dokoukáno':  'success'
    };
    const statusIcons = {
        'Chci vidět': '📋',
        'Rozkoukáno': '▶️',
        'Dokoukáno':  '✅'
    };

    items.forEach((item, localIdx) => {
        // Najdi globální index pro editaci/mazání
        const globalIdx = watchlistItems.indexOf(item);
        const color     = statusColors[item.status] || 'secondary';
        const icon      = statusIcons[item.status]  || '📋';

        const col = document.createElement('div');
        col.className = 'col-md-4 col-sm-6';
        
        // Zde je úprava: nadpis a štítek jsou pod sebou
        col.innerHTML = `
            <div class="card bg-dark border-secondary h-100 shadow-sm" style="border-left: 3px solid #0dcaf0 !important;">
                <div class="card-body p-3 d-flex flex-column gap-2">
                    <div class="mb-2">
                        <h6 class="text-info mb-1 fw-bold text-break" style="line-height: 1.3;">${item.title}</h6>
                        <span class="badge bg-${color}">${icon} ${item.status}</span>
                    </div>
                    ${item.notes ? `<p class="text-muted small m-0" style="font-size:0.8rem;">${item.notes}</p>` : ''}
                </div>
                <div class="card-footer bg-transparent border-top border-secondary d-flex gap-2 p-2">
                    <button class="btn btn-sm btn-outline-info flex-grow-1" onclick="editWatchlistItem(${globalIdx})">
                        ✎ Upravit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteWatchlistItem(${globalIdx})">
                        ✕
                    </button>
                </div>
            </div>`;
        grid.appendChild(col);
    });
}

// ── Nová složka ──────────────────────────────────────────────
window.createNewWatchlistFolder = function() {
    const name = prompt('Název nové kategorie:');
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    if (watchlistFolders.includes(trimmed)) {
        alert('Tato kategorie už existuje.');
        return;
    }
    watchlistFolders.push(trimmed);
    currentWatchlistFolder = trimmed;
    document.getElementById('currentWatchlistFolderTitle').textContent = trimmed;
    saveWatchlist();
};

// ── Smazat složku ────────────────────────────────────────────
window.deleteWatchlistFolder = function(folder) {
    if (watchlistFolders.length <= 1) { alert('Musí existovat alespoň jedna kategorie.'); return; }
    if (!confirm(`Smazat kategorii "${folder}" i s ${watchlistItems.filter(i=>i.folder===folder).length} položkami?`)) return;
    watchlistFolders      = watchlistFolders.filter(f => f !== folder);
    watchlistItems        = watchlistItems.filter(i => i.folder !== folder);
    currentWatchlistFolder = watchlistFolders[0];
    document.getElementById('currentWatchlistFolderTitle').textContent = currentWatchlistFolder;
    saveWatchlist();
};

// ── Otevřít editor (nová položka) ────────────────────────────
window.openWatchlistEditor = function() {
    editingWatchlistIndex = -1;
    document.getElementById('watchlistEditorTitle').textContent = 'Přidat do Watchlistu';
    document.getElementById('watchlistTitle').value  = '';
    document.getElementById('watchlistStatus').value = 'Chci vidět';
    document.getElementById('watchlistNotes').value  = '';
    updateWatchlistFolderSelect();
    const modal = new bootstrap.Modal(document.getElementById('watchlistEditorModal'));
    modal.show();
};

// ── Otevřít editor (editace existující) ──────────────────────
window.editWatchlistItem = function(index) {
    editingWatchlistIndex = index;
    const item = watchlistItems[index];
    document.getElementById('watchlistEditorTitle').textContent = 'Upravit položku';
    document.getElementById('watchlistTitle').value  = item.title  || '';
    document.getElementById('watchlistStatus').value = item.status || 'Chci vidět';
    document.getElementById('watchlistNotes').value  = item.notes  || '';
    updateWatchlistFolderSelect(item.folder);
    const modal = new bootstrap.Modal(document.getElementById('watchlistEditorModal'));
    modal.show();
};

// ── Synchronizovat select složky v editoru ───────────────────
function updateWatchlistFolderSelect(selectedFolder) {
    const sel = document.getElementById('watchlistFolderSelect');
    if (!sel) return;
    sel.innerHTML = watchlistFolders.map(f =>
        `<option value="${f}" ${f === (selectedFolder || currentWatchlistFolder) ? 'selected' : ''}>${f}</option>`
    ).join('');
}

// ── Uložit položku z editoru ─────────────────────────────────
window.saveWatchlistItem = function() {
    const title  = document.getElementById('watchlistTitle').value.trim();
    const status = document.getElementById('watchlistStatus').value;
    const notes  = document.getElementById('watchlistNotes').value.trim();
    const folder = document.getElementById('watchlistFolderSelect').value;

    if (!title) { alert('Zadej název položky!'); return; }

    const item = { title, folder, status, notes, id: Date.now() };

    if (editingWatchlistIndex === -1) {
        watchlistItems.unshift(item);
    } else {
        item.id = watchlistItems[editingWatchlistIndex].id; // zachovat původní id
        watchlistItems[editingWatchlistIndex] = item;
    }

    currentWatchlistFolder = folder;
    document.getElementById('currentWatchlistFolderTitle').textContent = folder;

    saveWatchlist();

    const modalEl = document.getElementById('watchlistEditorModal');
    bootstrap.Modal.getInstance(modalEl)?.hide();
};

// ── Smazat položku ───────────────────────────────────────────
window.deleteWatchlistItem = function(index) {
    if (!confirm('Odebrat tuto položku z Watchlistu?')) return;
    watchlistItems.splice(index, 1);
    saveWatchlist();
};

// ── Inicializace při přepnutí na záložku ─────────────────────
// Rozšíříme switchDreamTab aby loadoval watchlist při prvním otevření
const _origSwitchDreamTab = typeof switchDreamTab === 'function' ? switchDreamTab : null;
window.switchDreamTab = function(tab) {
    if (_origSwitchDreamTab) _origSwitchDreamTab(tab);
    if (tab === 'watchlist') {
        // Pokud ještě nebyla data načtena, načti je
        if (!watchlistItems.length && !localStorage.getItem(wlKey('darkdash-watchlist'))) {
            loadWatchlist();
        } else {
            renderWatchlistUI();
        }
    }
};

// Načíst při startu
document.addEventListener('DOMContentLoaded', loadWatchlist);
document.addEventListener('darkdash-reload',  loadWatchlist);

// ============================================================
//  GAMELIST — kompletní modul
// ============================================================

let gamelistItems   = [];
let gamelistFolders = ['RPG', 'Akční', 'Strategie', 'Indie', 'Ostatní'];
let currentGamelistFolder = 'RPG';
let editingGamelistIndex  = -1;

// ── Storage helpers ──────────────────────────────────────────
function glKey(base) {
    return window.getAppKey ? window.getAppKey(base) : base;
}

// ── Načtení dat ──────────────────────────────────────────────
function loadGamelist() {
    const items   = localStorage.getItem(glKey('darkdash-gamelist'));
    const folders = localStorage.getItem(glKey('darkdash-gamelist-folders'));
    gamelistItems   = items   ? JSON.parse(items)   : [];
    gamelistFolders = folders ? JSON.parse(folders) : ['RPG', 'Akční', 'Strategie', 'Indie', 'Ostatní'];
    if (!gamelistFolders.length) gamelistFolders = ['Ostatní'];
    currentGamelistFolder = gamelistFolders[0];
    renderGamelistUI();
}

// ── Uložení dat ──────────────────────────────────────────────
function saveGamelist() {
    localStorage.setItem(glKey('darkdash-gamelist'),         JSON.stringify(gamelistItems));
    localStorage.setItem(glKey('darkdash-gamelist-folders'), JSON.stringify(gamelistFolders));
    if (window.saveToCloud) window.saveToCloud('gamelist', gamelistItems);
    renderGamelistUI();
}

// ── Vykreslit celé UI ────────────────────────────────────────
function renderGamelistUI() {
    renderGamelistFolders();
    renderGamelistGrid();
}

// ── Sidebar složky ───────────────────────────────────────────
function renderGamelistFolders() {
    const list = document.getElementById('gamelistFolderTreeList');
    if (!list) return;
    list.innerHTML = '';

    gamelistFolders.forEach(folder => {
        const count  = gamelistItems.filter(i => i.folder === folder).length;
        const active = folder === currentGamelistFolder;
        const a      = document.createElement('a');
        a.href        = '#';
        a.className   = `list-group-item list-group-item-action bg-transparent border-0 d-flex justify-content-between align-items-center px-3 py-2 ${active ? 'text-info fw-bold' : 'text-light'}`;
        a.style.borderLeft = active ? '3px solid #0dcaf0' : '3px solid transparent';
        a.innerHTML = `
            <span class="text-truncate small">${folder}</span>
            <div class="d-flex align-items-center gap-1">
                <span class="badge bg-secondary rounded-pill">${count}</span>
                <button class="btn btn-link p-0 text-danger opacity-0 hover-show"
                        style="font-size:0.7rem;line-height:1;"
                        onclick="event.preventDefault();event.stopPropagation();deleteGamelistFolder('${folder.replace(/'/g,"\\'")}')">✕</button>
            </div>`;
        a.addEventListener('mouseenter', () => a.querySelector('.hover-show').style.opacity = '1');
        a.addEventListener('mouseleave', () => a.querySelector('.hover-show').style.opacity = '0');
        a.addEventListener('click', e => {
            e.preventDefault();
            currentGamelistFolder = folder;
            document.getElementById('currentGamelistFolderTitle').textContent = folder;
            renderGamelistUI();
        });
        list.appendChild(a);
    });
}

// ── Grid s kartičkami ────────────────────────────────────────
function renderGamelistGrid() {
    const grid = document.getElementById('gamelistGrid');
    if (!grid) return;

    const items = gamelistItems.filter(i => i.folder === currentGamelistFolder);
    grid.innerHTML = '';

    if (!items.length) {
        grid.innerHTML = `<div class="col-12 text-center text-muted py-5 fst-italic">
            Žádné hry v této kategorii.<br>
            <small>Klikni na "+ Přidat hru"</small>
        </div>`;
        return;
    }

    const statusConfig = {
        'Chci hrát':  { color: 'secondary', icon: '📋' },
        'Rozehráno':  { color: 'warning',   icon: '🎮' },
        'Dohráno':    { color: 'success',   icon: '🏆' },
        'Odloženo':   { color: 'danger',    icon: '⏸️'  },
    };

    items.forEach(item => {
        const globalIdx = gamelistItems.indexOf(item);
        const cfg       = statusConfig[item.status] || { color: 'secondary', icon: '🎮' };
        const ratingBadge = item.rating
            ? `<span class="badge bg-warning text-dark ms-1">★ ${item.rating}/10</span>`
            : '';

        const col = document.createElement('div');
        col.className = 'col-md-4 col-sm-6';
        
        // Zde je úprava: nadpis a štítek jsou pod sebou
        col.innerHTML = `
            <div class="card bg-dark border-secondary h-100 shadow-sm" style="border-left: 3px solid #0dcaf0 !important;">
                <div class="card-body p-3 d-flex flex-column gap-2">
                    <div class="mb-2">
                        <h6 class="text-info mb-1 fw-bold text-break" style="line-height: 1.3;">${item.title}</h6>
                        <span class="badge bg-${cfg.color}">${cfg.icon} ${item.status}</span>
                    </div>
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                        ${item.platform ? `<span class="badge bg-dark border border-secondary text-muted small">🖥️ ${item.platform}</span>` : ''}
                        ${ratingBadge}
                    </div>
                    ${item.notes ? `<p class="text-muted small m-0" style="font-size:0.8rem;">${item.notes}</p>` : ''}
                </div>
                <div class="card-footer bg-transparent border-top border-secondary d-flex gap-2 p-2">
                    <button class="btn btn-sm btn-outline-info flex-grow-1" onclick="editGamelistItem(${globalIdx})">
                        ✎ Upravit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteGamelistItem(${globalIdx})">
                        ✕
                    </button>
                </div>
            </div>`;
        grid.appendChild(col);
    });
}

// ── Nová složka ──────────────────────────────────────────────
window.createNewGamelistFolder = function() {
    const name = prompt('Název nové kategorie:');
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    if (gamelistFolders.includes(trimmed)) { alert('Tato kategorie už existuje.'); return; }
    gamelistFolders.push(trimmed);
    currentGamelistFolder = trimmed;
    document.getElementById('currentGamelistFolderTitle').textContent = trimmed;
    saveGamelist();
};

// ── Smazat složku ────────────────────────────────────────────
window.deleteGamelistFolder = function(folder) {
    if (gamelistFolders.length <= 1) { alert('Musí existovat alespoň jedna kategorie.'); return; }
    const count = gamelistItems.filter(i => i.folder === folder).length;
    if (!confirm(`Smazat kategorii "${folder}" i s ${count} hrami?`)) return;
    gamelistFolders      = gamelistFolders.filter(f => f !== folder);
    gamelistItems        = gamelistItems.filter(i => i.folder !== folder);
    currentGamelistFolder = gamelistFolders[0];
    document.getElementById('currentGamelistFolderTitle').textContent = currentGamelistFolder;
    saveGamelist();
};

// ── Otevřít editor (nová hra) ────────────────────────────────
window.openGamelistEditor = function() {
    editingGamelistIndex = -1;
    document.getElementById('gamelistEditorTitle').textContent = 'Přidat hru';
    document.getElementById('gamelistTitle').value    = '';
    document.getElementById('gamelistStatus').value   = 'Chci hrát';
    document.getElementById('gamelistPlatform').value = '';
    document.getElementById('gamelistRating').value   = '';
    document.getElementById('gamelistNotes').value    = '';
    updateGamelistFolderSelect();
    new bootstrap.Modal(document.getElementById('gamelistEditorModal')).show();
};

// ── Otevřít editor (editace) ─────────────────────────────────
window.editGamelistItem = function(index) {
    editingGamelistIndex = index;
    const item = gamelistItems[index];
    document.getElementById('gamelistEditorTitle').textContent = 'Upravit hru';
    document.getElementById('gamelistTitle').value    = item.title    || '';
    document.getElementById('gamelistStatus').value   = item.status   || 'Chci hrát';
    document.getElementById('gamelistPlatform').value = item.platform || '';
    document.getElementById('gamelistRating').value   = item.rating   || '';
    document.getElementById('gamelistNotes').value    = item.notes    || '';
    updateGamelistFolderSelect(item.folder);
    new bootstrap.Modal(document.getElementById('gamelistEditorModal')).show();
};

// ── Synchronizovat folder select ─────────────────────────────
function updateGamelistFolderSelect(selectedFolder) {
    const sel = document.getElementById('gamelistFolderSelect');
    if (!sel) return;
    sel.innerHTML = gamelistFolders.map(f =>
        `<option value="${f}" ${f === (selectedFolder || currentGamelistFolder) ? 'selected' : ''}>${f}</option>`
    ).join('');
}

// ── Uložit položku ───────────────────────────────────────────
window.saveGamelistItem = function() {
    const title    = document.getElementById('gamelistTitle').value.trim();
    const status   = document.getElementById('gamelistStatus').value;
    const platform = document.getElementById('gamelistPlatform').value.trim();
    const rating   = document.getElementById('gamelistRating').value;
    const notes    = document.getElementById('gamelistNotes').value.trim();
    const folder   = document.getElementById('gamelistFolderSelect').value;

    if (!title) { alert('Zadej název hry!'); return; }

    const item = { title, folder, status, platform, rating: rating ? parseInt(rating) : null, notes, id: Date.now() };

    if (editingGamelistIndex === -1) {
        gamelistItems.unshift(item);
    } else {
        item.id = gamelistItems[editingGamelistIndex].id;
        gamelistItems[editingGamelistIndex] = item;
    }

    currentGamelistFolder = folder;
    document.getElementById('currentGamelistFolderTitle').textContent = folder;

    saveGamelist();
    bootstrap.Modal.getInstance(document.getElementById('gamelistEditorModal'))?.hide();
};

// ── Smazat položku ───────────────────────────────────────────
window.deleteGamelistItem = function(index) {
    if (!confirm('Odebrat tuto hru z Gamelistu?')) return;
    gamelistItems.splice(index, 1);
    saveGamelist();
};

// ── Rozšíření switchDreamTab o gamelist ──────────────────────
const _origSwitchDreamTab2 = window.switchDreamTab;
window.switchDreamTab = function(tab) {
    // Skrýt gamelist sekci (switchDreamTab ji nezná)
    const secGamelist  = document.getElementById('sectionGamelist');
    const btnGamelist  = document.getElementById('btnTabGamelist');

    if (tab === 'gamelist') {
        // Skrýt ostatní sekce
        ['sectionDreams','sectionWatchlist'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.classList.add('d-none'); el.classList.remove('d-flex'); }
        });
        ['btnTabDreams','btnTabWatchlist'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.className = el.className.replace('btn-info', 'btn-outline-info').replace('btn-outline-outline-info','btn-outline-info');
        });
        // Ukázat gamelist
        if (secGamelist) { secGamelist.classList.remove('d-none'); secGamelist.classList.add('d-flex'); }
        if (btnGamelist) {
            btnGamelist.classList.remove('btn-outline-info');
            btnGamelist.classList.add('btn-info');
        }
        renderGamelistUI();
    } else {
        // Skrýt gamelist, nechej původní funkci zbytek
        if (secGamelist) { secGamelist.classList.add('d-none'); secGamelist.classList.remove('d-flex'); }
        if (btnGamelist) {
            btnGamelist.classList.remove('btn-info');
            btnGamelist.classList.add('btn-outline-info');
        }
        if (_origSwitchDreamTab2) _origSwitchDreamTab2(tab);
    }
};

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadGamelist);
document.addEventListener('darkdash-reload',  loadGamelist);
// ============================================================
//  BOOKLIST — kompletní modul
// ============================================================

let booklistItems   = [];
let booklistFolders = ['Fantasy', 'Sci-Fi', 'Horor', 'Non-Fiction', 'Klasika'];
let currentBooklistFolder = 'Fantasy';
let editingBooklistIndex  = -1;

// ── Storage helpers ──────────────────────────────────────────
function blKey(base) {
    return window.getAppKey ? window.getAppKey(base) : base;
}

// ── Načtení dat ──────────────────────────────────────────────
function loadBooklist() {
    const items   = localStorage.getItem(blKey('darkdash-booklist'));
    const folders = localStorage.getItem(blKey('darkdash-booklist-folders'));
    booklistItems   = items   ? JSON.parse(items)   : [];
    booklistFolders = folders ? JSON.parse(folders) : ['Fantasy', 'Sci-Fi', 'Horor', 'Non-Fiction', 'Klasika'];
    if (!booklistFolders.length) booklistFolders = ['Ostatní'];
    currentBooklistFolder = booklistFolders[0];
    renderBooklistUI();
}

// ── Uložení dat ──────────────────────────────────────────────
function saveBooklist() {
    localStorage.setItem(blKey('darkdash-booklist'),         JSON.stringify(booklistItems));
    localStorage.setItem(blKey('darkdash-booklist-folders'), JSON.stringify(booklistFolders));
    if (window.saveToCloud) window.saveToCloud('booklist', booklistItems);
    renderBooklistUI();
}

// ── Vykreslit celé UI ────────────────────────────────────────
function renderBooklistUI() {
    renderBooklistFolders();
    renderBooklistGrid();
}

// ── Sidebar složky ───────────────────────────────────────────
function renderBooklistFolders() {
    const list = document.getElementById('booklistFolderTreeList');
    if (!list) return;
    list.innerHTML = '';

    booklistFolders.forEach(folder => {
        const count  = booklistItems.filter(i => i.folder === folder).length;
        const active = folder === currentBooklistFolder;
        const a      = document.createElement('a');
        a.href        = '#';
        a.className   = `list-group-item list-group-item-action bg-transparent border-0 d-flex justify-content-between align-items-center px-3 py-2 ${active ? 'text-info fw-bold' : 'text-light'}`;
        a.style.borderLeft = active ? '3px solid #0dcaf0' : '3px solid transparent';
        a.innerHTML = `
            <span class="text-truncate small">${folder}</span>
            <div class="d-flex align-items-center gap-1">
                <span class="badge bg-secondary rounded-pill">${count}</span>
                <button class="btn btn-link p-0 text-danger opacity-0 hover-show"
                        style="font-size:0.7rem;line-height:1;"
                        onclick="event.preventDefault();event.stopPropagation();deleteBooklistFolder('${folder.replace(/'/g,"\\'")}')">✕</button>
            </div>`;
        a.addEventListener('mouseenter', () => a.querySelector('.hover-show').style.opacity = '1');
        a.addEventListener('mouseleave', () => a.querySelector('.hover-show').style.opacity = '0');
        a.addEventListener('click', e => {
            e.preventDefault();
            currentBooklistFolder = folder;
            document.getElementById('currentBooklistFolderTitle').textContent = folder;
            renderBooklistUI();
        });
        list.appendChild(a);
    });
}

// ── Grid s kartičkami ────────────────────────────────────────
function renderBooklistGrid() {
    const grid = document.getElementById('booklistGrid');
    if (!grid) return;

    const items = booklistItems.filter(i => i.folder === currentBooklistFolder);
    grid.innerHTML = '';

    if (!items.length) {
        grid.innerHTML = `<div class="col-12 text-center text-muted py-5 fst-italic">
            Žádné knihy v této kategorii.<br>
            <small>Klikni na "+ Přidat knihu"</small>
        </div>`;
        return;
    }

    const statusConfig = {
        'Chci číst': { color: 'secondary', icon: '📋' },
        'Čtu':       { color: 'warning',   icon: '📖' },
        'Přečteno':  { color: 'success',   icon: '✅' },
        'Odloženo':  { color: 'danger',    icon: '⏸️'  },
    };

    items.forEach(item => {
        const globalIdx = booklistItems.indexOf(item);
        const cfg       = statusConfig[item.status] || { color: 'secondary', icon: '📋' };
        const ratingBadge = item.rating
            ? `<span class="badge bg-warning text-dark ms-1">★ ${item.rating}/10</span>`
            : '';
        const pagesBadge = item.pages
            ? `<span class="badge bg-dark border border-secondary text-muted small">📄 ${item.pages} str.</span>`
            : '';

        const col = document.createElement('div');
        col.className = 'col-md-4 col-sm-6';
        col.innerHTML = `
            <div class="card bg-dark border-secondary h-100 shadow-sm" style="border-left: 3px solid #0dcaf0 !important;">
                <div class="card-body p-3 d-flex flex-column gap-2">
                    <div class="d-flex justify-content-between align-items-start flex-wrap gap-1">
                        <h6 class="text-info m-0 fw-bold" style="word-break:break-word;">${item.title}</h6>
                        <span class="badge bg-${cfg.color} flex-shrink-0">${cfg.icon} ${item.status}</span>
                    </div>
                    ${item.author ? `<div class="text-muted small fst-italic">— ${item.author}</div>` : ''}
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                        ${pagesBadge}
                        ${ratingBadge}
                    </div>
                    ${item.notes ? `<p class="text-muted small m-0" style="font-size:0.8rem;">${item.notes}</p>` : ''}
                </div>
                <div class="card-footer bg-transparent border-top border-secondary d-flex gap-2 p-2">
                    <button class="btn btn-sm btn-outline-info flex-grow-1" onclick="editBooklistItem(${globalIdx})">
                        ✎ Upravit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteBooklistItem(${globalIdx})">
                        ✕
                    </button>
                </div>
            </div>`;
        grid.appendChild(col);
    });
}

// ── Nová složka ──────────────────────────────────────────────
window.createNewBooklistFolder = function() {
    const name = prompt('Název nové kategorie:');
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    if (booklistFolders.includes(trimmed)) { alert('Tato kategorie už existuje.'); return; }
    booklistFolders.push(trimmed);
    currentBooklistFolder = trimmed;
    document.getElementById('currentBooklistFolderTitle').textContent = trimmed;
    saveBooklist();
};

// ── Smazat složku ────────────────────────────────────────────
window.deleteBooklistFolder = function(folder) {
    if (booklistFolders.length <= 1) { alert('Musí existovat alespoň jedna kategorie.'); return; }
    const count = booklistItems.filter(i => i.folder === folder).length;
    if (!confirm(`Smazat kategorii "${folder}" i s ${count} knihami?`)) return;
    booklistFolders      = booklistFolders.filter(f => f !== folder);
    booklistItems        = booklistItems.filter(i => i.folder !== folder);
    currentBooklistFolder = booklistFolders[0];
    document.getElementById('currentBooklistFolderTitle').textContent = currentBooklistFolder;
    saveBooklist();
};

// ── Otevřít editor (nová kniha) ──────────────────────────────
window.openBooklistEditor = function() {
    editingBooklistIndex = -1;
    document.getElementById('booklistEditorTitle').textContent = 'Přidat knihu';
    document.getElementById('booklistTitle').value  = '';
    document.getElementById('booklistAuthor').value = '';
    document.getElementById('booklistStatus').value = 'Chci číst';
    document.getElementById('booklistRating').value = '';
    document.getElementById('booklistPages').value  = '';
    document.getElementById('booklistNotes').value  = '';
    updateBooklistFolderSelect();
    new bootstrap.Modal(document.getElementById('booklistEditorModal')).show();
};

// ── Otevřít editor (editace) ─────────────────────────────────
window.editBooklistItem = function(index) {
    editingBooklistIndex = index;
    const item = booklistItems[index];
    document.getElementById('booklistEditorTitle').textContent = 'Upravit knihu';
    document.getElementById('booklistTitle').value  = item.title  || '';
    document.getElementById('booklistAuthor').value = item.author || '';
    document.getElementById('booklistStatus').value = item.status || 'Chci číst';
    document.getElementById('booklistRating').value = item.rating || '';
    document.getElementById('booklistPages').value  = item.pages  || '';
    document.getElementById('booklistNotes').value  = item.notes  || '';
    updateBooklistFolderSelect(item.folder);
    new bootstrap.Modal(document.getElementById('booklistEditorModal')).show();
};

// ── Synchronizovat folder select ─────────────────────────────
function updateBooklistFolderSelect(selectedFolder) {
    const sel = document.getElementById('booklistFolderSelect');
    if (!sel) return;
    sel.innerHTML = booklistFolders.map(f =>
        `<option value="${f}" ${f === (selectedFolder || currentBooklistFolder) ? 'selected' : ''}>${f}</option>`
    ).join('');
}

// ── Uložit položku ───────────────────────────────────────────
window.saveBooklistItem = function() {
    const title  = document.getElementById('booklistTitle').value.trim();
    const author = document.getElementById('booklistAuthor').value.trim();
    const status = document.getElementById('booklistStatus').value;
    const rating = document.getElementById('booklistRating').value;
    const pages  = document.getElementById('booklistPages').value;
    const notes  = document.getElementById('booklistNotes').value.trim();
    const folder = document.getElementById('booklistFolderSelect').value;

    if (!title) { alert('Zadej název knihy!'); return; }

    const item = {
        title, author, folder, status,
        rating: rating ? parseInt(rating) : null,
        pages:  pages  ? parseInt(pages)  : null,
        notes,
        id: Date.now()
    };

    if (editingBooklistIndex === -1) {
        booklistItems.unshift(item);
    } else {
        item.id = booklistItems[editingBooklistIndex].id;
        booklistItems[editingBooklistIndex] = item;
    }

    currentBooklistFolder = folder;
    document.getElementById('currentBooklistFolderTitle').textContent = folder;

    saveBooklist();
    bootstrap.Modal.getInstance(document.getElementById('booklistEditorModal'))?.hide();
};

// ── Smazat položku ───────────────────────────────────────────
window.deleteBooklistItem = function(index) {
    if (!confirm('Odebrat tuto knihu z Booklistu?')) return;
    booklistItems.splice(index, 1);
    saveBooklist();
};

// ── Rozšíření switchDreamTab o booklist ──────────────────────
const _origSwitchDreamTab3 = window.switchDreamTab;
window.switchDreamTab = function(tab) {
    const secBooklist  = document.getElementById('sectionBooklist');
    const btnBooklist  = document.getElementById('btnTabBooklist');

    if (tab === 'booklist') {
        ['sectionDreams','sectionWatchlist','sectionGamelist'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.classList.add('d-none'); el.classList.remove('d-flex'); }
        });
        ['btnTabDreams','btnTabWatchlist','btnTabGamelist'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('btn-info');
                el.classList.add('btn-outline-info');
            }
        });
        if (secBooklist) { secBooklist.classList.remove('d-none'); secBooklist.classList.add('d-flex'); }
        if (btnBooklist) { btnBooklist.classList.remove('btn-outline-info'); btnBooklist.classList.add('btn-info'); }
        renderBooklistUI();
    } else {
        if (secBooklist) { secBooklist.classList.add('d-none'); secBooklist.classList.remove('d-flex'); }
        if (btnBooklist) { btnBooklist.classList.remove('btn-info'); btnBooklist.classList.add('btn-outline-info'); }
        if (_origSwitchDreamTab3) _origSwitchDreamTab3(tab);
    }
};

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadBooklist);
document.addEventListener('darkdash-reload',  loadBooklist);