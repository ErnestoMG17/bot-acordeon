const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const express = require('express')
const qrcode = require('qrcode')
const app = express()

let qrCodeData = null
let status = "Iniciando..."
const TOPIC = "chamba-acordeon-4492526620"

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const sock = makeWASocket({ 
    auth: state, 
    browser: ["Bot Acordeon","Chrome","1.0"]
  })
  
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (up)=>{
    if(up.qr){
      qrCodeData = await qrcode.toDataURL(up.qr)
      status = "Escanea el QR"
      console.log("QR generado")
    }
    if(up.connection==='open'){
      status = `CONECTADO ✅`
      qrCodeData = null
      console.log("CONECTADO LISTO")
      
      // PRUEBA AUTOMATICA NTFY
      const https = require('https')
      const body = "✅ Bot conectado y vigilando chamba"
      const req = https.request({
        hostname: 'ntfy.sh',
        path: `/${TOPIC}`,
        method: 'POST',
        headers: { 'Title': 'Bot conectado' }
      }, res => console.log("PRUEBA NTFY status:", res.statusCode))
      req.on('error', e=>console.log("Error ntfy prueba:", e.message))
      req.write(body)
      req.end()
    }
    if(up.connection==='close'){
      const reason = up.lastDisconnect?.error?.output?.statusCode
      console.log("Desconectado:", reason)
      if(reason != DisconnectReason.loggedOut){
        setTimeout(()=> startBot(), 3000)
      }
    }
  })

  sock.ev.on('messages.upsert', async m=>{
    const msg = m.messages[0]
    if(!msg.message || msg.key.fromMe) return
    const txtRaw = (msg.message.conversation || msg.message.extendedTextMessage?.text || "")
    if(!txtRaw) return
    const t = txtRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

    if(!t.includes("acordeon") && !t.includes("acordion")) return
    if(["vendo","venta","yo voy","si voy","disponible","yo toco"].some(p=>t.includes(p))) return

    console.log("🎹 CHAMBA DETECTADA:", txtRaw)
    const https = require('https')
    const body = `🎹 CHAMBA: ${txtRaw}\nDe: ${msg.pushName || '?'}`
    const req = https.request({
      hostname: 'ntfy.sh',
      path: `/${TOPIC}`,
      method: 'POST',
      headers: { 'Title': 'Chamba acordeon!', 'Priority': 'high' }
    }, res => console.log("ntfy chamba status:", res.statusCode))
    req.on('error', e=>console.log("Error ntfy:", e.message))
    req.write(body)
    req.end()
  })
}

app.get('/', (req,res)=>{
  res.send(`<h1>${status}</h1><p>${TOPIC}</p>${qrCodeData?`<img src="${qrCodeData}" width="300">`:`CONECTADO`}<script>setTimeout(()=>location.reload(),5000)</script>`)
})
app.listen(3000)
startBot()
