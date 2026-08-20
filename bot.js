const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const express = require('express')
const qrcode = require('qrcode')
const app = express()

let qrCodeData = null
let status = "Iniciando..."
const TOPIC = "chamba-acordeon-4492526620"

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const sock = makeWASocket({ auth: state, browser: ["Bot Acordeon","Chrome","1.0"] })
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (up)=>{
    if(up.qr){ qrCodeData = await qrcode.toDataURL(up.qr); status="Escanea QR" }
    if(up.connection==='open'){ status="CONECTADO ✅"; qrCodeData=null }
  })

  sock.ev.on('messages.upsert', async m=>{
    const msg = m.messages[0]
    if(!msg.message || msg.key.fromMe) return
    const txt = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase()
    if(!txt) return
    const t = txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

    if(!["acordeon","acordion","acordeonero"].some(p=>t.includes(p))) return
    if(["vendo","venta","yo voy","si voy","disponible","yo toco"].some(p=>t.includes(p))){
      console.log("Ignorado oferta:", txt)
      return
    }

    console.log("🎹 CHAMBA DETECTADA:", txt)
    const https = require('https')
    const body = `🎹 CHAMBA: ${txt}\nDe: ${msg.pushName}`
    const req = https.request({
      hostname: 'ntfy.sh', path: `/${TOPIC}`, method: 'POST',
      headers: { 'Title': 'Chamba acordeon!', 'Priority': 'high', 'Tags': 'accordion' }
    }, res => console.log("ntfy status:", res.statusCode))
    req.on('error', e=>console.log(e))
    req.write(body)
    req.end()
  })
}
app.get('/', (req,res)=> res.send(`<h1>${status}</h1>${qrCodeData?`<img src="${qrCodeData}">`:TOPIC}<script>setTimeout(()=>location.reload(),5000)</script>`))
app.listen(3000)
startBot()
