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