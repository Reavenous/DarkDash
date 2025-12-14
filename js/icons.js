const ICONS = {
    // ... (Předchozí definice tlačítek, počasí, měsíce atd. zůstávají) ...
    
    // --- TLAČÍTKA (Pravý panel) ---
    fitness:   `<img src="assets/icons/fitness.png" class="icon-btn" alt="Fitness">`,
    todo:      `<img src="assets/icons/todo.png" class="icon-btn" alt="Úkoly">`,
    journal:   `<img src="assets/icons/diary.png" class="icon-btn" alt="Deník">`,
    cookbook:  `<img src="assets/icons/cookbook.png" class="icon-btn" alt="Kuchařka">`,
    notes:     `<img src="assets/icons/notes.png" class="icon-btn" alt="Poznámky">`,
    calendar:  `<img src="assets/icons/calendar.png" class="icon-btn" alt="Kalendář">`,
    pomodoro:  `<img src="assets/icons/timer.png" class="icon-btn" alt="Časovač">`,
    countdown: `<img src="assets/icons/countdown.png" class="icon-btn" alt="Odpočet">`,
    dreams:    `<img src="assets/icons/dreams.png" class="icon-btn" alt="Sny">`,
    links:     `<img src="assets/icons/links.png" class="icon-btn" alt="Odkazy">`,

    // --- AKČNÍ TLAČÍTKA ---
    actions: {
        edit:   `<img src="assets/icons/edit.png" style="width: 16px; height: 16px;">`,
        delete: `<img src="assets/icons/delete.png" style="width: 16px; height: 16px;">`,
        save:   `<img src="assets/icons/save.png" style="width: 18px; height: 18px; margin-right: 5px;">`,
        pdf:    `<img src="assets/icons/pdf.png" style="width: 18px; height: 18px; margin-right: 5px;">`
    },

    // --- FITNESS IKONY (NOVÉ) ---
    fit: {
        strength:    `<img src="assets/icons/fit-strength.png" style="width: 40px; height: 40px;">`,
        cardio:      `<img src="assets/icons/fit-cardio.png" style="width: 40px; height: 40px;">`,
        calisthenics:`<img src="assets/icons/fit-calisthenics.png" style="width: 40px; height: 40px;">`,
        sport:       `<img src="assets/icons/fit-sport.png" style="width: 40px; height: 40px;">`,
        energy:      `<img src="assets/icons/fit-energy.png" style="width: 40px; height: 40px;">` // Default
    },

    // --- VÝZVY (NOVÉ) ---
    challenges: {
        active: `<img src="assets/icons/challenge-active.png" style="width: 50px; height: 50px; margin-bottom: 10px;">`,
        done:   `<img src="assets/icons/challenge-done.png" style="width: 50px; height: 50px; margin-bottom: 10px;">`
    },

    // --- RŮZNÉ ---
    misc: {
        checkOn:  `<img src="assets/icons/check-on.png" style="width: 20px; height: 20px;">`,
        checkOff: `<img src="assets/icons/check-off.png" style="width: 20px; height: 20px; opacity: 0.5;">`,
        moodGood: `<img src="assets/icons/mood-good.png" style="width: 24px; height: 24px; vertical-align: middle;">`,
        moodBad:  `<img src="assets/icons/mood-bad.png" style="width: 24px; height: 24px; vertical-align: middle;">`,
        calendarSmall: `<img src="assets/icons/calendar.png" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">`,
        ingredients: `<img src="assets/icons/ingredients.png" style="width: 20px; height: 20px; vertical-align: middle; margin-right: 5px;">`,
        steps: `<img src="assets/icons/steps.png" style="width: 20px; height: 20px; vertical-align: middle; margin-right: 5px;">`
    },

    // ... (Počasí, Měsíc, Zvěrokruh - beze změny) ...
    weather: {
        clear:   'assets/icons/sunny.png',
        clouds:  'assets/icons/cloudy.png',
        rain:    'assets/icons/rain.png',
        snow:    'assets/icons/snow.png',
        thunder: 'assets/icons/thunder.png',
        default: 'assets/icons/cloudy.png'
    },
    moon: [
        'assets/icons/nov.png',
        'assets/icons/dorustajiciSrpek.png',
        'assets/icons/prvniCtvrt.png',
        'assets/icons/dorustajiciMesic.png',
        'assets/icons/uplnek.png',
        'assets/icons/couvajiciMesic.png',
        'assets/icons/posledniCtvrt.png',
        'assets/icons/couvajiciSrpek.png'
    ],
    zodiac: {
        kozoroh:  'assets/icons/capricorn.png',
        vodnar:   'assets/icons/aquarius.png',
        ryby:     'assets/icons/pisces.png',
        beran:    'assets/icons/aries.png',
        byk:      'assets/icons/taurus.png',
        blizenci: 'assets/icons/gemini.png',
        rak:      'assets/icons/cancer.png',
        lev:      'assets/icons/leo.png',
        panna:    'assets/icons/virgo.png',
        vahy:     'assets/icons/libra.png',
        stir:     'assets/icons/scorpio.png',
        strelec:  'assets/icons/sagitarius.png'
    }
};