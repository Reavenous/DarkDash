let todos = [];
let todoFolders = ["Inbox", "Škola", "Osobní", "DarkDash"];
let currentTodoFolder = "Inbox";

// Hodnoty XP pro gamifikaci
const rarityXP = {
    "common": 10,
    "rare": 25,
    "epic": 50,
    "legendary": 100
};

// Barvy a styly pro Notion-style kartičky
const rarityStyles = {
    "common": { color: "#adb5bd", bg: "rgba(173, 181, 189, 0.1)", border: "#495057", label: "Běžná" },
    "rare": { color: "#0dcaf0", bg: "rgba(13, 202, 240, 0.1)", border: "#0dcaf0", label: "Vzácná" },
    "epic": { color: "#d63384", bg: "rgba(214, 51, 132, 0.1)", border: "#d63384", label: "Epická" },
    "legendary": { color: "#ffc107", bg: "rgba(255, 193, 7, 0.1)", border: "#ffc107", label: "Legendární", shadow: "0 0 10px rgba(255,193,7,0.5)" }
};

function loadTodos() {
    const tKey = window.getAppKey ? window.getAppKey("darkdash-todos") : "darkdash-todos";
    const storedT = localStorage.getItem(tKey);
    
    if (storedT) {
        todos = JSON.parse(storedT);
        // Migrace starých úkolů na nový RPG formát
        todos = todos.map(t => {
            if (!t.folder) t.folder = "Inbox";
            if (t.priority === "normal") t.rarity = "common";
            else if (t.priority === "important") t.rarity = "rare";
            else if (t.priority === "critical") t.rarity = "epic";
            else if (!t.rarity) t.rarity = "common";
            return t;
        });
    } else {
        todos = []; 
    }

    const fKey = window.getAppKey ? window.getAppKey("darkdash-todo-folders") : "darkdash-todo-folders";
    const storedF = localStorage.getItem(fKey);
    if (storedF) {
        todoFolders = JSON.parse(storedF);
    }
    if (!todoFolders.includes("Inbox")) todoFolders.unshift("Inbox");

    renderTodoUI();
}

function saveTodos() {
    const tKey = window.getAppKey ? window.getAppKey("darkdash-todos") : "darkdash-todos";
    localStorage.setItem(tKey, JSON.stringify(todos));
    if (window.saveToCloud) window.saveToCloud('todos', todos);

    const fKey = window.getAppKey ? window.getAppKey("darkdash-todo-folders") : "darkdash-todo-folders";
    localStorage.setItem(fKey, JSON.stringify(todoFolders));
    if (window.saveToCloud) window.saveToCloud('todo-folders', todoFolders);

    renderTodoUI();
}

function renderTodoUI() {
    renderTodoFoldersSidebar();
    renderTodosGrid();
    updateTodoProgress();
}

function renderTodoFoldersSidebar() {
    const list = document.getElementById("todoFolderTreeList");
    if (!list) return;
    list.innerHTML = "";

    todoFolders.forEach(folderName => {
        const a = document.createElement("a");
        a.href = "#";
        a.className = `list-group-item list-group-item-action bg-transparent text-light border-0 py-2 px-3 ${folderName === currentTodoFolder ? 'fw-bold text-success' : ''}`;
        
        if (folderName === currentTodoFolder) {
            a.style.backgroundColor = "rgba(25, 135, 84, 0.1)"; 
            a.style.borderLeft = "3px solid #198754";
        } else {
            a.style.borderLeft = "3px solid transparent";
            a.style.opacity = "0.7";
        }

        a.innerHTML = `<i class="bi bi-journal-check me-2"></i>${folderName}`;
        a.onclick = (e) => {
            e.preventDefault();
            currentTodoFolder = folderName;
            renderTodoUI();
        };
        list.appendChild(a);
    });
}

