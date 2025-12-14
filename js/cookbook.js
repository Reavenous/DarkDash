let recipes = [];
let editingRecipeIndex = -1;

// --- NAČÍTÁNÍ A UKLÁDÁNÍ ---
function loadRecipes() {
    const stored = localStorage.getItem("darkdash-recipes");
    if (stored) recipes = JSON.parse(stored);
    renderRecipeLibrary();
}

function saveRecipesToStorage() {
    localStorage.setItem("darkdash-recipes", JSON.stringify(recipes));
}

// --- LOGIKA KNIHOVNY (SIDEBAR) ---
function renderRecipeLibrary() {
    const list = document.getElementById("recipeList");
    list.innerHTML = "";

    recipes.forEach((recipe, index) => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center bg-transparent border-bottom border-secondary py-3";
        li.innerHTML = `
            <span class="text-light fw-bold">${recipe.name}</span>
            <div class="btn-group">
                <button class="btn btn-sm btn-outline-warning" onclick="openRecipeEditor(${index})">
                    ${ICONS.actions.edit}
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteRecipe(${index})">
                    ${ICONS.actions.delete}
                </button>
            </div>
        `;
        list.appendChild(li);
    });
}

function deleteRecipe(index) {
    if(confirm("Opravdu smazat tento recept?")) {
        recipes.splice(index, 1);
        saveRecipesToStorage();
        renderRecipeLibrary();
    }
}

// --- EDITOR RECEPTU (MODAL) ---

// Otevření editoru
function openRecipeEditor(index = -1) {
    editingRecipeIndex = index;
    const modalTitle = document.getElementById("recipeEditorTitle");
    const nameInput = document.getElementById("recipeName");
    const ingContainer = document.getElementById("ingredientsContainer");
    const stepContainer = document.getElementById("stepsContainer");

    // Vyčistíme starý obsah
    ingContainer.innerHTML = "";
    stepContainer.innerHTML = "";

    if (index === -1) {
        modalTitle.innerText = "Nový recept";
        nameInput.value = "";
        // Přidáme jeden prázdný řádek pro start
        addIngredientRow();
        addStepRow();
    } else {
        const r = recipes[index];
        modalTitle.innerText = "Upravit recept";
        nameInput.value = r.name;
        
        // Načteme ingredience
        r.ingredients.forEach(ing => addIngredientRow(ing.amount, ing.unit, ing.item));
        if (r.ingredients.length === 0) addIngredientRow();

        // Načteme kroky
        r.steps.forEach(step => addStepRow(step));
        if (r.steps.length === 0) addStepRow();
    }

    const modal = new bootstrap.Modal(document.getElementById('recipeEditorModal'));
    modal.show();
}

// Přidání řádku ingredience
function addIngredientRow(amount = "", unit = "ks", item = "") {
    const container = document.getElementById("ingredientsContainer");
    const div = document.createElement("div");
    div.className = "input-group input-group-sm";
    div.innerHTML = `
        <input type="text" class="form-control bg-dark text-light border-secondary ing-amount" placeholder="Množ." value="${amount}" style="max-width: 60px;">
        <select class="form-select bg-dark text-light border-secondary ing-unit" style="max-width: 70px;">
            <option value="ks" ${unit === 'ks' ? 'selected' : ''}>ks</option>
            <option value="g" ${unit === 'g' ? 'selected' : ''}>g</option>
            <option value="kg" ${unit === 'kg' ? 'selected' : ''}>kg</option>
            <option value="ml" ${unit === 'ml' ? 'selected' : ''}>ml</option>
            <option value="l" ${unit === 'l' ? 'selected' : ''}>l</option>
            <option value="lžíce" ${unit === 'lžíce' ? 'selected' : ''}>lžíce</option>
            <option value="špetka" ${unit === 'špetka' ? 'selected' : ''}>špetka</option>
        </select>
        <input type="text" class="form-control bg-dark text-light border-secondary ing-item" placeholder="Surovina" value="${item}">
        <button class="btn btn-outline-danger" type="button" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(div);
}

// Přidání řádku kroku
function addStepRow(text = "") {
    const container = document.getElementById("stepsContainer");
    const div = document.createElement("div");
    div.className = "d-flex gap-2 align-items-start";
    
    // Číslování se vyřeší samo pořadím
    div.innerHTML = `
        <span class="text-secondary mt-1">•</span>
        <textarea class="form-control bg-dark text-light border-secondary step-text" rows="2" placeholder="Popis kroku...">${text}</textarea>
        <button class="btn btn-sm btn-outline-danger mt-1" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(div);
}

// Uložení receptu z editoru
function saveRecipe() {
    const name = document.getElementById("recipeName").value.trim();
    if (!name) { alert("Recept musí mít název!"); return; }

    // Sběr ingrediencí
    const ingredients = [];
    document.querySelectorAll("#ingredientsContainer .input-group").forEach(row => {
        const amount = row.querySelector(".ing-amount").value.trim();
        const unit = row.querySelector(".ing-unit").value;
        const item = row.querySelector(".ing-item").value.trim();
        if (item) ingredients.push({ amount, unit, item });
    });

    // Sběr kroků
    const steps = [];
    document.querySelectorAll("#stepsContainer .step-text").forEach(area => {
        if (area.value.trim()) steps.push(area.value.trim());
    });

    const recipeObj = { name, ingredients, steps };

    if (editingRecipeIndex === -1) {
        recipes.push(recipeObj);
    } else {
        recipes[editingRecipeIndex] = recipeObj;
    }

    saveRecipesToStorage();
    renderRecipeLibrary();

    const modalEl = document.getElementById('recipeEditorModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    modalInstance.hide();
}

// Export do PDF
function exportRecipePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const name = document.getElementById("recipeName").value || "Recept";
    
    // Nadpis
    doc.setFontSize(22);
    doc.text(name, 10, 20);

    // Ingredience
    doc.setFontSize(16);
    doc.text("Ingredience:", 10, 40);
    doc.setFontSize(12);
    
    let y = 50;
    document.querySelectorAll("#ingredientsContainer .input-group").forEach(row => {
        const amount = row.querySelector(".ing-amount").value;
        const unit = row.querySelector(".ing-unit").value;
        const item = row.querySelector(".ing-item").value;
        if (item) {
            doc.text(`- ${amount} ${unit} ${item}`, 15, y);
            y += 7;
        }
    });

    // Postup
    y += 10;
    doc.setFontSize(16);
    doc.text("Postup:", 10, y);
    y += 10;
    doc.setFontSize(12);

    document.querySelectorAll("#stepsContainer .step-text").forEach((area, index) => {
        if (area.value.trim()) {
            const stepText = `${index + 1}. ${area.value}`;
            const splitText = doc.splitTextToSize(stepText, 180);
            doc.text(splitText, 15, y);
            y += (splitText.length * 7) + 3; // Posun podle počtu řádků
        }
    });

    doc.save(`${name}.pdf`);
}

// Start
loadRecipes();