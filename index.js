const { createBot } = require('./leaveRejoin.js');
const fs = require('fs');

if (!fs.existsSync('./settings.json')) {
    console.log("settings.json not found");
    process.exit(1);
}

const settings = JSON.parse(fs.readFileSync('./settings.json'));
createBot(settings);
