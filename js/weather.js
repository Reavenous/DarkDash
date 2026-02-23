const apiKey = "99ef89cbbae2ea890aef408a73500367"; 
let forecastData = []; 

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
                if(cityEl) cityEl.innerText = "Lokace neznámá";
            }
        );
    }
}

// NOVÁ FUNKCE: Překladač počasí do "DarkDash" stylu
function getDarkWeatherDescription(mainType, origDesc) {
    const type = mainType.toLowerCase();
    
    if (type.includes('clear')) return "Zrádný svit";
    if (type.includes('cloud')) return "Zastřená nebesa";
    if (type.includes('rain') || type.includes('drizzle')) return "Plačící nebesa";
    if (type.includes('thunder')) return "Hněv bohů";
    if (type.includes('snow')) return "Mrazivá pustina";
    if (type === 'mist' || type === 'fog' || type === 'haze') return "Ideální pro plížení";
    if (type === 'tornado' || type === 'squall') return "Blíží se zkáza!";
    
    // Pokud je to něco nečekaného, vrátí to původní český popis
    return origDesc;
}

// 1. AKTUÁLNÍ POČASÍ
function fetchCurrentWeather(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=cz&appid=${apiKey}`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            const temp = Math.round(data.main.temp);
            const mainType = data.weather[0].main; // Např. "Clouds"
            const origDesc = data.weather[0].description; // Např. "zataženo"
            
            // Aplikujeme náš temný filtr!
            const darkDesc = getDarkWeatherDescription(mainType, origDesc);
            
            const iconPath = getWeatherIconPath(mainType);
            const iconHtml = `<img src="${iconPath}" class="icon-hud" alt="${darkDesc}">`;
            
            document.getElementById("currentTemp").innerText = `${temp}°C`;
            // Tady vypisujeme náš nový název
            document.getElementById("currentDesc").innerText = darkDesc;
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
            renderDailyForecast(); 
        })
        .catch(err => console.error("Chyba předpovědi:", err));
}

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

function renderDailyForecast() {
    const container = document.getElementById("forecastContainer");
    if(!container) return;
    container.innerHTML = "";

    const nextHours = forecastData.slice(0, 5);

    nextHours.forEach(item => {
        const time = item.dt_txt.split(" ")[1].substring(0, 5); 
        const temp = Math.round(item.main.temp);
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

function renderWeeklyForecast() {
    const container = document.getElementById("forecastContainer");
    if(!container) return;
    container.innerHTML = "";

    const dailyItems = forecastData.filter(item => item.dt_txt.includes("12:00:00"));

    dailyItems.forEach(item => {
        const dateObj = new Date(item.dt_txt);
        const dayName = dateObj.toLocaleDateString('cs-CZ', { weekday: 'short' }); 
        const temp = Math.round(item.main.temp);
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

function getWeatherIconPath(main) {
    const type = main.toLowerCase();
    if (typeof ICONS === 'undefined') return 'assets/icons/cloudy.png'; 

    if (type.includes('cloud')) return ICONS.weather.clouds;
    if (type.includes('rain') || type.includes('drizzle')) return ICONS.weather.rain;
    if (type.includes('clear')) return ICONS.weather.clear;
    if (type.includes('snow')) return ICONS.weather.snow;
    if (type.includes('thunder')) return ICONS.weather.thunder;
    
    return ICONS.weather.default;
}

getWeather();