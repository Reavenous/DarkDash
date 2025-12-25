// js/tarot.js

const TAROT_DECK = [
    { 
        name: "Blázen", 
        icon: '<img src="assets/icons/tarot_the_fool.png" class="tarot-icon-img" alt="Blázen">', 
        desc: "Nové začátky, nevinnost, spontánnost. Neboj se riskovat." 
    },
    { 
        name: "Mág", 
        icon: '<img src="assets/icons/tarot_the_magician.png" class="tarot-icon-img" alt="Mág">', 
        desc: "Moc, dovednost, soustředění. Máš vše, co potřebuješ." 
    },
    { 
        name: "Velekněžka", 
        icon: '<img src="assets/icons/tarot_the_high_priestess.png" class="tarot-icon-img" alt="Velekněžka">', 
        desc: "Intuice, tajemství, podvědomí. Naslouchej svému vnitřnímu hlasu." 
    },
    { 
        name: "Císařovna", 
        icon: '<img src="assets/icons/tarot_the_empress.png" class="tarot-icon-img" alt="Císařovna">', 
        desc: "Plodnost, příroda, hojnost. Tvoř a pečuj." 
    },
    { 
        name: "Císař", 
        icon: '<img src="assets/icons/tarot_the_emperor.png" class="tarot-icon-img" alt="Císař">', 
        desc: "Autorita, struktura, kontrola. Zaveď řád do chaosu." 
    },
    { 
        name: "Velekněz", 
        icon: '<img src="assets/icons/tarot_the_hierophant.png" class="tarot-icon-img" alt="Velekněz">', 
        desc: "Tradice, víra, učení. Hledej moudrost u starších." 
    },
    { 
        name: "Milenci", 
        icon: '<img src="assets/icons/tarot_the_lovers.png" class="tarot-icon-img" alt="Milenci">', 
        desc: "Láska, harmonie, volba. Rozhoduj se srdcem." 
    },
    { 
        name: "Vůz", 
        icon: '<img src="assets/icons/tarot_the_chariot.png" class="tarot-icon-img" alt="Vůz">', 
        desc: "Vůle, vítězství, směr. Jdi si tvrdě za svým cílem." 
    },
    { 
        name: "Síla", 
        icon: '<img src="assets/icons/tarot_strength.png" class="tarot-icon-img" alt="Síla">', 
        desc: "Odvaha, trpělivost, soucit. Ovládni své vnitřní zvíře." 
    },
    { 
        name: "Poustevník", 
        icon: '<img src="assets/icons/tarot_the_hermit.png" class="tarot-icon-img" alt="Poustevník">', 
        desc: "Samota, hledání, introspekce. Najdi odpovědi v tichu." 
    },
    { 
        name: "Kolo Štěstěny", 
        icon: '<img src="assets/icons/tarot_wheel_of_fortune.png" class="tarot-icon-img" alt="Kolo Štěstěny">', 
        desc: "Osud, změna cyklů. Vše se mění, buď připraven." 
    },
    { 
        name: "Spravedlnost", 
        icon: '<img src="assets/icons/tarot_justice.png" class="tarot-icon-img" alt="Spravedlnost">', 
        desc: "Pravda, zákon, příčina a následek. Buď upřímný k sobě." 
    },
    { 
        name: "Viselec", 
        icon: '<img src="assets/icons/tarot_the_hanged_man.png" class="tarot-icon-img" alt="Viselec">', 
        desc: "Oběť, nový pohled, čekání. Změň perspektivu." 
    },
    { 
        name: "Smrt", 
        icon: '<img src="assets/icons/tarot_death.png" class="tarot-icon-img" alt="Smrt">', 
        desc: "Konec, transformace, nový začátek. Něco musí odejít." 
    },
    { 
        name: "Mírnost", 
        icon: '<img src="assets/icons/tarot_temperance.png" class="tarot-icon-img" alt="Mírnost">', 
        desc: "Rovnováha, trpělivost, účel. Všeho s mírou." 
    },
    { 
        name: "Ďábel", 
        icon: '<img src="assets/icons/tarot_the_devil.png" class="tarot-icon-img" alt="Ďábel">', 
        desc: "Závislost, materialismus, pouta. Osvoboď se od svých stínů." 
    },
    { 
        name: "Věž", 
        icon: '<img src="assets/icons/tarot_the_tower.png" class="tarot-icon-img" alt="Věž">', 
        desc: "Náhlá změna, chaos, zjevení. Základy se hroutí pro nové stavby." 
    },
    { 
        name: "Hvězda", 
        icon: '<img src="assets/icons/tarot_the_star.png" class="tarot-icon-img" alt="Hvězda">', 
        desc: "Naděje, inspirace, klid. Věř v lepší zítřky." 
    },
    { 
        name: "Měsíc", 
        icon: '<img src="assets/icons/tarot_the_moon.png" class="tarot-icon-img" alt="Měsíc">', 
        desc: "Iluze, strach, podvědomí. Ne vše je takové, jak se zdá." 
    },
    { 
        name: "Slunce", 
        icon: '<img src="assets/icons/tarot_the_sun.png" class="tarot-icon-img" alt="Slunce">', 
        desc: "Radost, úspěch, vitalita. Užívej si světla a tepla." 
    },
    { 
        name: "Soud", 
        icon: '<img src="assets/icons/tarot_judgement.png" class="tarot-icon-img" alt="Soud">', 
        desc: "Znovuzrození, volání, odpuštění. Čas zúčtování." 
    },
    { 
        name: "Svět", 
        icon: '<img src="assets/icons/tarot_the_world.png" class="tarot-icon-img" alt="Svět">', 
        desc: "Dokončení, integrace, cestování. Kruh se uzavírá." 
    }
];

let canFlip = true;

function drawTarotCard(cardElement) {
    if (!canFlip) return; // Aby nešlo zběsile klikat
    canFlip = false;

    const inner = document.getElementById("tarotCardInner");
    const iconEl = document.getElementById("tarotIcon");
    const nameEl = document.getElementById("tarotName");
    const descEl = document.getElementById("tarotDesc");

    // 1. Vybrat náhodnou kartu
    const randomCard = TAROT_DECK[Math.floor(Math.random() * TAROT_DECK.length)];

    // 2. Otočit kartu (přidat styl rotate)
    inner.style.transform = "rotateY(180deg)";

    // 3. Počkat na polovinu animace a změnit obsah (aby to nebylo vidět hned)
    setTimeout(() => {
        iconEl.innerHTML = randomCard.icon; // Používáme innerHTML pro vložení <img>
        nameEl.innerText = randomCard.name;
        descEl.innerText = randomCard.desc;
    }, 200);

    // 4. Resetovat po zavření modalu (aby příště byla zase otočená rubem)
    const modalEl = document.getElementById('tarotModal');
    
    // Použijeme 'once: true' aby se listener nespustil víckrát
    modalEl.addEventListener('hidden.bs.modal', () => {
        inner.style.transform = "rotateY(0deg)";
        canFlip = true;
        // Vyčistit obsah
        setTimeout(() => {
            iconEl.innerHTML = "?";
            nameEl.innerText = "...";
            descEl.innerText = "...";
        }, 500);
    }, { once: true });
}