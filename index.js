"use strict";

const { addLog, getLogs } = require("./logger");
const mineflayer = require("mineflayer");
const { Movements, pathfinder, goals } = require("mineflayer-pathfinder");
const { GoalBlock } = goals;
const config = require("./settings.json");
const express = require("express");
const http = require("http");
const https = require("https");

// ============================================================\n// EXPRESS SERVER - Keep Render/Aternos alive\n// ============================================================\nconst app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;

let botState = {
  connected: false,
  lastActivity: Date.now(),
  reconnectAttempts: 0,
  startTime: Date.now(),
  errors: [],
  wasThrottled: false,
};

app.get('/', (req, res) => {
  res.send(`<h1>BraisBot24h Activo</h1><p>El bot esta funcionando en Render.</p>`);
});

app.listen(PORT, () => {
  addLog(`[System] Dashboard Express activo en puerto ${PORT}`);
});

let bot = null;
let isReconnecting = false;
let timers = [];

function clearAllIntervals() {
  timers.forEach(clearInterval);
  timers = [];
}

function scheduleReconnect() {
  if (isReconnecting) return;
  isReconnecting = true;
  botState.connected = false;
  
  const delay = Math.min(2000 * Math.pow(1.5, botState.reconnectAttempts), 120000);
  addLog(`[System] Reconectando en ${Math.round(delay / 1000)}s... (Intento ${botState.reconnectAttempts + 1})`);
  
  setTimeout(() => {
    isReconnecting = false;
    botState.reconnectAttempts++;
    startBot();
  }, delay);
}

function startBot() {
  clearAllIntervals();
  if (bot) {
    try { bot.end(); } catch(_) {}
    bot = null;
  }

  addLog(`[System] Conectando a ${config.server.ip}:${config.server.port || 25565}...`);

  bot = mineflayer.createBot({
    host: config.server.ip,
    port: parseInt(config.server.port) || 25565,
    username: config["bot-account"].username,
    version: config.server.version || false,
    auth: "offline"
  });

  // Cargar pathfinder para movimientos mas estables
  bot.loadPlugin(pathfinder);

  bot.once("spawn", () => {
    botState.connected = true;
    botState.reconnectAttempts = 0;
    addLog(`[Bot] ${bot.username} ha entrado al servidor con exito.`);

    if (config.utils["auto-auth"]?.enabled) {
      setTimeout(() => {
        bot.chat(`/register ${config.utils["auto-auth"].password} ${config.utils["auto-auth"].password}`);
        bot.chat(`/login ${config.utils["auto-auth"].password}`);
      }, 2000);
    }

    // Intervalo Anti-AFK basico de saltos y movimientos continuos
    const afkTimer = setInterval(() => {
      if (!bot || !botState.connected) return;
      if (config.movement?.["random-jump"]?.enabled) {
        bot.setControlState("jump", true);
        setTimeout(() => bot.setControlState("jump", false), 500);
      }
    }, 15000);
    timers.push(afkTimer);
  });

  bot.on("chat", (username, message) => {
    if (username === bot.username) return;
    if (config.utils["chat-log"]) {
      addLog(`[Chat] <${username}> ${message}`);
    }
  });

  bot.on("kick", (reason) => {
    addLog(`[Bot] Expulsado del servidor: ${reason}`);
    scheduleReconnect();
  });

  bot.on("end", () => {
    addLog("[Bot] Conexion finalizada.");
    scheduleReconnect();
  });

  bot.on("error", (err) => {
    addLog(`[Error] Ocurrio un fallo: ${err.message}`);
    scheduleReconnect();
  });
}

process.on("unhandledRejection", (reason) => {
  addLog(`[FATAL] Rejection: ${reason}`);
  scheduleReconnect();
});

// Arrancar por primera vez
startBot();
