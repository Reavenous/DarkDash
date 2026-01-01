// js/sounds.js

const SFX = {
    click: new Audio('assets/audio/sfx/click.mp3'),
    success: new Audio('assets/audio/sfx/success.mp3'),
    error: new Audio('assets/audio/sfx/error.mp3'),
    levelup: new Audio('assets/audio/sfx/levelup.mp3'),
    chest: new Audio('assets/audio/sfx/chest_open.mp3'),
    magic: new Audio('assets/audio/sfx/magic.mp3')
};

// Nastavení hlasitosti efektů (tišší než hudba)
Object.values(SFX).forEach(sound => sound.volume = 0.4);

window.playSound = function(name) {
    if (SFX[name]) {
        SFX[name].currentTime = 0; // Reset, aby šlo klikat rychle
        SFX[name].play().catch(e => console.log("Audio play blocked", e));
    }
};

// --- AUTOMATICKÉ PŘIPOJENÍ NA TLAČÍTKA ---
document.addEventListener('DOMContentLoaded', () => {
    // Všem tlačítkům přidáme "click" zvuk
    const buttons = document.querySelectorAll('button, .btn, .nav-link, .list-group-item');
    
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            // Volitelné: Zvuk při najetí myší (hover)
            // playSound('hover'); 
        });
        
        btn.addEventListener('click', () => {
            playSound('click');
        });
    });
});