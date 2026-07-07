// Cargar el servidor Express para que Render no tire la aplicación
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('Slobot funcionando correctamente.');
});

app.listen(PORT, () => {
    console.log(`Servidor web activo en el puerto ${PORT}`);
});

// Arrancar el bot oficial de Slobos
try {
    const { createBot } = require('./leaveRejoin.js');
    const settings = require('./settings.json');

    console.log("Iniciando el bot con la configuración de settings.json...");
    createBot(settings);
} catch (error) {
    console.error("Error al iniciar las dependencias del bot:", error);
}
