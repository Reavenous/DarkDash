// js/transport.js

// 1. ZDE VLOŽ SVŮJ KLÍČ (Mezi uvozovky)
const GOLEMIO_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDQyNCwiaWF0IjoxNzY2MzU4NDkwLCJleHAiOjExNzY2MzU4NDkwLCJpc3MiOiJnb2xlbWlvIiwianRpIjoiYTcxNDA1MWUtNTNkYS00ZGQxLWI5MzctNTFjNzVhYWFjMmIxIn0.m8cXebjnmhVu4j846ApWUS6oX-ASMQuo-g3AEu8Z0bA'; 

async function findDeparturesWidget() {
    const input = document.getElementById('portalStopInput');
    const stopName = input.value.trim();
    const list = document.getElementById('portalDeparturesList');
    const status = document.getElementById('portalStatus');

    // 1. Validace vstupu
    if (!stopName) {
        status.innerText = "Napiš název zastávky!";
        return;
    }

    // 2. Indikace načítání
    status.innerText = "Volám Golema...";
    list.innerHTML = `<div class="text-center text-warning py-3"><div class="spinner-border spinner-border-sm"></div> Hledám...</div>`;

    try {
        // Volání API
        const response = await fetch(`https://api.golemio.cz/v2/pid/departureboards?names=${encodeURIComponent(stopName)}&limit=6`, {
            headers: { 'X-Access-Token': GOLEMIO_API_KEY }
        });

        // --- SPECIÁLNÍ OŠETŘENÍ CHYB (Tady to padalo) ---
        
        // Pokud API vrátí 404, znamená to, že název zastávky v databázi vůbec není
        if (response.status === 404) {
            list.innerHTML = '<div class="text-center text-danger py-2">Zastávka neexistuje.<br><small class="text-muted">Zkus přesnější název (např. "Karlovo náměstí").</small></div>';
            status.innerText = "Nenalezeno (404)";
            return;
        }

        // Jiná chyba (např. 401 špatný klíč, 500 chyba serveru)
        if (!response.ok) {
            throw new Error(`Chyba serveru: ${response.status}`);
        }

        const data = await response.json();
        list.innerHTML = ""; // Vyčistit

        // --- POKUD JE ODPOVĚĎ PRÁZDNÁ (Palmovka případ) ---
        if (!data.features || data.features.length === 0) {
            list.innerHTML = `
                <div class="text-center text-warning py-2">
                    Žádné spoje nenalezeny.
                    <br><small class="text-muted">Zkus specifikovat "Metro Palmovka" nebo "Palmovka".</small>
                </div>`;
            status.innerText = "Bez dat";
            return;
        }

        // Název nalezené zastávky
        status.innerText = data.features[0].properties.stop_name;

        // Vykreslení spojů
        data.features.forEach(ride => {
            try {
                const prop = ride.properties;
                const line = prop.route.short_name || "?";
                const headsign = prop.trip.headsign || "Neznámý směr";
                
                // Čas
                const arrivalTime = new Date(prop.stop_sequence.arrival_timestamp || prop.stop_sequence.departure_timestamp);
                const minutes = Math.floor((arrivalTime - new Date()) / 60000);

                if (minutes < 0) return; // Už odjelo

                // Zpoždění
                const delayMin = Math.floor((prop.stop_sequence.delay_seconds || 0) / 60);
                let delayHtml = `<span class="text-success small opacity-75">Včas</span>`;
                if (delayMin > 0) delayHtml = `<span class="text-danger small fw-bold">+${delayMin} min</span>`;

                // Barvy linek
                let lineClass = "bg-secondary text-white"; 
                if (line === "A") lineClass = "bg-success text-white";
                if (line === "B") lineClass = "bg-warning text-dark";
                if (line === "C") lineClass = "bg-danger text-white";
                
                const html = `
                    <div class="d-flex justify-content-between align-items-center p-2 border-bottom border-secondary bg-black bg-opacity-25">
                        <div class="d-flex align-items-center gap-3">
                            <div class="d-flex justify-content-center align-items-center fw-bold rounded shadow-sm ${lineClass}" style="width: 40px; height: 30px;">
                                ${line}
                            </div>
                            <div class="text-truncate" style="max-width: 150px;">
                                <div class="fw-bold text-light small">${headsign}</div>
                            </div>
                        </div>
                        <div class="text-end">
                            <div class="fs-5 fw-bold text-warning font-monospace">${minutes}'</div>
                            <div class="lh-1">${delayHtml}</div>
                        </div>
                    </div>
                `;
                list.insertAdjacentHTML('beforeend', html);
            } catch (err) {
                console.warn("Chyba řádku:", err);
            }
        });

    } catch (error) {
        console.error("HLAVNÍ CHYBA:", error);
        list.innerHTML = `<div class="text-center text-danger py-2">Chyba: ${error.message}</div>`;
        status.innerText = "Chyba";
    }
}

