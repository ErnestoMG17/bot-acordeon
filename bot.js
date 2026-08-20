const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    }
});

client.on('qr', (qr) => {
    console.log('ESCANEA ESTE QR:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('BOT ACORDEON FINAL LISTO');
});

client.on('message', async (msg) => {
    const chat = await msg.getChat();
    if (chat.isGroup) return;

    if (msg.body.toLowerCase() === 'hola') {
        msg.reply('Hola! Soy el bot de acordeones. Escribe *catalogo* para ver modelos.');
    }
    if (msg.body.toLowerCase() === 'catalogo') {
        msg.reply('Aquí tienes el catálogo de acordeones disponibles 🎹🪗');
    }
});

client.initialize();
