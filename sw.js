// sw.js - Service Worker pro DarkDash (Full Offline Version)
const CACHE_NAME = 'darkdash-v1'; 
const ASSETS = [
  // --- ZÁKLAD ---
  './',
  './index.html',
  './manifest.json',

  // --- STYLY ---
  './css/style.css',
  './css/games.css',

  // --- DATA ---
  './data/wisdom.json',

  // --- JAVASCRIPT ---
  './js/calendar.js',
  './js/cookbook.js',
  './js/countdown.js',
  './js/dream.js',
  './js/fitness.js',
  './js/games.js',
  './js/generator.js',
  './js/icons.js',
  './js/journal.js',
  './js/links.js',
  './js/main.js',
  './js/news.js',
  './js/notes.js',
  './js/pomodoro.js',
  './js/themes.js',
  './js/todo.js',
  './js/weather.js',
  './js/world.js',
  './js/notification.js',
  './js/firebase-init.js',
  './js/gamification.js',
  './js/tarot.js',
  './js/cursor.js',


  // --- IKONY (assets/icons/) ---
  './assets/icons/aquarius.png',
  './assets/icons/aries.png',
  './assets/icons/calendar.png',
  './assets/icons/cancer.png',
  './assets/icons/capricorn.png',
  './assets/icons/cloudy.png',
  './assets/icons/cookbook.png',
  './assets/icons/countdown.png',
  './assets/icons/couvajiciMesic.png',
  './assets/icons/couvajiciSrpek.png',
  './assets/icons/delete.png',
  './assets/icons/diary.png',
  './assets/icons/diet.png',
  './assets/icons/dorustajiciMesic.png',
  './assets/icons/dorustajiciSrpek.png',
  './assets/icons/dreams.png',
  './assets/icons/edit.png',
  './assets/icons/fit-calisthenics.png',
  './assets/icons/fit-cardio.png',
  './assets/icons/fit-energy.png',
  './assets/icons/fitness.png',
  './assets/icons/fit-sport.png',
  './assets/icons/fit-strength.png',
  './assets/icons/gemini.png',
  './assets/icons/generator.png',
  './assets/icons/challenge-active.png',
  './assets/icons/challenge-done.png',
  './assets/icons/chart.png',
  './assets/icons/check-off.png',
  './assets/icons/check-on.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/ingredients.png',
  './assets/icons/leo.png',
  './assets/icons/libra.png',
  './assets/icons/links.png',
  './assets/icons/mood-bad.png',
  './assets/icons/mood-good.png',
  './assets/icons/music.png',
  './assets/icons/mute.png',
  './assets/icons/next.png',
  './assets/icons/notes.png',
  './assets/icons/nov.png',
  './assets/icons/pause.png',
  './assets/icons/pdf.png',
  './assets/icons/pisces.png',
  './assets/icons/play.png',
  './assets/icons/posledniCtvrt.png',
  './assets/icons/prev.png',
  './assets/icons/prvniCtvrt.png',
  './assets/icons/rain.png',
  './assets/icons/restart.png',
  './assets/icons/sagitarius.png',
  './assets/icons/save.png',
  './assets/icons/scorpio.png',
  './assets/icons/snow.png',
  './assets/icons/steps.png',
  './assets/icons/sunny.png',
  './assets/icons/taurus.png',
  './assets/icons/themes.png',
  './assets/icons/thunder.png',
  './assets/icons/timer.png',
  './assets/icons/todo.png',
  './assets/icons/tools.png',
  './assets/icons/uplnek.png',
  './assets/icons/virgo.png',
  './assets/icons/volume.png',
  './assets/icons/notification.png',
  './assets/icons/tarot.png',
  './assets/icons/tarot_death.png',
  './assets/icons/tarot_fool.png',
  './assets/icons/tarot_the_magician.png',
  './assets/icons/tarot_the_lovers.png',
  './assets/icons/tarot_the_devil.png',
  './assets/icons/tarot_the_tower.png',
  './assets/icons/tarot_the_high_priestess.png',
  './assets/icons/tarot_the_empress.png',
  './assets/icons/tarot_the_emperor.png',
  './assets/icons/tarot_the_hierophant.png',
  './assets/icons/tarot_the_chariot.png',
  './assets/icons/tarot_strength.png',
  './assets/icons/tarot_the_hermit.png',
  './assets/icons/tarot_wheel_of_fortune.png',
  './assets/icons/tarot_justice.png',
  './assets/icons/tarot_the_hanged_man.png',
  './assets/icons/tarot_temperance.png',
  './assets/icons/tarot_the_star.png',
  './assets/icons/tarot_the_moon.png',
  './assets/icons/tarot_the_sun.png',
  './assets/icons/tarot_judgement.png',
  './assets/icons/tarot_the_world.png',
  './assets/icons/tarot_background.png',


  

  // --- HUDBA (assets/audio/) ---
  './assets/audio/_SteelForHumans.mp3',
  './assets/audio/A Drop of Nelson\'s Blood (2012).mp3',
  './assets/audio/Beautiful Fantasy Music - Tree of Wonder [fQq6rZeTo-M].mp3',
  './assets/audio/Blod Besvimelse - Misanthrop (Remastered).mp3',
  './assets/audio/Campfire.mp3',
  './assets/audio/clonemarch.mp3',
  './assets/audio/Dorian Concept - \'Hide (CS01 Version)\' (Official Video).mp3',
  './assets/audio/Dorian Concept - Space II (Official Video).mp3',
  './assets/audio/Duel of the Fates.mp3',
  './assets/audio/Eerin Siinaa.mp3',
  './assets/audio/Echoing Woods [MChf-Ojdk7I].mp3',
  './assets/audio/Embers Tale.mp3',
  './assets/audio/kratze.mp3',
  './assets/audio/L Harmonica.mp3',
  './assets/audio/Metro Exodus - In The House In A Heartbeat.mp3',
  './assets/audio/Pon Pon Shit.mp3',
  './assets/audio/Premonition.mp3',
  './assets/audio/Pure pagan hatred.mp3',
  './assets/audio/Race Against Fate.mp3',
  './assets/audio/Samwise the Brave.mp3',
  './assets/audio/Scarborough fair.mp3',
  './assets/audio/Secunda.mp3',
  './assets/audio/SilverForMonsters.mp3',
  './assets/audio/Song of Durin (Complete Edition) - Clamavi De Profundis.mp3',
  './assets/audio/Star of the County Down.mp3',
  './assets/audio/stayathouse.mp3',
  './assets/audio/STXSTN - LITSAR PEKLA (feat. snxff).mp3',
  './assets/audio/TES V Skyrim Soundtrack - Far Horizons.mp3',
  './assets/audio/TES V Skyrim Soundtrack - From Past to Present.mp3',
  './assets/audio/The High Kings, Rocky Road to Dublin.mp3',
  './assets/audio/The Rebel Path (Cyberpunk 2077 Soundtrack).mp3',
  './assets/audio/The Rumjacks - An Irish Pub Song (Official Music Video).mp3',
  './assets/audio/The Shire.mp3',
  './assets/audio/The Singing Woods [26vbyf_AFsc].mp3',
  './assets/audio/The Trail.mp3',
  './assets/audio/You and Me and the Devil Makes Three.mp3'
];

// Instalace Service Workeru (Ukládání do paměti)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching complete DarkDash assets...');
      return cache.addAll(ASSETS);
    })
  );
});

// Aktivace (Vyčištění staré verze)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Získávání dat (Offline first)
self.addEventListener('fetch', (event) => {
  // Ignorujeme externí API a CDN (ty offline nepojedou)
  if (!event.request.url.startsWith(location.origin)) {
      return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});