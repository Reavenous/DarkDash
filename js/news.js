// --- ZDROJE RSS ---
const RSS_TO_JSON_API = "https://api.rss2json.com/v1/api.json?rss_url=";

const feeds = {
    tech: "https://www.theverge.com/rss/index.xml", 
    world: "http://feeds.bbci.co.uk/news/world/rss.xml", 
    science: "https://www.sciencedaily.com/rss/top/science.xml" 
};

let currentFeed = 'tech';

// Načíst zprávy hned po startu
document.addEventListener("DOMContentLoaded", () => {
    loadNews(currentFeed);
});

function loadNews(category) {
    currentFeed = category;
    const container = document.getElementById("newsContainer");
    
    // Update tlačítek (hledáme v novém containeru #newsSourceButtons)
    document.querySelectorAll('#newsSourceButtons button').forEach(btn => {
        if(btn.innerText.toLowerCase().includes(category === 'world' ? 'svět' : category)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    container.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-info"></div></div>`;

    const url = RSS_TO_JSON_API + encodeURIComponent(feeds[category]);

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if(data.status === 'ok') {
                renderNews(data.items);
            } else {
                container.innerHTML = `<p class="text-center text-danger py-4">Chyba signálu. Zkus to později.</p>`;
            }
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = `<p class="text-center text-danger py-4">Spojení ztraceno.</p>`;
        });
}

function renderNews(items) {
    const container = document.getElementById("newsContainer");
    container.innerHTML = "";

    items.forEach(item => {
        const date = new Date(item.pubDate).toLocaleDateString('cs-CZ');
        
        const imageHtml = item.thumbnail ? 
            `<div class="col-3"><img src="${item.thumbnail}" class="img-fluid rounded border border-secondary" style="object-fit: cover; height: 80px; width: 100%;"></div>` : '';

        const card = document.createElement("div");
        card.className = "p-3 border-bottom border-secondary bg-transparent hover-bg-dark"; // Jednodušší styl pro seznam
        
        card.innerHTML = `
            <div class="row g-0 align-items-center">
                ${imageHtml}
                <div class="${item.thumbnail ? 'col-9 ps-3' : 'col-12'}">
                    <h6 class="mb-1">
                        <a href="${item.link}" target="_blank" class="text-decoration-none text-info link-hover fw-bold">${item.title}</a>
                    </h6>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">${date}</small>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function stripTags(html) {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}