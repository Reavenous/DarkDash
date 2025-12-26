document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("fire-trail-canvas");
    const ctx = canvas.getContext("2d");
    const dot = document.getElementById("cursor-dot");

    let mouseX = 0;
    let mouseY = 0;
    let trailParticles = [];

    // Nastavení plátna na celou obrazovku
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Sledování pohybu myši
    window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Tečka se hýbe přesně
        dot.style.left = mouseX + "px";
        dot.style.top = mouseY + "px";

        // Vytvoříme částice
        for (let i = 0; i < 3; i++) {
            createParticle(mouseX, mouseY);
        }
    });

    // Definice částice
    function createParticle(x, y) {
        // Načteme aktuální barvu tématu
        const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-glow').trim() || "#fff";

        const particle = {
            x: x + (Math.random() - 0.5) * 5, 
            y: y + (Math.random() - 0.5) * 5, 
            vx: (Math.random() - 0.5) * 1.5,  
            vy: (Math.random() - 1) * 2,     
            size: Math.random() * 8 + 4,      
            life: 1,                           
            decay: Math.random() * 0.03 + 0.015, 
            color: themeColor                 
        };
        trailParticles.push(particle);
    }

    // Hlavní animační smyčka
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // --- ZMĚNA: ODSTRANĚNO "lighter" ---
        // ctx.globalCompositeOperation = "lighter";  <-- TOTO ZPŮSOBOVALO BÍLOU
        // Místo toho necháme defaultní vykreslování (source-over)

        for (let i = 0; i < trailParticles.length; i++) {
            let p = trailParticles[i];

            // Pohyb
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.02; 
            p.size *= 0.97; 
            p.life -= p.decay; 

            if (p.life > 0 && p.size > 0.1) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

                // Barva drží stále stejný odstín, mění se jen průhlednost
                ctx.fillStyle = p.color;
                
                // Záře je fajn, ale pokud ji chceš taky méně intenzivní, 
                // můžeš snížit násobič p.size * 1.5 na třeba p.size * 0.5
                ctx.shadowBlur = p.size; 
                ctx.shadowColor = p.color;

                // Nastavíme průhlednost celého kontextu podle života částice
                ctx.globalAlpha = p.life * 0.6; // 0.6 zajistí, že to nebude tak "tvrdé"

                ctx.fill();
                
                // Reset alpha pro další částice (důležité!)
                ctx.globalAlpha = 1.0; 

            } else {
                trailParticles.splice(i, 1);
                i--;
            }
        }
        
        ctx.shadowBlur = 0; 
        requestAnimationFrame(animate);
    }

    animate();

    // KLIKNUTÍ (Výbuch v barvě tématu)
    window.addEventListener("mousedown", () => {
        // Znovu načteme barvu, aby byla aktuální i při kliku
        const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-glow').trim() || "#fff";

        for (let i = 0; i < 30; i++) {
            const p = {
                x: mouseX,
                y: mouseY,
                vx: (Math.random() - 0.5) * 8, 
                vy: (Math.random() - 0.5) * 8, 
                size: Math.random() * 5 + 2,
                life: 1,
                decay: 0.02,
                color: themeColor // --- ZMĚNA: Použije barvu tématu, ne bílou ---
            };
            trailParticles.push(p);
        }
    });
});