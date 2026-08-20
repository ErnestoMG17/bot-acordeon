const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const express = require('express');
const app = express();
let lastQr = '';
let isReady = false;

app.get('/', async (req, res) => {
  if (isReady) return res.send('<center><h1 style="color:green">✅ BOT ACORDEON LISTO - Vinculado</h1><p>Ya puedes minimizar esto</p></center>');
  if (!lastQr) return res.send('<h1>Generando QR... recarga en 3 seg</h1><script>setTimeout(()=>location.reload(),3000)</script>');
  const qrImage = await qrcode.toDataURL(lastQr);
  res.send(`<center><h1>ESCANEA ESTE QR</h1><img src="${qrImage}" style="width:350px;border:10px solid #000"><p>WhatsApp -> Dispositivos vinculados -> Vincular</p></center><script>setTimeout(()=>location.reload(),20000)</script>`);
});
app.listen(process.env.PORT || 3000, () => console.log('Web en 3000'));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({ auth: state, printQRInTerminal: true, logger: require('pino')({level:'silent'}) });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) { lastQr = qr; console.log('QR NUEVO'); }
    if (connection === 'open') { isReady = true; lastQr = ''; console.log('BOT LISTO'); }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    }
  });
  sock.ev.on('messages.upsert', async m => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').toLowerCase();
    const from = msg.key.remoteJid;
    if (from.includes('@g.us')) return;
    if (text.includes('hola')) {
      await sock.sendMessage(from, { text: 'Hola! Soy el bot de acordeones 🪗\nEscribe *catalogo* para ver modelos' });
    }
    if (text.includes('catalogo')) {
      await sock.sendMessage(from, { text: 'CATALOGO:\n1- Hohner Panther\n2- Gabbanelli\n3- Cantabella\n¿Cual te interesa?' });
    }
  });
}
startBot();
