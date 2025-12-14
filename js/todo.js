let todos = [];

function loadTodos() {
    const stored = localStorage.getItem("darkdash-todos");
    if (stored) todos = JSON.parse(stored);
    renderTodos();
}

function saveTodos() {
    localStorage.setItem("darkdash-todos", JSON.stringify(todos));
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

    list.innerHTML = "";

    const priorityOrder = { "critical": 0, "important": 1, "normal": 2 };
    
    todos.sort((a, b) => {
        if (a.completed === b.completed) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.completed ? 1 : -1;
    });

    if (todos.length === 0) {
        emptyState.style.display = "block";
    } else {
        emptyState.style.display = "none";
        
        todos.forEach(todo => {
            const li = document.createElement("li");
            li.className = `list-group-item bg-transparent text-light border-bottom border-secondary py-3 d-flex align-items-center justify-content-between todo-item priority-${todo.priority} ${todo.completed ? 'completed' : ''}`;
            
            // Datum s ikonkou
            let dateHtml = "";
            if (todo.deadline) {
                const d = new Date(todo.deadline);
                const dateStr = `${d.getDate()}. ${d.getMonth() + 1}.`;
                // ICONS.misc.calendarSmall
                dateHtml = `<span class="badge bg-secondary ms-2 small font-monospace d-inline-flex align-items-center">${ICONS.misc.calendarSmall} ${dateStr}</span>`;
            }

            // Checkbox obrázky
            const checkIcon = todo.completed ? ICONS.misc.checkOn : ICONS.misc.checkOff;

            li.innerHTML = `
                <div class="d-flex align-items-center gap-3 w-100" style="cursor: pointer;" onclick="toggleTodo(${todo.id})">
                    <div class="check-icon-wrapper">
                        ${checkIcon}
                    </div>
                    <div class="flex-grow-1">
                        <span class="fs-5 align-middle">${todo.text}</span>
                        ${dateHtml}
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-danger ms-2 border-0" onclick="deleteTodo(${todo.id})">
                    ${ICONS.actions.delete}
                </button>
            `;
            list.appendChild(li);
        });
    }

    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    progressBar.style.width = `${percent}%`;
    progressText.innerText = `${percent}% hotovo`;
    
    if(percent < 30) progressBar.className = "progress-bar bg-danger";
    else if(percent < 70) progressBar.className = "progress-bar bg-warning";
    else progressBar.className = "progress-bar bg-success";
}

document.addEventListener("DOMContentLoaded", loadTodos);