let links = [];

function loadLinks() {
    const key = window.getAppKey("darkdash-links");
    const stored = localStorage.getItem(key);
    if (stored) links = JSON.parse(stored);
    else links = []; // Reset
    renderLinks();
}

function saveLinks() {
    const key = window.getAppKey("darkdash-links");
    localStorage.setItem(key, JSON.stringify(links));
    
    // CLOUD SAVE
    if (window.saveToCloud) window.saveToCloud('links', links);
    
    renderLinks();
}

function addLink() {
    const nameInput = document.getElementById("linkName");
    const urlInput = document.getElementById("linkUrl");
    
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();

    if (!name || !url) { alert("Vyplň název i URL."); return; }
    if (!url.startsWith('http://') && !url.startsWith('https://')) { url = 'https://' + url; }

    links.push({ name, url });
    
    nameInput.value = "";
    urlInput.value = "";
    saveLinks();
}

function deleteLink(index) {
    if(confirm("Odstranit tento odkaz?")) {
        links.splice(index, 1);
        saveLinks();
    }
}

function renderLinks() {
    const container = document.getElementById("linksContainer");
    if(!container) return;
    container.innerHTML = "";

    if (links.length === 0) {
        container.innerHTML = '<p class="text-center text-muted w-100">Zatím žádné odkazy.</p>';
        return;
    }

    links.forEach((link, index) => {
        const card = document.createElement("div");
        card.className = "link-card p-3 border border-secondary rounded bg-black bg-opacity-25 text-center position-relative";
        card.style.width = "150px";
        
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${link.url}&sz=64`;

        card.innerHTML = `
            <button class="btn btn-sm btn-outline-danger border-0 position-absolute top-0 end-0 m-1 p-0" style="width: 20px; height: 20px; line-height: 1;" onclick="deleteLink(${index})">×</button>
            <a href="${link.url}" target="_blank" class="text-decoration-none text-light d-block mt-2">
                <img src="${faviconUrl}" alt="icon" class="mb-2" style="width: 32px; height: 32px; border-radius: 4px;">
                <div class="text-truncate small fw-bold">${link.name}</div>
            </a>
        `;
        container.appendChild(card);
    });
}

document.addEventListener("DOMContentLoaded", loadLinks);
document.addEventListener("darkdash-reload", loadLinks);