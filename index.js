"use strict";

const mineflayer = require("mineflayer");
const { Movements, pathfinder, goals } = require("mineflayer-pathfinder");
const { GoalBlock } = goals;
const config = require("./settings.json");
const express = require("express");

// ============================================================
// EXPRESS SERVER - Keep Render/Aternos alive
// ============================================================
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send(`<h1>BraisBot24h Activo</h1><p>El bot esta funcionando en Render.</p>`);
});

app.listen(PORT, () => {
  console.log(`[System] Servidor Express activo en puerto ${PORT}`);
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
  
  const delay = 15000; // Intentar reconectar cada 15 segundos constantes
  console.log(`[System] Reconectando en 15 segundos...`);
  
  setTimeout(() => {
    isReconnecting = false;
    startBot();
  }, delay);
}

function startBot() {
  clearAllIntervals();
  if (bot) {
    try { bot.end(); } catch(_) {}
    bot = null;
  }

  console.log(`[System] Intentando conectar a ${config.server.ip}:${config.server.port || 25565}...`);

  try {
    bot = mineflayer.createBot({
      host: config.server.ip,
      port: parseInt(config.server.port) || 25565,
      username: config["bot-account"].username,
      version: config.server.version || false,
      auth: "offline"
    });

    bot.loadPlugin(pathfinder);

    bot.once("spawn", () => {
      console.log(`[Bot] ${bot.username} ha entrado al servidor con exito.`);

      if (config.utils["auto-auth"]?.enabled) {
        setTimeout(() => {
          console.log("[Bot] Enviando comandos de autenticacion...");
          bot.chat(`/register ${config.utils["auto-auth"].password} ${config.utils["auto-auth"].password}`);
          bot.chat(`/login ${config.utils["auto-auth"].password}`);
        }, 2000);
      }

      const afkTimer = setInterval(() => {
        if (!bot) return;
        console.log("[Bot] Haciendo salto Anti-AFK");
        bot.setControlState("jump", true);
        setTimeout(() => bot.setControlState("jump", false), 500);
      }, 20000);
      timers.push(afkTimer);
    });

    bot.on("chat", (username, message) => {
      if (username === bot.username) return;
      console.log(`[Chat] <${username}> ${message}`);
    });

    bot.on("kick", (reason) => {
      console.log(`[Bot] Expulsado del servidor. Razon: ${JSON.stringify(reason)}`);
      scheduleReconnect();
    });

    bot.on("end", () => {
      console.log("[Bot] Conexion finalizada con el servidor.");
      scheduleReconnect();
    });

    bot.on("error", (err) => {
      console.log(`[Error] Error en el bot: ${err.message}`);
      scheduleReconnect();
    });

  } catch (error) {
    console.log(`[Error Fatal] No se pudo crear el bot: ${error.message}`);
    scheduleReconnect();
  }
}

// Arrancar el bot
startBot();
