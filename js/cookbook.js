let recipes = [];
let recipeFolders = ["Obecné", "Snídaně", "Hlavní chody", "Dezerty"]; 
let currentRecipeFolder = "Obecné";
let editingRecipeIndex = -1;

function loadRecipes() {
    const rKey = window.getAppKey ? window.getAppKey("darkdash-recipes") : "darkdash-recipes";
    const storedR = localStorage.getItem(rKey);
    if (storedR) {
        recipes = JSON.parse(storedR);
        // Záchrana starých receptů bez složky
        recipes = recipes.map(r => r.folder ? r : { ...r, folder: "Obecné" });
    }

    const fKey = window.getAppKey ? window.getAppKey("darkdash-recipe-folders") : "darkdash-recipe-folders";
    const storedF = localStorage.getItem(fKey);
    if (storedF) {
        recipeFolders = JSON.parse(storedF);
    }
    if (!recipeFolders.includes("Obecné")) recipeFolders.unshift("Obecné");

    renderRecipeUI();
}

function saveRecipesToStorage() {
    const rKey = window.getAppKey ? window.getAppKey("darkdash-recipes") : "darkdash-recipes";
    localStorage.setItem(rKey, JSON.stringify(recipes));
    if(window.saveToCloud) window.saveToCloud("recipes", recipes); 

    const fKey = window.getAppKey ? window.getAppKey("darkdash-recipe-folders") : "darkdash-recipe-folders";
    localStorage.setItem(fKey, JSON.stringify(recipeFolders));
    if(window.saveToCloud) window.saveToCloud("recipe-folders", recipeFolders); 

    renderRecipeUI();
}

function renderRecipeUI() {
    renderRecipeFoldersSidebar();
    renderRecipeGrid();
    updateRecipeFolderSelectInEditor();
}

function renderRecipeFoldersSidebar() {
    const list = document.getElementById("recipeFolderTreeList");
    if (!list) return;
    list.innerHTML = "";

    recipeFolders.forEach(folderName => {
        const a = document.createElement("a");
        a.href = "#";
        a.className = `list-group-item list-group-item-action bg-transparent text-light border-0 py-2 px-3 ${folderName === currentRecipeFolder ? 'fw-bold text-warning' : ''}`;
        
        if (folderName === currentRecipeFolder) {
            a.style.backgroundColor = "rgba(255, 193, 7, 0.1)"; 
            a.style.borderLeft = "3px solid #ffc107";
        } else {
            a.style.borderLeft = "3px solid transparent";
            a.style.opacity = "0.7";
        }

        a.innerHTML = `<i class="bi bi-book me-2"></i>${folderName}`;
        a.onclick = (e) => {
            e.preventDefault();
            currentRecipeFolder = folderName;
            renderRecipeUI();
        };
        list.appendChild(a);
    });
}

function renderRecipeGrid() {
    const list = document.getElementById("recipeList");
    const title = document.getElementById("currentRecipeFolderTitle");
    if(!list || !title) return;
    
    title.innerText = currentRecipeFolder;
    list.innerHTML = "";

    const filteredRecipes = recipes.map((r, idx) => ({...r, originalIndex: idx}))
                                   .filter(r => (r.folder || "Obecné") === currentRecipeFolder);

    if (filteredRecipes.length === 0) {
        list.innerHTML = `<div class="col-12 text-muted text-center mt-5"><em>V této kategorii nejsou žádné recepty.</em></div>`;
        return;
    }

    filteredRecipes.forEach((recipe) => {
        const col = document.createElement("div");
        col.className = "col-md-6"; 

        // Náhled surovin na kartičce
        let ingPreview = recipe.ingredients.map(i => i.item).slice(0, 3).join(", ");
        if(recipe.ingredients.length > 3) ingPreview += "...";
        if(ingPreview === "") ingPreview = "Žádné suroviny";

        col.innerHTML = `
            <div class="card bg-dark text-light border-secondary h-100 shadow position-relative" style="background: linear-gradient(145deg, #2a1f11, #111);">
                <div class="card-header border-bottom border-secondary d-flex justify-content-between align-items-center p-2">
                    <span class="badge bg-warning text-dark fw-bold" style="font-size: 0.9rem;">${recipe.name}</span>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-warning border-0" onclick="openRecipeEditor(${recipe.originalIndex})" title="Upravit">✏️</button>
                        <button class="btn btn-sm btn-outline-danger border-0" onclick="deleteRecipe(${recipe.originalIndex})" title="Smazat">🗑️</button>
                    </div>
                </div>
                <div class="card-body p-3" style="font-size: 0.85rem;">
                    <p class="mb-1 text-info"><strong>Ingredience:</strong> <span class="text-light">${ingPreview}</span></p>
                    <p class="mb-0 text-success"><strong>Postup:</strong> <span class="text-light">${recipe.steps.length} kroků</span></p>
                </div>
            </div>
        `;
        list.appendChild(col);
    });
}

