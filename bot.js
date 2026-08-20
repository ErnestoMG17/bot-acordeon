const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const fs = require('fs');
const app = express();
let lastQr = '';
if (fs.existsSync('./.wwebjs_auth')) {
  fs.rmSync('./.wwebjs_auth', { recursive: true, force: true });
}
app.get('/', async (req, res) => {
  if (!lastQr) return res.send('<h1>Generando QR... recarga en 5 seg</h1><script>setTimeout(()=>location.reload(),5000)</script>');
  const qrImage = await qrcode.toDataURL(lastQr);
  res.send(`<center><h1>ESCANEA ESTE QR</h1><img src="${qrImage}" style="width:350px"><p>Se actualiza cada 20 seg</p></center><script>setTimeout(()=>location.reload(),20000)</script>`);
});
app.listen(process.env.PORT || 3000, () => console.log('Web en 3000'));
const client = new Client({
  puppeteer: { headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu'] }
});
client.on('qr', (qr) => { console.log('QR GENERADO'); lastQr = qr; });
client.on('ready', () => { console.log('BOT LISTO'); lastQr = ''; });
client.on('message', async (msg) => {
  const chat = await msg.getChat();
  if (chat.isGroup) return;
  if (msg.body.toLowerCase().includes('hola')) { msg.reply('Hola! Soy el bot de acordeones. Escribe *catalogo* para ver modelos'); }
});
client.initialize();
