let todos = [];

function loadTodos() {
    // POUŽITÍ UNIKÁTNÍHO KLÍČE
    const key = window.getAppKey("darkdash-todos");
    const stored = localStorage.getItem(key);
    
    if (stored) todos = JSON.parse(stored);
    else todos = []; // Reset pro nového uživatele
    
    renderTodos();
}

function saveTodos() {
    const key = window.getAppKey("darkdash-todos");
    localStorage.setItem(key, JSON.stringify(todos));
    
    // CLOUD SAVE
    if (window.saveToCloud) window.saveToCloud('todos', todos);

    renderTodos();
}

function addTodo() {
    const input = document.getElementById("todoInput");
    const prioritySelect = document.getElementById("todoPriority");
    const deadlineInput = document.getElementById("todoDeadline");
    
    const text = input.value.trim();
    const priority = prioritySelect.value;
    const deadline = deadlineInput.value;

    if (!text) return;

    todos.unshift({
        text: text,
        priority: priority,
        deadline: deadline,
        completed: false,
        id: Date.now()
    });

    input.value = "";
    deadlineInput.value = "";
    saveTodos();
}

function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
    }
    if (todo.completed) {
        // Zvuk cinknutí?
        window.addXP(20, "Splněný úkol"); // <--- PŘIDAT
    }
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
}

function renderTodos() {
    const list = document.getElementById("todoList");
    const emptyState = document.getElementById("todoEmptyState");
    const progressBar = document.getElementById("todoProgressBar");
    const progressText = document.getElementById("todoProgressText");

    if(!list) return; // Ochrana kdyby modal nebyl v DOM

    list.innerHTML = "";

    const priorityOrder = { "critical": 0, "important": 1, "normal": 2 };
    
    todos.sort((a, b) => {
        if (a.completed === b.completed) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.completed ? 1 : -1;
    });

    if (todos.length === 0) {
        if(emptyState) emptyState.style.display = "block";
    } else {
        if(emptyState) emptyState.style.display = "none";
        
        todos.forEach(todo => {
            const li = document.createElement("li");
            li.className = `list-group-item bg-transparent text-light border-bottom border-secondary py-3 d-flex align-items-center justify-content-between todo-item priority-${todo.priority} ${todo.completed ? 'completed' : ''}`;
            
            let dateHtml = "";
            if (todo.deadline) {
                const d = new Date(todo.deadline);
                const dateStr = `${d.getDate()}. ${d.getMonth() + 1}.`;
                dateHtml = `<span class="badge bg-secondary ms-2 small font-monospace d-inline-flex align-items-center">${ICONS.misc.calendarSmall} ${dateStr}</span>`;
            }

            const checkIcon = todo.completed ? ICONS.misc.checkOn : ICONS.misc.checkOff;

            li.innerHTML = `
                <div class="d-flex align-items-center gap-3 w-100" style="cursor: pointer;" onclick="toggleTodo(${todo.id})">
                    <div class="check-icon-wrapper">${checkIcon}</div>
                    <div class="flex-grow-1">
                        <span class="fs-5 align-middle">${todo.text}</span>
                        ${dateHtml}
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-danger ms-2 border-0" onclick="deleteTodo(${todo.id})">${ICONS.actions.delete}</button>
            `;
            list.appendChild(li);
        });
    }

    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    if(progressBar) {
        progressBar.style.width = `${percent}%`;
        progressText.innerText = `${percent}% hotovo`;
        
        if(percent < 30) progressBar.className = "progress-bar bg-danger";
        else if(percent < 70) progressBar.className = "progress-bar bg-warning";
        else progressBar.className = "progress-bar bg-success";
    }
}

document.addEventListener("DOMContentLoaded", loadTodos);
// REAKCE NA ZMĚNU UŽIVATELE
document.addEventListener("darkdash-reload", loadTodos);