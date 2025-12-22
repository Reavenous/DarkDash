let notes = [];
let editingIndex = -1;

function loadNotes() {
    const key = window.getAppKey("darkdash-notes");
    const stored = localStorage.getItem(key);
    if (stored) notes = JSON.parse(stored);
    else notes = []; // Reset
    renderNotesLibrary();
}

function saveNotesToStorage() {
    const key = window.getAppKey("darkdash-notes");
    localStorage.setItem(key, JSON.stringify(notes));
    
    // CLOUD SAVE
    if (window.saveToCloud) window.saveToCloud('notes', notes);
    
    renderNotesLibrary();
}

function renderNotesLibrary() {
    const list = document.getElementById("notesList");
    if(!list) return;
    list.innerHTML = "";

    notes.forEach((note, index) => {
        let preview = note.length > 30 ? note.substring(0, 30) + "..." : note;
        if (preview.trim() === "") preview = "(Prázdná poznámka)";

        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center bg-transparent border-bottom border-secondary py-3";
        
        li.innerHTML = `
            <span class="text-light fw-bold">${preview}</span>
            <div class="btn-group">
                <button class="btn btn-sm btn-outline-warning" onclick="openEditor(${index})">${ICONS.actions.edit}</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteNote(${index})">${ICONS.actions.delete}</button>
            </div>
        `;
        list.appendChild(li);
    });
}

function deleteNote(index) {
    if (confirm("Smazat tuto poznámku?")) {
        notes.splice(index, 1);
        saveNotesToStorage();
    }
}

function openEditor(index = -1) {
    const textarea = document.getElementById("editorTextarea");
    const title = document.getElementById("editorTitle");
    
    editingIndex = index;

    if (index === -1) {
        title.innerText = "Nová poznámka";
        textarea.value = "";
    } else {
        title.innerText = "Upravit poznámku";
        textarea.value = notes[index];
    }

    const modal = new bootstrap.Modal(document.getElementById('noteEditorModal'));
    modal.show();
}

function saveNote() {
    const textarea = document.getElementById("editorTextarea");
    const text = textarea.value.trim();

    if (text === "") {
        alert("Poznámka nemůže být prázdná!");
        return;
    }

    if (editingIndex === -1) {
        notes.push(text);
    } else {
        notes[editingIndex] = text;
    }

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