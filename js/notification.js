// --- INTELIGENTNÍ NOTIFIKAČNÍ SYSTÉM ---

const NotificationSystem = {
    // Pomocná funkce pro zobrazení bubliny
    show: function(title, message, icon = '🔔', actionBtnText = null, actionCallback = null) {
        // 1. Nastavíme texty
        document.getElementById('toastTitle').innerText = title;
        document.getElementById('toastMessage').innerText = message;
        document.getElementById('toastIcon').innerText = icon;

        // 2. Nastavíme tlačítko (pokud nějaké je)
        const btnContainer = document.getElementById('toastActionContainer');
        const btn = document.getElementById('toastBtn');
        
        if (actionBtnText && actionCallback) {
            btn.innerText = actionBtnText;
            btn.onclick = () => {
                actionCallback();
                bootstrap.Toast.getInstance(document.getElementById('systemToast')).hide();
            };
            btnContainer.classList.remove('d-none');
        } else {
            btnContainer.classList.add('d-none');
        }

        // 3. Zobrazíme Toast
        const toastEl = document.getElementById('systemToast');
        const toast = new bootstrap.Toast(toastEl, { delay: 6000 }); // Zmizí za 6s
        toast.show();
    },

    // HLAVNÍ FUNKCE: Rozhodne, co zobrazit
    checkStatus: function() {
        const hour = new Date().getHours();
        const today = new Date().toLocaleDateString('cs-CZ');
        
        // --- 1. DATA (Načteme, co víme) ---
        // ZKONTROLUJ SI NÁZVY KLÍČŮ V LOCALSTORAGE, JESTLI SEDÍ!
        const fitnessData = JSON.parse(localStorage.getItem('darkdash-fitness')) || [];
        const journalData = JSON.parse(localStorage.getItem('darkdash-journal')) || {}; // Pokud je deník objekt
        const todos = JSON.parse(localStorage.getItem('darkdash-todos')) || [];
        
        // Zjistíme stavy
        const cvicilDnes = fitnessData.some(z => z.date === today);
        const napsalDenik = journalData[today] ? true : false; // Záleží, jak ukládáš deník
        const pocetUkolu = todos.filter(t => !t.completed).length;

        // --- 2. LOGIKA PRIORIT (Co je nejdůležitější?) ---
        
        // A) VEČER (po 20:00) - Priorita: DENÍK
        if (hour >= 20 && !napsalDenik) {
            this.show(
                "Deník zeje prázdnotou", 
                "Den končí. Zaznamenej své činy, než se rozplynou v temnotě.",
                "📖",
                "Otevřít Deník",
                () => { 
                    const modal = new bootstrap.Modal(document.getElementById('journalCalendarModal'));
                    modal.show();
                }
            );
            return; // Důležité: 'return' zajistí, že se ukáže jen tahle jedna věc a konec.
        }

        // B) KDYKOLIV - Priorita: CVIČENÍ (Pokud není hotovo)
        if (!cvicilDnes) {
            this.show(
                "Tělo chřadne", 
                "Dnes jsi ještě neposílil svou schránku. Bolest je dočasná, sláva věčná.",
                "💪",
                "Jdu cvičit",
                () => { 
                    const modal = new bootstrap.Modal(document.getElementById('fitnessModal'));
                    modal.show();
                }
            );
            return;
        }

        // C) RÁNO/DOPOLEDNE (do 12:00) - Priorita: ÚKOLY
        if (hour < 12 && pocetUkolu > 0) {
            this.show(
                "Povinnosti volají", 
                `Máš před sebou ${pocetUkolu} nesplněných úkolů. Pusť se do práce.`,
                "📝",
                "Zobrazit Úkoly",
                () => { 
                    const modal = new bootstrap.Modal(document.getElementById('todoModal'));
                    modal.show();
                }
            );
            return;
        }

        // D) POKUD JE VŠE HOTOVO (Odměna)
        if (cvicilDnes && pocetUkolu === 0) {
            this.show(
                "Dokonalost", 
                "Všechny úkoly splněny, tělo posíleno. Jsi pánem svého osudu.",
                "👑"
            );
            return;
        }
    }
};

// Spustit kontrolu 2 vteřiny po načtení stránky (aby se stihlo vše vykreslit)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        NotificationSystem.checkStatus();
    }, 2000);
});