// Enter listener
const inputEl = document.getElementById('portalStopInput');
if (inputEl) {
    inputEl.addEventListener("keypress", (e) => {
        if (e.key === "Enter") findDeparturesWidget();
    });
}
async function loadAirQuality() {
    const aqIndexEl = document.getElementById('airQualityIndex');
    const aqTextEl = document.getElementById('airQualityText');
    const stationsEl = document.getElementById('airStationsCount');
    const updateEl = document.getElementById('airLastUpdate');

    // Reset UI
    aqIndexEl.innerText = "--";
    aqTextEl.innerText = "Nasávám vzorky...";
    aqTextEl.className = "brand-font text-muted mb-3"; // Reset barev

    try {
        // Stáhneme data o všech stanicích
        const response = await fetch('https://api.golemio.cz/v2/airquality/stations', {
            headers: {
                'X-Access-Token': GOLEMIO_API_KEY // Použije ten stejný klíč jako na dopravu
            }
        });

        if (!response.ok) throw new Error("Senzory neodpovídají.");

        const data = await response.json();
        
        // Spočítáme průměrný index ze všech stanic, které mají data
        let totalIndex = 0;
        let count = 0;

        data.features.forEach(station => {
            // Hledáme index kvality (aq_index) v datech stanice
            const measurement = station.properties.measurement;
            if (measurement && measurement.AQ_index) {
                totalIndex += measurement.AQ_index;
                count++;
            }
        });

        if (count === 0) {
            aqTextEl.innerText = "Žádná data ze senzorů.";
            return;
        }

        // Výpočet průměru (zaokrouhleno)
        const avgIndex = Math.round(totalIndex / count);

        // --- VYHODNOCENÍ STAVU (Gothic Style) ---
        let statusText = "";
        let colorClass = "";
        let iconColor = "";

        switch (avgIndex) {
            case 1:
                statusText = "Vzduch čistý jako krystal.";
                colorClass = "text-info"; // Světle modrá
                iconColor = "#0dcaf0";
                break;
            case 2:
                statusText = "Přijatelné podmínky.";
                colorClass = "text-success"; // Zelená
                iconColor = "#198754";
                break;
            case 3:
                statusText = "Mírné znečištění.";
                colorClass = "text-warning"; // Žlutá
                iconColor = "#ffc107";
                break;
            case 4:
                statusText = "Zhoršená jakost. Nasaď masku.";
                colorClass = "text-danger"; // Oranžová/Červená
                iconColor = "#dc3545";
                break;
            case 5:
            case 6:
                statusText = "TOXICKÁ HROZBA. Zůstaň v úkrytu.";
                colorClass = "text-danger fw-bold"; // Rudá
                iconColor = "#8b0000";
                break;
            default:
                statusText = "Neznámý stav atmosféry.";
                colorClass = "text-muted";
        }

        // Vykreslení
        aqIndexEl.innerText = avgIndex;
        aqIndexEl.className = `display-1 fw-bold mb-0 brand-font ${colorClass}`;
        aqIndexEl.style.textShadow = `0 0 20px ${iconColor}`;
        
        aqTextEl.innerText = statusText;
        aqTextEl.className = `brand-font mb-3 ${colorClass}`;
        
        stationsEl.innerText = count; // Počet aktivních stanic
        
        const now = new Date();
        updateEl.innerText = now.getHours() + ":" + String(now.getMinutes()).padStart(2, '0');

    } catch (error) {
        console.error(error);
        aqTextEl.innerText = "Chyba spojení se senzory.";
    }
}

const airTab = document.getElementById('pills-air-tab');
if (airTab) {
    airTab.addEventListener('shown.bs.tab', function (event) {
        loadAirQuality(); // Spustí se vždy, když uživatel přepne na Ovzduší
    });
}
// 1. FUNKCE PRO PARKOVÁNÍ (P+R)
async function loadParking() {
    const list = document.getElementById('parkingList');
    list.innerHTML = '<div class="text-warning"><i class="fas fa-spinner fa-spin"></i> Zjišťuji kapacity stájí...</div>';

    try {
        const response = await fetch('https://api.golemio.cz/v2/parking/pr', {
            headers: { 'X-Access-Token': GOLEMIO_API_KEY }
        });
        const data = await response.json();

        list.innerHTML = ""; // Vyčistit

        // Seřadíme podle názvu
        const parks = data.features.sort((a, b) => a.properties.name.localeCompare(b.properties.name));

        parks.forEach(park => {
            const p = park.properties;
            const total = p.total_num_of_places;
            const free = p.num_of_free_places;
            const percent = Math.round((free / total) * 100);

            // Barva podle obsazenosti (Zelená = hodně místa, Červená = plno)
            let color = "bg-success";
            if (percent < 50) color = "bg-warning";
            if (percent < 10) color = "bg-danger";

            const html = `
                <div class="p-2 border-bottom border-secondary bg-black bg-opacity-25 text-start">
                    <div class="d-flex justify-content-between mb-1">
                        <strong class="text-light">${p.name}</strong>
                        <span class="small ${percent < 10 ? 'text-danger fw-bold' : 'text-muted'}">${free} / ${total} míst</span>
                    </div>
                    <div class="progress" style="height: 6px; background: #333;">
                        <div class="progress-bar ${color}" role="progressbar" style="width: ${percent}%"></div>
                    </div>
                </div>
            `;
            list.insertAdjacentHTML('beforeend', html);
        });

    } catch (err) {
        console.error(err);
        list.innerHTML = '<div class="text-danger">Chyba načítání parkovišť.</div>';
    }
}

