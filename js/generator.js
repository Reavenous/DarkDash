// js/generator.js

function generateCodes() {
    const inputText = document.getElementById('qrInput').value;
    const qrContainer = document.getElementById('qr-code-container');
    const barcodeSvg = document.getElementById('barcode-container');

    // 1. Kontrola, jestli je co kódovat
    if (!inputText || inputText.trim() === "") {
        alert("Musíš zadat nějaký text nebo URL!");
        return;
    }

    // 2. Vyčištění předchozích kódů
    qrContainer.innerHTML = ""; // Smaže starý QR kód
    barcodeSvg.innerHTML = "";  // Smaže starý čárový kód

    // --- GENERUJEME QR KÓD ---
    try {
        new QRCode(qrContainer, {
            text: inputText,
            width: 128,
            height: 128,
            colorDark : "#000000", // Černá barva kódu
            colorLight : "#ffffff", // Bílé pozadí
            correctLevel : QRCode.CorrectLevel.H // Vysoká úroveň korekce chyb
        });
    } catch (error) {
        console.error("Chyba při generování QR kódu:", error);
        qrContainer.innerHTML = "<small class='text-danger'>Chyba generování</small>";
    }

    // --- GENERUJEME ČÁROVÝ KÓD ---
    try {
        JsBarcode("#barcode-container", inputText, {
            format: "CODE128", // Nejpoužívanější formát
            lineColor: "#000000",
            background: "#ffffff",
            width: 2,
            height: 80,
            displayValue: true // Zobrazí text pod kódem
        });
    } catch (error) {
        console.error("Chyba při generování čárového kódu:", error);
        // Čárové kódy neumí všechna písmena (třeba diakritiku), tak to ošetříme
        alert("Pozor: Čárový kód nepodporuje některé speciální znaky. QR kód je v pořádku.");
    }
}