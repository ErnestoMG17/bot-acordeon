const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const app = express();

let lastQr = '';

app.get('/', async (req, res) => {
    if (!lastQr) return res.send('BOT ACORDEON FINAL LISTO - Ya esta vinculado');
    const qrImage = await qrcode.toDataURL(lastQr);
    res.send(`<h1>Escanea este QR con WhatsApp</h1><img src="${qrImage}" style="width:300px"><script>setTimeout(()=>location.reload(),20000)</script>`);
});

app.listen(process.env.PORT || 3000, () => console.log('Server en puerto 3000'));

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    }
});

client.on('qr', (qr) => {
    console.log('QR GENERADO');
    lastQr = qr;
});

client.on('ready', () => {
    console.log('BOT ACORDEON FINAL LISTO');
    lastQr = '';
});

client.on('message', async (msg) => {
    const chat = await msg.getChat();
    if (chat.isGroup) return;
    if (msg.body.toLowerCase() === 'hola') {
        msg.reply('Hola! Soy el bot de acordeones. Escribe *catalogo*');
    }
    if (msg.body.toLowerCase() === 'catalogo') {
        msg.reply('Catálogo de acordeones 🎹🪗');
    }
});

client.initialize();
