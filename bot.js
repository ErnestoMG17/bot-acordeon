const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const express = require('express')
const qrcode = require('qrcode')
const app = express()
let qrCodeData = null
let status = "Iniciando bot..."

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    const sock = makeWASocket({ auth: state, printQRInTerminal: true })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        if (qr) {
            qrCodeData = await qrcode.toDataURL(qr)
            status = "Escanea el QR"
            console.log("QR GENERADO")
        }
        if (connection === 'open') {
            qrCodeData = null
            status = "BOT ACORDEON LISTO ✅"
            console.log("CONECTADO")
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut
            if (shouldReconnect) startBot()
        }
    })

    // Aquí va tu logica de respuestas - dejalo simple por ahora
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return
        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
        if(texto.toLowerCase().includes("hola")){
            await sock.sendMessage(msg.key.remoteJid, { text: "Hola! Soy el Bot Acordeon 🎹 ¿En que te ayudo?" })
        }
    })
}

app.get('/', (req, res) => {
    if (qrCodeData) {
        res.send(`<h1>${status}</h1><img src="${qrCodeData}"><script>setTimeout(()=>location.reload(),5000)</script>`)
    } else {
        res.send(`<h1>${status}</h1><script>setTimeout(()=>location.reload(),3000)</script>`)
    }
})

app.listen(3000, () => console.log("Web en 3000"))
startBot()
