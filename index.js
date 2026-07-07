const fs = require('fs');

if (!fs.existsSync('./settings.json')) {
    console.error("settings.json not found!");
    process.exit(1);
}

// Forzamos la carga limpia del archivo principal usando la ruta exacta
const { createBot } = require('./leaveRejoin.js');
const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf8'));

console.log("Iniciando Slobot00 en Aternos...");
createBot(settings);
