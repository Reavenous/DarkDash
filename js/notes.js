let notes = [];
let folders = ["Obecné"]; // Výchozí složka, kterou nelze smazat
let currentFolder = "Obecné";
let editingIndex = -1;

function loadNotes() {
    // Načtení poznámek
    const notesKey = window.getAppKey ? window.getAppKey("darkdash-notes") : "darkdash-notes";
    const storedNotes = localStorage.getItem(notesKey);
    if (storedNotes) {
        notes = JSON.parse(storedNotes);
        // Záchrana starých poznámek bez složky
        notes = notes.map(n => typeof n === 'string' ? { folder: "Obecné", text: n } : n);
    }

    // Načtení složek
    const foldersKey = window.getAppKey ? window.getAppKey("darkdash-folders") : "darkdash-folders";
    const storedFolders = localStorage.getItem(foldersKey);
    if (storedFolders) {
        folders = JSON.parse(storedFolders);
    }
    if (!folders.includes("Obecné")) folders.unshift("Obecné");

    renderUI();
}

function saveNotesToStorage() {
    const notesKey = window.getAppKey ? window.getAppKey("darkdash-notes") : "darkdash-notes";
    localStorage.setItem(notesKey, JSON.stringify(notes));
    if (window.saveToCloud) window.saveToCloud('notes', notes);
    
    const foldersKey = window.getAppKey ? window.getAppKey("darkdash-folders") : "darkdash-folders";
    localStorage.setItem(foldersKey, JSON.stringify(folders));
    if (window.saveToCloud) window.saveToCloud('folders', folders);

    renderUI();
}

function renderUI() {
    renderFoldersSidebar();
    renderNotesGrid();
    updateFolderSelectInEditor();
}

// VYKRESLENÍ LEVÉHO MENU (Složky)
function renderFoldersSidebar() {
    const list = document.getElementById("folderTreeList");
    if (!list) return;
    list.innerHTML = "";

    folders.forEach(folderName => {
        const a = document.createElement("a");
        a.href = "#";
        a.className = `list-group-item list-group-item-action bg-transparent text-light border-0 py-2 px-3 ${folderName === currentFolder ? 'fw-bold text-info' : ''}`;
        
        // Zvýraznění aktivní složky (jemné pozadí)
        if (folderName === currentFolder) {
            a.style.backgroundColor = "rgba(13, 110, 253, 0.1)"; 
            a.style.borderLeft = "3px solid #0dcaf0";
        } else {
            a.style.borderLeft = "3px solid transparent";
            a.style.opacity = "0.7";
        }

        a.innerHTML = `<i class="bi bi-folder2 me-2"></i>${folderName}`;
        a.onclick = (e) => {
            e.preventDefault();
            currentFolder = folderName;
            renderUI();
        };
        list.appendChild(a);
    });
}

// VYKRESLENÍ PRAVÉ MŘÍŽKY (Poznámky jen v aktuální složce)
function renderNotesGrid() {
    const list = document.getElementById("notesList");
    const title = document.getElementById("currentFolderTitle");
    if(!list || !title) return;
    
    title.innerText = currentFolder;
    list.innerHTML = "";

    // Vyfiltrujeme jen ty, co patří do aktivní složky
    const filteredNotes = notes.map((note, idx) => ({...note, originalIndex: idx}))
                               .filter(note => (note.folder || "Obecné") === currentFolder);

    if (filteredNotes.length === 0) {
        list.innerHTML = `<div class="col-12 text-muted text-center mt-5"><em>Složka je prázdná.</em></div>`;
        return;
    }

    filteredNotes.forEach((note) => {
        const renderedHTML = typeof marked !== 'undefined' ? marked.parse(note.text) : note.text;
        
        const col = document.createElement("div");
        col.className = "col-md-6 col-lg-6"; // Větší kartičky, protože máme méně místa

        col.innerHTML = `
            <div class="card bg-dark text-light border-secondary h-100 shadow position-relative" style="background: linear-gradient(145deg, #222, #111);">
                <div class="card-header border-bottom border-secondary d-flex justify-content-end align-items-center p-2">
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-warning border-0" onclick="openEditor(${note.originalIndex})" title="Upravit">✏️</button>
                        <button class="btn btn-sm btn-outline-danger border-0" onclick="deleteNote(${note.originalIndex})" title="Smazat">🗑️</button>
                    </div>
                </div>
                <div class="card-body overflow-auto p-3" style="max-height: 250px;">
                    <div class="markdown-content">${renderedHTML}</div>
                </div>
            </div>
        `;
        list.appendChild(col);
    });
}

// TVORBA NOVÉ SLOŽKY
function createNewFolder() {
    const folderName = prompt("Zadej název nové složky (např. 'Škola / Důležité...'):");
    if (folderName && folderName.trim() !== "") {
        const cleanName = folderName.trim();
        if (!folders.includes(cleanName)) {
            folders.push(cleanName);
            currentFolder = cleanName; // Hned do ní skočíme
            saveNotesToStorage();
        } else {
            alert("Tato složka už existuje!");
        }
    }
}

function updateFolderSelectInEditor() {
    const select = document.getElementById("editorFolderSelect");
    if (!select) return;
    select.innerHTML = "";
    folders.forEach(folder => {
        const option = document.createElement("option");
        option.value = folder;
        option.innerText = folder;
        select.appendChild(option);
    });
}

function deleteNote(index) {
    if (confirm("Opravdu chceš smazat tuto poznámku?")) {
        notes.splice(index, 1);
        saveNotesToStorage();
    }
}

function openEditor(index = -1) {
    const textarea = document.getElementById("editorTextarea");
    const title = document.getElementById("editorTitle");
    const select = document.getElementById("editorFolderSelect");
    
    editingIndex = index;

    if (index === -1) {
        title.innerText = "Nová poznámka";
        textarea.value = "";
        if (select) select.value = currentFolder; // Předvybere aktuální složku
    } else {
        title.innerText = "Upravit poznámku";
        textarea.value = notes[index].text;
        if (select) select.value = notes[index].folder || "Obecné";
    }

    const modal = new bootstrap.Modal(document.getElementById('noteEditorModal'));
    modal.show();
}

function saveNote() {
    const textarea = document.getElementById("editorTextarea");
    const text = textarea.value.trim();
    const select = document.getElementById("editorFolderSelect");
    const folder = select ? select.value : "Obecné";

    if (text === "") {
        alert("Poznámka nemůže být prázdná!");
        return;
    }

    const noteObj = { folder: folder, text: text };

    if (editingIndex === -1) {
        notes.push(noteObj);
    } else {
        notes[editingIndex] = noteObj;
    }

    // Pokud uživatel uložil do jiné složky, přepneme ho tam
    currentFolder = folder;
    saveNotesToStorage();

    const modalEl = document.getElementById('noteEditorModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    modalInstance.hide();
}

function exportCurrentNotePDF() {
    const textarea = document.getElementById("editorTextarea");
    const text = textarea.value;
    if (text.trim() === "") { alert("Není co exportovat!"); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(text, 180);
    doc.text(splitText, 10, 10);
    doc.save("poznamka_export.pdf");
}

document.addEventListener("DOMContentLoaded", loadNotes);
document.addEventListener("darkdash-reload", loadNotes);