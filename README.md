# 🌑 DarkDash

> *Protože nudné to-do listy nikdo nechce používat.*

**DarkDash** je osobní produktivní dashboard s temnou, gotickou a RPG atmosférou — open source passion project vytvořený výhradně pro sebe, ze záliby v programování a game designu.

[![MIT License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Firebase](https://img.shields.io/badge/Firebase-Hosting-orange?logo=firebase)](https://darkdash-d846e.web.app)
[![PWA](https://img.shields.io/badge/PWA-Ready-blue?logo=googlechrome)](https://darkdash-d846e.web.app)
[![Live Demo](https://img.shields.io/badge/Live-Demo-darkred)](https://darkdash-d846e.web.app)

---

## ✨ Co to je?

Klasické aplikace jako Notion nebo Todoist jsou funkční, ale chladné. DarkDash řeší produktivitu jinak — každý splněný úkol přináší **XP body**, každý level-up se oslaví notifikací a celé prostředí se přizpůsobuje tvé náladě pomocí **tematických atmosfér** s odpovídající hudbou, fonty a barvami.

```
Splnil jsi misi → +50 XP → Level up → Rank: Rytíř noci 🗡️
```

---

## 🖥️ Live demo

**[darkdash-d846e.web.app](https://darkdash-d846e.web.app)**

---

## 📦 Moduly

| Modul | Soubor | Popis |
|---|---|---|
| ⚔️ Quest Log | `todo.js` | Úkoly se vzácnostmi (common → legendary), složky, deadline |
| 📓 Deník | `journal.js` | Záznamy s výběrem nálady, markdown |
| 📅 Kalendář | `calendar.js` | Plánování událostí s časem |
| 💪 Fitness | `fitness.js` | Tracker tréninků, grafy, statistiky |
| 🍳 Kuchařka | `cookbook.js` | Správa receptů s kategoriemi |
| 📝 Poznámky | `notes.js` | Markdown editor, export PDF, složky |
| 🌙 Sny | `dream.js` | Záznamy snů, Watchlist, Gamelist |
| ⏳ Odpočty | `countdown.js` | Odpočet do důležitých událostí |
| 🍅 Pomodoro | `pomodoro.js` | Časovač s audio signálem |
| 🎨 Atmosféry | `themes.js` | Témata, hudební přehrávač, fonty |
| ⚡ Gamifikace | `gamification.js` | XP, levely, ranky, achievementy |
| 💻 Terminál | `terminal.js` | Skrytý hacker terminál (klávesa `T`) |
| 🔧 Sekce | `sections.js` | Správa viditelnosti widgetů |

---

## 🎭 Atmosféry

Každá atmosféra mění pozadí, barvy, font a spustí vlastní playlist:

| Atmosféra | Barva | Font |
|---|---|---|
| 🏰 Gothic Castle | Fialová | Cinzel |
| 🤖 Cyberpunk City | Neonová zelená | Rajdhani |
| 🐉 Skyrim | Zlatá | MedievalSharp |
| ⚔️ The Witcher | Červená | Cinzel Decorative |
| 🌊 Celtic Highlands | Smaragdová | IM Fell English SC |
| 🗡️ Berserk | Zlatá vs. tma | Pirata One |
| 🪖 World of Tanks | Army green | Black Ops One |
| 🤠 Wild West | Západ slunce | Rye |
| 🔴 HROT | Rezavá ocel | Share Tech Mono |
| ⚔️ Kingdom Come | Zlatohnědá | MedievalSharp |
| 🌑 Padislavovo Doporučení | Karmínová | Abril Fatface |
| …a další | | |

---

## 🛠️ Použité technologie

- **HTML5 / CSS3 / JavaScript (ES6+)** — bez frameworků, čistý vanilla JS
- **Bootstrap 5.1** — responzivní layout
- **Firebase Auth** — přihlášení emailem nebo přes Google
- **Firebase Firestore** — cloudová synchronizace dat
- **Firebase Hosting** — nasazení (CDN, HTTPS)
- **Chart.js** — grafy ve fitness modulu
- **jsPDF** — export poznámek do PDF
- **marked.js** — Markdown rendering
- **PWA / Service Worker** — offline podpora, instalovatelnost

---

## 🚀 Jak spustit lokálně

### Požadavky
- Libovolný HTTP server (Live Server, Python, Node...)
- Vlastní Firebase projekt (nebo použij existující konfiguraci pro čtení)

### Postup

```bash
# 1. Klonuj repozitář
git clone https://github.com/Reavenous/DarkDash.git
cd DarkDash

# 2. Spusť lokální server
python -m http.server 5500
# nebo použij Live Server ve VS Code

# 3. Otevři v prohlížeči
# http://localhost:5500/index.html
```

> **Bez Firebase konfigurace** aplikace funguje offline v localStorage módu — data se ukládají lokálně do prohlížeče.

---

## ☁️ Nasazení na Firebase Hosting

```bash
# 1. Nainstaluj Firebase CLI
npm install -g firebase-tools

# 2. Přihlas se
firebase login

# 3. Inicializuj projekt (jen poprvé)
firebase init hosting

# 4. Nasaď
firebase deploy
```

### Firestore Security Rules

Pro cloudovou synchronizaci nastav tato pravidla ve Firebase Console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /appData/{document} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    match /messages/{msg} {
      allow read, write: if request.auth != null;
    }
    match /private_messages/{msg} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 💻 Hacker Terminál

Stiskni `T` kdekoliv na stránce a otevře se skrytý terminál:

```
agent@darkdash:~# /help

  /todo [text]              — Přidat misi do Quest Logu
  /note [text]              — Rychlý záznam do Deníku
  /calendar [datum] [název] — Přidat událost
  /timer [minuty]           — Spustit odpočítávač
  /theme [id]               — Přepnout atmosféru
  /music play|next|prev     — Ovládat přehrávač
  /ls todos|notes|events    — Vypsat záznamy
  /xp                       — Zobrazit XP a level
  /neofetch                 — System info
  /matrix                   — 👀
  /hack                     — 👀
  /clear                    — Vymazat historii
  /exit                     — Zavřít terminál
```

---

## 📁 Struktura projektu

```
DarkDash/
├── index.html          # Hlavní stránka (vše v jednom HTML)
├── css/
│   ├── style.css       # Hlavní styly + CSS proměnné pro témata
│   ├── games.css       # Styly pro mini-hry
│   └── terminal.css    # CRT styl terminálu
├── js/
│   ├── firebase-init.js  # Auth + Firestore sync
│   ├── main.js           # Hodiny, datum, citáty
│   ├── themes.js         # Atmosféry + hudební přehrávač
│   ├── gamification.js   # XP, levely, achievementy
│   ├── todo.js           # Quest Log
│   ├── notes.js          # Poznámky
│   ├── calendar.js       # Kalendář
│   ├── journal.js        # Deník
│   ├── fitness.js        # Fitness tracker
│   ├── dream.js          # Sny + Watchlist + Gamelist
│   ├── cookbook.js       # Kuchařka
│   ├── countdown.js      # Odpočty
│   ├── pomodoro.js       # Pomodoro časovač
│   ├── terminal.js       # Hacker terminál
│   ├── sections.js       # Viditelnost sekcí
│   ├── sound.js          # Zvukové efekty
│   ├── cursor.js         # Animovaný kurzor
│   └── notification.js   # Notifikace
├── assets/
│   ├── audio/            # Hudební soubory pro atmosféry
│   └── icons/            # Ikony
├── manifest.json         # PWA manifest
└── sw.js                 # Service Worker
```

---

## 🔗 Repozitáře

| Platform | URL |
|---|---|
| GitHub | https://github.com/Reavenous/DarkDash |
| Codeberg | https://codeberg.com/Padislav/DarkDash |

---

## 📄 Licence

Distribuováno pod licencí **MIT** — kód je dobrovolně dán k dispozici komunitě.  
Dělej s ním co chceš, jen zachovej autorské prohlášení.

```
Copyright (c) 2026 Alexandre Basseville
```

---

## 👤 Autor

**Alexandre Basseville**  
Projekt vytvořen jako osobní passion project — výhradně ze záliby v programování, game designu a dark estetice.

---

<div align="center">
  <sub>Built in the dark, for the dark. 🌑</sub>
</div>