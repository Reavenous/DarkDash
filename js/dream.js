let dreams = [];
let editingDreamIndex = -1;

function loadDreams() {
    const key = window.getAppKey("darkdash-dreams");
    const stored = localStorage.getItem(key);
    if (stored) dreams = JSON.parse(stored);
    else dreams = [];
    renderDreams();
}

function saveDreamsToStorage() {
    const key = window.getAppKey("darkdash-dreams");
    localStorage.setItem(key, JSON.stringify(dreams));
    
    // CLOUD SAVE
    if (window.saveToCloud) window.saveToCloud('dreams', dreams);

    renderDreams();
}

function openDreamEditor(index = -1) {
    editingDreamIndex = index;
    const dateInput = document.getElementById("dreamDate");
    const descInput = document.getElementById("dreamDescription");
    const tagsInput = document.getElementById("dreamTags");
    const title = document.getElementById("dreamEditorTitle");

    if (index === -1) {
        title.innerText = "Nový sen";
        dateInput.valueAsDate = new Date();
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

function saveDream() {
    const date = document.getElementById("dreamDate").value;
    const description = document.getElementById("dreamDescription").value.trim();
    const tagsString = document.getElementById("dreamTags").value.trim();

    if (!description) return;

    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()) : [];
    const dreamObj = { date, description, tags };

    if (editingDreamIndex === -1) {
        dreams.unshift(dreamObj);
    } else {
        dreams[editingDreamIndex] = dreamObj;
    }

    saveDreamsToStorage();

    const modalEl = document.getElementById('dreamEditorModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    modalInstance.hide();
}

function deleteDream(index) {
    if(confirm("Zapomenout tento sen?")) {
        dreams.splice(index, 1);
        saveDreamsToStorage();
    }
}

function renderDreams() {
    const list = document.getElementById("dreamList");
    if(!list) return;
    list.innerHTML = "";

    dreams.forEach((dream, index) => {
        const li = document.createElement("li");
        li.className = "list-group-item bg-transparent border-bottom border-secondary py-3";
        const dateObj = new Date(dream.date);
        const dateStr = dateObj.toLocaleDateString('cs-CZ');
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

document.addEventListener("DOMContentLoaded", loadDreams);
document.addEventListener("darkdash-reload", loadDreams);