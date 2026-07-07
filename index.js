"use strict";

const mineflayer = require("mineflayer");
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
  
  console.log(`[System] Buscando reconexion en 20 segundos...`);
  setTimeout(() => {
    isReconnecting = false;
    startBot();
  }, 20000);
}

function startBot() {
  clearAllIntervals();
  if (bot) {
    try { bot.end(); } catch(_) {}
    bot = null;
  }

  const targetHost = config.server.ip;
  const targetPort = parseInt(config.server.port) || 25565;

  console.log(`[System] Intentando conectar a ${targetHost}:${targetPort}...`);

  try {
    bot = mineflayer.createBot({
      host: targetHost,
      port: targetPort,
      username: config["bot-account"].username,
      // Dejamos que mineflayer auto-negocie la version de forma flexible pero estable
      version: false, 
      auth: "offline",
      connectTimeout: 15000 // Si en 15 segundos no responde, fuerza el reintento
    });

    // Temporizador de seguridad por si se queda congelado en el handshake de Aternos
    const handshakeTimeout = setTimeout(() => {
      if (bot && !bot.player) {
        console.log("[System] La conexion tardo demasiado en responder. Forzando reinicio...");
        scheduleReconnect();
      }
    }, 20000);
    timers.push(handshakeTimeout);

    bot.once("spawn", () => {
      console.log(`[Bot] ${bot.username} ha entrado al servidor con exito.`);

      if (config.utils["auto-auth"]?.enabled) {
        setTimeout(() => {
          bot.chat(`/register ${config.utils["auto-auth"].password} ${config.utils["auto-auth"].password}`);
          bot.chat(`/login ${config.utils["auto-auth"].password}`);
        }, 2000);
      }

      // --- SISTEMA ANTI-AFK AVANZADO ---
      const afkTimer = setInterval(() => {
        if (!bot) return;

        const acciones = ["jump", "sneak", "look"];
        const eleccion = acciones[Math.floor(Math.random() * acciones.length)];

        if (eleccion === "jump") {
          console.log("[Anti-AFK] Realizando salto");
          bot.setControlState("jump", true);
          setTimeout(() => bot.setControlState("jump", false), 400);
        } 
        else if (eleccion === "sneak") {
          console.log("[Anti-AFK] Agachandose");
          bot.setControlState("sneak", true);
          setTimeout(() => bot.setControlState("sneak", false), 800);
        } 
        else if (eleccion === "look") {
          console.log("[Anti-AFK] Mirando a nueva posicion");
          const yaw = (Math.random() * 360) * (Math.PI / 180);
          const pitch = ((Math.random() * 40) - 20) * (Math.PI / 180);
          bot.look(yaw, pitch, true);
        }

      }, 15000);
      
      timers.push(afkTimer);
    });

    bot.on("kick", (reason) => {
      console.log(`[Bot] Expulsado: ${JSON.stringify(reason)}`);
      scheduleReconnect();
    });

    bot.on("end", () => {
      console.log("[Bot] Conexion finalizada.");
      scheduleReconnect();
    });

    bot.on("error", (err) => {
      console.log(`[Error] ${err.message}`);
      scheduleReconnect();
    });

  } catch (error) {
    console.log(`[Error Fatal] ${error.message}`);
    scheduleReconnect();
  }
}

startBot();