// POMOCNÁ FUNKCE: Získání polohy uživatele
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject("Prohlížeč neumí GPS.");
        } else {
            navigator.geolocation.getCurrentPosition(
                (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
                () => reject("Nepodařilo se získat polohu. Povol GPS.")
            );
        }
    });
}

// 2. FUNKCE PRO KOLA (V okolí)
async function loadBikes() {
    const list = document.getElementById('bikesList');
    list.innerHTML = '<div class="text-primary"><i class="fas fa-spinner fa-spin"></i> Hledám oře v okolí...</div>';

    try {
        // Nejdřív získáme GPS
        const coords = await getUserLocation();
        
        // Fetch kol v okruhu 500m
        const response = await fetch(`https://api.golemio.cz/v2/sharedbikes?lat=${coords.lat}&lng=${coords.lng}&range=500&limit=10`, {
            headers: { 'X-Access-Token': GOLEMIO_API_KEY }
        });
        const data = await response.json();

        list.innerHTML = "";

        if (data.features.length === 0) {
            list.innerHTML = '<div class="text-muted">Žádná kola v dohledu (500m). Jdi pěšky.</div>';
            return;
        }

        data.features.forEach(bike => {
            const p = bike.properties;
            // Výpočet vzdálenosti (zjednodušený) - Golemio to někdy vrací, ale ne vždy
            // Zobrazíme typ kola a společnost
            const company = p.company_name || "Neznámý";
            
            const html = `
                <div class="d-flex justify-content-between align-items-center p-2 border-bottom border-secondary">
                    <div>
                        <i class="fas fa-bicycle text-primary me-2"></i>
                        <span class="text-light">${company}</span>
                    </div>
                    <small class="text-success">Volné</small>
                </div>
            `;
            list.insertAdjacentHTML('beforeend', html);
        });

    } catch (err) {
        console.error(err);
        list.innerHTML = `<div class="text-danger">Chyba: ${err}. (Povol polohu!)</div>`;
    }
}

// 3. FUNKCE PRO ODPAD (V okolí)
async function loadWaste() {
    const list = document.getElementById('wasteList');
    list.innerHTML = '<div class="text-success"><i class="fas fa-spinner fa-spin"></i> Čichám odpad...</div>';

    try {
        const coords = await getUserLocation();
        
        // Fetch kontejnerů v okruhu 300m
        const response = await fetch(`https://api.golemio.cz/v2/waste/containers?lat=${coords.lat}&lng=${coords.lng}&range=300&limit=10`, {
            headers: { 'X-Access-Token': GOLEMIO_API_KEY }
        });
        const data = await response.json();

        list.innerHTML = "";

        if (data.features.length === 0) {
            list.innerHTML = '<div class="text-muted">Žádné kontejnery v okolí (300m).</div>';
            return;
        }

        data.features.forEach(container => {
            const p = container.properties;
            const address = p.address?.street_name || "Neznámá ulice";
            
            // Typ odpadu (přeložíme do češtiny)
            let type = "Odpad";
            let color = "text-muted";
            
            // Golemio vrací různé ID, zjednodušíme to podle názvu materiálu v datech
            // (Data jsou složitá, vypíšeme adresu a typ)
            if (p.trash_type?.description) {
                type = p.trash_type.description;
            }

            // Obarvení podle typu
            if (type.toLowerCase().includes("sklo")) color = "text-success"; // Zelená
            if (type.toLowerCase().includes("papír")) color = "text-primary"; // Modrá
            if (type.toLowerCase().includes("plast")) color = "text-warning"; // Žlutá

            const html = `
                <div class="d-flex justify-content-between p-2 border-bottom border-secondary bg-black bg-opacity-25">
                    <div class="text-truncate">
                        <i class="fas fa-trash-alt me-2 ${color}"></i>
                        <span class="text-light">${address}</span>
                    </div>
                    <small class="${color}">${type}</small>
                </div>
            `;
            list.insertAdjacentHTML('beforeend', html);
        });

    } catch (err) {
        console.error(err);
        list.innerHTML = `<div class="text-danger">Chyba: ${err}</div>`;
    }
}

// POSLUCHAČE PRO AUTOMATICKÉ NAČTENÍ PŘI PŘEPNUTÍ ZÁLOŽKY
document.addEventListener('DOMContentLoaded', () => {
    // Parkování
    const parkingTab = document.getElementById('pills-parking-tab');
    if (parkingTab) parkingTab.addEventListener('shown.bs.tab', loadParking);
    
    // Pro kola a odpad raději nespouštíme auto-load, protože to chce GPS povolení
    // Necháme to na kliknutí tlačítka uvnitř záložky.
});