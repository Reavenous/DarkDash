let dreams = [];
let editingDreamIndex = -1;

// Načtení snů
function loadDreams() {
    const stored = localStorage.getItem("darkdash-dreams");
    if (stored) dreams = JSON.parse(stored);
    renderDreams();
}

function saveDreamsToStorage() {
    localStorage.setItem("darkdash-dreams", JSON.stringify(dreams));
}

// Otevření editoru
function openDreamEditor(index = -1) {
    editingDreamIndex = index;
    const dateInput = document.getElementById("dreamDate");
    const descInput = document.getElementById("dreamDescription");
    const tagsInput = document.getElementById("dreamTags");
    const title = document.getElementById("dreamEditorTitle");

    if (index === -1) {
        title.innerText = "Nový sen";
        dateInput.valueAsDate = new Date(); // Dnešní datum
        descInput.value = "";
        tagsInput.value = "";
    } else {
        const d = dreams[index];
        title.innerText = "Upravit sen";
        dateInput.value = d.date;
        descInput.value = d.description;
        tagsInput.value = d.tags.join(", ");
    }

    const modal = new bootstrap.Modal(document.getElementById('dreamEditorModal'));
    modal.show();
}

// Uložení snu
function saveDream() {
    const date = document.getElementById("dreamDate").value;
    const description = document.getElementById("dreamDescription").value.trim();
    const tagsString = document.getElementById("dreamTags").value.trim();

    if (!description) return;

    // Zpracování štítků (rozdělení čárkou a očištění)
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()) : [];

    const dreamObj = { date, description, tags };

    if (editingDreamIndex === -1) {
        dreams.unshift(dreamObj); // Přidat na začátek (nejnovější nahoře)
    } else {
        dreams[editingDreamIndex] = dreamObj;
    }

    saveDreamsToStorage();
    renderDreams();

    const modalEl = document.getElementById('dreamEditorModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    modalInstance.hide();
}

// Smazání snu
function deleteDream(index) {
    if(confirm("Zapomenout tento sen?")) {
        dreams.splice(index, 1);
        saveDreamsToStorage();
        renderDreams();
    }
}

// Vykreslení seznamu
function renderDreams() {
    const list = document.getElementById("dreamList");
    list.innerHTML = "";

    dreams.forEach((dream, index) => {
        const li = document.createElement("li");
        li.className = "list-group-item bg-transparent border-bottom border-secondary py-3";
        
        // Formátování data
        const dateObj = new Date(dream.date);
        const dateStr = dateObj.toLocaleDateString('cs-CZ');

        // Generování HTML pro štítky
        const tagsHtml = dream.tags.map(tag => `<span class="dream-tag">#${tag}</span>`).join('');

        li.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-2">
                <small class="text-muted">${dateStr}</small>
                <div>
                    <button class="btn btn-sm btn-outline-warning p-0 border-0 me-2" onclick="openDreamEditor(${index})">✎</button>
                    <button class="btn btn-sm btn-outline-danger p-0 border-0" onclick="deleteDream(${index})">×</button>
                </div>
            </div>
            <p class="text-light mb-2 text-break">${dream.description}</p>
            <div class="mt-1">${tagsHtml}</div>
        `;
        list.appendChild(li);
    });
}

// Start
loadDreams();