const fs = require('fs');
const { createBot } = require('./src/bot.js');

if (!fs.existsSync('./setting.json')) {
    console.error('Error: setting.json file not found!');
    process.exit(1);
}

const settings = JSON.parse(fs.readFileSync('./setting.json', 'utf-8'));
createBot(settings);
