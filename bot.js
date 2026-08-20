const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const express = require('express')
const qrcode = require('qrcode')
const https = require('https')
const app = express()

let qrCodeData = null
let status = "Iniciando..."
const TOPIC = "chamba-acordeon-4492526620"

function sendNtfy(titulo, mensaje){
  return new Promise((resolve,reject)=>{
    const req = https.request({
      hostname: 'ntfy.sh',
      path: `/${TOPIC}`,
      method: 'POST',
      headers: { 'Title': titulo, 'Priority': 'high' }
    }, res => {
      console.log("ntfy response:", res.statusCode)
      resolve(res.statusCode)
    })
    req.on('error', e=>{
      console.log("ntfy ERROR:", e.message)
      reject(e.message)
    })
    req.write(mensaje)
    req.end()
  })
}

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const sock = makeWASocket({ auth: state, browser: ["Bot","Chrome","1.0"] })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (up)=>{
    if(up.qr){
      qrCodeData = await qrcode.toDataURL(up.qr)
      status = "Escanea QR"
    }
    if(up.connection==='open'){
      status = "CONECTADO ✅"
      qrCodeData = null
      console.log("CONECTADO")
      sendNtfy("Bot Conectado", "Prueba auto al conectar").catch(()=>{})
    }
    if(up.connection==='close' && up.lastDisconnect?.error?.output?.statusCode != DisconnectReason.loggedOut){
      setTimeout(()=>startBot(),3000)
    }
  })
  sock.ev.on('messages.upsert', async m=>{
    const msg = m.messages[0]
    if(!msg.message || msg.key.fromMe) return
    const txtRaw = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
    if(!txtRaw) return
    const t = txtRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    if(!t.includes("acordeon") && !t.includes("acordion")) return
    console.log("CHAMBA:", txtRaw)
    sendNtfy("Chamba acordeon!", txtRaw).catch(()=>{})
  })
}

app.get('/', (req,res)=>{
  res.send(`<h1>${status}</h1><p>Topic: ${TOPIC}</p>${qrCodeData?`<img src="${qrCodeData}" width="300">`:''}<br><a href="/test-ntfy"><button style="font-size:20px;padding:15px;">PROBAR NTFY AHORA</button></a><script>setTimeout(()=>location.reload(),5000)</script>`)
})

app.get('/test-ntfy', async (req,res)=>{
  try{
    const code = await sendNtfy("Prueba manual", "Si ves esto, ntfy SI jala desde Render")
    res.send(`<h1>ntfy respondió: ${code}</h1><p>Si dice 200 y NO te llegó notificación, NO estás suscrito en la app ntfy al topic ${TOPIC}</p><a href="/">volver</a>`)
  }catch(e){
    res.send(`<h1>ERROR ntfy: ${e}</h1><p>Render está bloqueando ntfy.sh. Nos pasamos a Telegram.</p>`)
  }
})

app.listen(3000)
startBot()
