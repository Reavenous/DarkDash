let notes = [];
let editingIndex = -1; // -1 = Nová poznámka, 0+ = Index upravované poznámky

// --- 1. NAČÍTÁNÍ A UKLÁDÁNÍ DAT ---

function loadNotes() {
    const stored = localStorage.getItem("darkdash-notes");
    if (stored) {
        notes = JSON.parse(stored);
    }
    renderNotesLibrary();
}

function saveNotesToStorage() {
    localStorage.setItem("darkdash-notes", JSON.stringify(notes));
}

// --- 2. LOGIKA KNIHOVNY (SIDEBAR) ---

function renderNotesLibrary() {
    const list = document.getElementById("notesList");
    list.innerHTML = "";

    notes.forEach((note, index) => {
        let preview = note.length > 30 ? note.substring(0, 30) + "..." : note;
        if (preview.trim() === "") preview = "(Prázdná poznámka)";

        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center bg-transparent border-bottom border-secondary py-3";
        
        li.innerHTML = `
            <span class="text-light fw-bold">${preview}</span>
            <div class="btn-group">
                <button class="btn btn-sm btn-outline-warning" onclick="openEditor(${index})">
                    ${ICONS.actions.edit}
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteNote(${index})">
                    ${ICONS.actions.delete}
                </button>
            </div>
        `;
        list.appendChild(li);
    });
}

function deleteNote(index) {
    if (confirm("Smazat tuto poznámku?")) {
        notes.splice(index, 1);
        saveNotesToStorage();
        renderNotesLibrary();
    }
}

// --- 3. LOGIKA EDITORU (WIDGET UPROSTŘED) ---

// Otevře editor. Pokud předáš index, načte existující poznámku.
function openEditor(index = -1) {
    const textarea = document.getElementById("editorTextarea");
    const title = document.getElementById("editorTitle");
    
    editingIndex = index;

    if (index === -1) {
        // Nová poznámka
        title.innerText = "Nová poznámka";
        textarea.value = "";
    } else {
        // Úprava existující
        title.innerText = "Upravit poznámku";
        textarea.value = notes[index];
    }

    // Otevření modalu přes Bootstrap API
    const modal = new bootstrap.Modal(document.getElementById('noteEditorModal'));
    modal.show();
}

// Uloží text z editoru do pole a zavře editor
function saveNote() {
    const textarea = document.getElementById("editorTextarea");
    const text = textarea.value.trim();

    if (text === "") {
        alert("Poznámka nemůže být prázdná!");
        return;
    }

    if (editingIndex === -1) {
        // Přidání nové
        notes.push(text);
    } else {
        // Aktualizace existující
        notes[editingIndex] = text;
    }

    saveNotesToStorage();
    renderNotesLibrary();

    // Zavření modalu
    const modalEl = document.getElementById('noteEditorModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    modalInstance.hide();
}

// --- 4. EXPORT DO PDF (PŘÍMO Z EDITORU) ---

function exportCurrentNotePDF() {
    const textarea = document.getElementById("editorTextarea");
    const text = textarea.value;

    if (text.trim() === "") {
        alert("Není co exportovat!");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Rozdělení textu na řádky, aby se vešel na A4
    const splitText = doc.splitTextToSize(text, 180);
    
    doc.text(splitText, 10, 10);
    doc.save("poznamka_export.pdf");
}

// Spuštění při startu
loadNotes();