const apiKey = "99ef89cbbae2ea890aef408a73500367"; 
let forecastData = []; // Zde si uložíme data

function getWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                fetchCurrentWeather(lat, lon);
                fetchForecast(lat, lon);
            },
            () => {
                const cityEl = document.getElementById("currentCity");
                if(cityEl) cityEl.innerText = "Lokace nedostupná";
            }
        );
    }
}

// 1. AKTUÁLNÍ POČASÍ
function fetchCurrentWeather(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=cz&appid=${apiKey}`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            const temp = Math.round(data.main.temp);
            const desc = data.weather[0].description;
            
            // Získání obrázku
            const iconPath = getWeatherIconPath(data.weather[0].main);
            const iconHtml = `<img src="${iconPath}" class="icon-hud" alt="${desc}">`;
            
            document.getElementById("currentTemp").innerText = `${temp}°C`;
            document.getElementById("currentDesc").innerText = desc;
            document.getElementById("currentCity").innerText = data.name;
            document.getElementById("weatherIconDisplay").innerHTML = iconHtml; 
        })
        .catch(err => console.error("Chyba počasí:", err));
}

// 2. PŘEDPOVĚĎ (5 dní / 3 hodiny)
function fetchForecast(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=cz&appid=${apiKey}`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            forecastData = data.list;
            renderDailyForecast(); // Defaultně zobrazíme "Dnes"
        })
        .catch(err => console.error("Chyba předpovědi:", err));
}

// --- PŘEPÍNÁNÍ TABŮ ---
function showWeatherTab(tab) {
    const btnDaily = document.getElementById("btnDaily");
    const btnWeekly = document.getElementById("btnWeekly");

    if (tab === 'daily') {
        btnDaily.classList.add("active");
        btnWeekly.classList.remove("active");
        renderDailyForecast();
    } else {
        btnDaily.classList.remove("active");
        btnWeekly.classList.add("active");
        renderWeeklyForecast();
    }
}

// Render: Dnes (příštích 5 záznamů po 3 hodinách)
function renderDailyForecast() {
    const container = document.getElementById("forecastContainer");
    if(!container) return;
    container.innerHTML = "";

    // Vezmeme prvních 5 záznamů z budoucnosti
    const nextHours = forecastData.slice(0, 5);

    nextHours.forEach(item => {
        const time = item.dt_txt.split(" ")[1].substring(0, 5); // 15:00
        const temp = Math.round(item.main.temp);
        
        // OPRAVA: Použijeme správnou funkci a vložíme img tag
        const iconPath = getWeatherIconPath(item.weather[0].main);
        
        container.innerHTML += `
            <div class="card bg-black bg-opacity-25 border-secondary p-2 text-center" style="min-width: 80px;">
                <div class="small text-muted">${time}</div>
                <div class="my-1">
                    <img src="${iconPath}" class="icon-btn" alt="Ikonka" style="width: 24px; height: 24px;">
                </div>
                <div class="fw-bold">${temp}°</div>
            </div>
        `;
    });
}

// Render: Týden (filtrujeme záznamy kolem 12:00 pro každý den)
function renderWeeklyForecast() {
    const container = document.getElementById("forecastContainer");
    if(!container) return;
    container.innerHTML = "";

    // Filtrujeme jen záznamy, které obsahují "12:00:00"
    const dailyItems = forecastData.filter(item => item.dt_txt.includes("12:00:00"));

    dailyItems.forEach(item => {
        const dateObj = new Date(item.dt_txt);
        const dayName = dateObj.toLocaleDateString('cs-CZ', { weekday: 'short' }); // Po, Út
        const temp = Math.round(item.main.temp);
        
        // OPRAVA: Použijeme správnou funkci a vložíme img tag
        const iconPath = getWeatherIconPath(item.weather[0].main);

        container.innerHTML += `
            <div class="card bg-black bg-opacity-25 border-secondary p-2 text-center" style="min-width: 80px;">
                <div class="small text-muted">${dayName}</div>
                <div class="my-1">
                    <img src="${iconPath}" class="icon-btn" alt="Ikonka" style="width: 24px; height: 24px;">
                </div>
                <div class="fw-bold">${temp}°</div>
            </div>
        `;
    });
}

// Pomocná: Cesta k ikoně podle počasí (z icons.js)
function getWeatherIconPath(main) {
    const type = main.toLowerCase();
    
    // Předpokládáme, že ICONS objekt je načtený z icons.js
    if (typeof ICONS === 'undefined') return 'assets/icons/cloudy.png'; // Fallback

    if (type.includes('cloud')) return ICONS.weather.clouds;
    if (type.includes('rain') || type.includes('drizzle')) return ICONS.weather.rain;
    if (type.includes('clear')) return ICONS.weather.clear;
    if (type.includes('snow')) return ICONS.weather.snow;
    if (type.includes('thunder')) return ICONS.weather.thunder;
    
    return ICONS.weather.default;
}

// Start
getWeather();