function createNewRecipeFolder() {
    const folderName = prompt("Zadej název nové kategorie (např. 'Polévky'):");
    if (folderName && folderName.trim() !== "") {
        const cleanName = folderName.trim();
        if (!recipeFolders.includes(cleanName)) {
            recipeFolders.push(cleanName);
            currentRecipeFolder = cleanName; 
            saveRecipesToStorage();
        } else {
            alert("Tato kategorie už existuje!");
        }
    }
}

function updateRecipeFolderSelectInEditor() {
    const select = document.getElementById("recipeFolderSelect");
    if (!select) return;
    select.innerHTML = "";
    recipeFolders.forEach(folder => {
        const option = document.createElement("option");
        option.value = folder;
        option.innerText = folder;
        select.appendChild(option);
    });
}

function deleteRecipe(index) {
    if(confirm("Opravdu smazat tento recept?")) {
        recipes.splice(index, 1);
        saveRecipesToStorage();
    }
}

function openRecipeEditor(index = -1) {
    editingRecipeIndex = index;
    const modalTitle = document.getElementById("recipeEditorTitle");
    const nameInput = document.getElementById("recipeName");
    const folderSelect = document.getElementById("recipeFolderSelect");
    const ingContainer = document.getElementById("ingredientsContainer");
    const stepContainer = document.getElementById("stepsContainer");

    ingContainer.innerHTML = "";
    stepContainer.innerHTML = "";

    if (index === -1) {
        modalTitle.innerText = "Nový recept";
        nameInput.value = "";
        if(folderSelect) folderSelect.value = currentRecipeFolder;
        addIngredientRow();
        addStepRow();
    } else {
        const r = recipes[index];
        modalTitle.innerText = "Upravit recept";
        nameInput.value = r.name;
        if(folderSelect) folderSelect.value = r.folder || "Obecné";
        r.ingredients.forEach(ing => addIngredientRow(ing.amount, ing.unit, ing.item));
        if (r.ingredients.length === 0) addIngredientRow();
        r.steps.forEach(step => addStepRow(step));
        if (r.steps.length === 0) addStepRow();
    }

    const modal = new bootstrap.Modal(document.getElementById('recipeEditorModal'));
    modal.show();
}

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

function addStepRow(text = "") {
    const container = document.getElementById("stepsContainer");
    const div = document.createElement("div");
    div.className = "d-flex gap-2 align-items-start";
    div.innerHTML = `
        <span class="text-secondary mt-1">•</span>
        <textarea class="form-control bg-dark text-light border-secondary step-text" rows="2" placeholder="Popis kroku...">${text}</textarea>
        <button class="btn btn-sm btn-outline-danger mt-1" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(div);
}

function saveRecipe() {
    const name = document.getElementById("recipeName").value.trim();
    const folderSelect = document.getElementById("recipeFolderSelect");
    const folder = folderSelect ? folderSelect.value : "Obecné";

    if (!name) { alert("Recept musí mít název!"); return; }

    const ingredients = [];
    document.querySelectorAll("#ingredientsContainer .input-group").forEach(row => {
        const amount = row.querySelector(".ing-amount").value.trim();
        const unit = row.querySelector(".ing-unit").value;
        const item = row.querySelector(".ing-item").value.trim();
        if (item) ingredients.push({ amount, unit, item });
    });

    const steps = [];
    document.querySelectorAll("#stepsContainer .step-text").forEach(area => {
        if (area.value.trim()) steps.push(area.value.trim());
    });

    const recipeObj = { name, folder, ingredients, steps };

    if (editingRecipeIndex === -1) {
        recipes.push(recipeObj);
    } else {
        recipes[editingRecipeIndex] = recipeObj;
    }

    currentRecipeFolder = folder;
    saveRecipesToStorage();

    const modalEl = document.getElementById('recipeEditorModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    modalInstance.hide();
}

function exportRecipePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const name = document.getElementById("recipeName").value || "Recept";
    doc.setFontSize(22);
    doc.text(name, 10, 20);
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
            y += (splitText.length * 7) + 3;
        }
    });
    doc.save(`${name}.pdf`);
}

document.addEventListener("DOMContentLoaded", loadRecipes);
document.addEventListener("darkdash-reload", loadRecipes);