function renderTodosGrid() {
    const list = document.getElementById("todoList");
    const title = document.getElementById("currentTodoFolderTitle");
    if(!list || !title) return;
    
    title.innerText = currentTodoFolder;
    list.innerHTML = "";

    // Filtrování a řazení (nedokončené nahoru)
    const filteredTodos = todos.filter(t => (t.folder || "Inbox") === currentTodoFolder)
                               .sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);

    if (filteredTodos.length === 0) {
        list.innerHTML = `<div class="col-12 text-muted text-center mt-5"><em>V této lince nejsou žádné aktivní mise.</em></div>`;
        return;
    }

    filteredTodos.forEach((todo) => {
        const col = document.createElement("div");
        col.className = "col-md-6 col-lg-4"; // Mřížka (3 sloupce na velkém monitoru, 2 na středním)

        const style = rarityStyles[todo.rarity] || rarityStyles["common"];
        const isDone = todo.completed;
        
        let dateHtml = "";
        if (todo.deadline) {
            const d = new Date(todo.deadline);
            dateHtml = `<div class="small mt-2" style="color: ${isDone ? '#6c757d' : '#adb5bd'}">📅 ${d.getDate()}. ${d.getMonth() + 1}.</div>`;
        }

        const cardStyle = isDone ? `opacity: 0.5; text-decoration: line-through; border-color: #333 !important; background: #111;` : `border-color: ${style.border} !important; background: ${style.bg}; box-shadow: ${style.shadow || 'none'};`;

        col.innerHTML = `
            <div class="card text-light h-100 position-relative" style="${cardStyle} transition: 0.3s;">
                <div class="card-body p-3 d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge text-dark" style="background-color: ${isDone ? '#6c757d' : style.color}; font-size: 0.7rem;">${style.label}</span>
                        <button class="btn btn-sm btn-outline-danger border-0 p-0 ms-2" onclick="deleteTodo(${todo.id})" title="Smazat misi">×</button>
                    </div>
                    
                    <h6 class="card-title mb-auto ${isDone ? 'text-muted' : ''}">${todo.text}</h6>
                    ${dateHtml}
                    
                    <div class="mt-3">
                        <button class="btn btn-sm w-100 ${isDone ? 'btn-secondary' : 'btn-success'}" onclick="toggleTodo(${todo.id})">
                            ${isDone ? 'Obnovit misi' : '✓ Splnit'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        list.appendChild(col);
    });
}

function updateTodoProgress() {
    const progressBar = document.getElementById("todoProgressBar");
    const progressText = document.getElementById("todoProgressText");
    if(!progressBar || !progressText) return;

    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    progressBar.style.width = `${percent}%`;
    progressText.innerText = `${percent}% misí hotovo`;
    
    if(percent < 30) progressBar.className = "progress-bar bg-danger";
    else if(percent < 70) progressBar.className = "progress-bar bg-warning";
    else progressBar.className = "progress-bar bg-success";
}

function createNewTodoFolder() {
    const folderName = prompt("Zadej název nové Quest Linky:");
    if (folderName && folderName.trim() !== "") {
        const cleanName = folderName.trim();
        if (!todoFolders.includes(cleanName)) {
            todoFolders.push(cleanName);
            currentTodoFolder = cleanName; 
            saveTodos();
        } else {
            alert("Tato linka už existuje!");
        }
    }
}

function openTodoEditor() {
    const input = document.getElementById("todoInput");
    const raritySelect = document.getElementById("todoRarity");
    const deadlineInput = document.getElementById("todoDeadline");
    const folderSelect = document.getElementById("todoFolderSelect");

    input.value = "";
    deadlineInput.value = "";
    raritySelect.value = "common";
    
    // Naplnění roletky složkami
    if (folderSelect) {
        folderSelect.innerHTML = "";
        todoFolders.forEach(f => {
            const opt = document.createElement("option");
            opt.value = f;
            opt.innerText = f;
            folderSelect.appendChild(opt);
        });
        folderSelect.value = currentTodoFolder;
    }

    const modal = new bootstrap.Modal(document.getElementById('todoEditorModal'));
    modal.show();
}

function saveTodo() {
    const text = document.getElementById("todoInput").value.trim();
    const rarity = document.getElementById("todoRarity").value;
    const deadline = document.getElementById("todoDeadline").value;
    const folderSelect = document.getElementById("todoFolderSelect");
    const folder = folderSelect ? folderSelect.value : "Inbox";

    if (!text) {
        alert("Mise musí mít název!");
        return;
    }

    todos.unshift({
        text: text,
        rarity: rarity,
        folder: folder,
        deadline: deadline,
        completed: false,
        id: Date.now()
    });

    currentTodoFolder = folder;
    saveTodos();

    const modalEl = document.getElementById('todoEditorModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    modalInstance.hide();
}

function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        
        if (todo.completed) {
            if (window.playSound) window.playSound('success');
            const xpGained = rarityXP[todo.rarity] || 10;
            if (window.addXP) window.addXP(xpGained, `Splněna mise: ${todo.text}`);
        }
    }
}

function deleteTodo(id) {
    if(confirm("Opravdu chceš tuto misi zrušit?")) {
        todos = todos.filter(t => t.id !== id);
        saveTodos();
    }
}

document.addEventListener("DOMContentLoaded", loadTodos);
document.addEventListener("darkdash-reload", loadTodos);