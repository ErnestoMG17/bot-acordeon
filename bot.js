const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const express = require('express')
const qrcode = require('qrcode')
const https = require('https')
const app = express()

let qrCodeData = null
let status = "Iniciando..."
const TG_TOKEN = "8364493436:AAGb6WF2e84vZQJmW-btO5demFKQs0kcFGA"
const CHAT_ID = 8090050207

function sendTelegram(msg){
  const data = JSON.stringify({chat_id: CHAT_ID, text: msg})
  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${TG_TOKEN}/sendMessage`,
    method: 'POST',
    headers: {'Content-Type':'application/json','Content-Length': Buffer.byteLength(data)}
  }, r=>console.log("TG:",r.statusCode))
  req.on('error', e=>console.log(e.message))
  req.write(data); req.end()
}

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const sock = makeWASocket({ auth: state, browser: ["Bot","Chrome","1.0"] })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async up=>{
    if(up.qr){ qrCodeData = await qrcode.toDataURL(up.qr); status="Escanea QR nuevo" }
    if(up.connection==='open'){
      status="CONECTADO ✅"; qrCodeData=null
      console.log("WA CONECTADO")
      sendTelegram("✅ Reconectado, vigilando chambas")
    }
    if(up.connection==='close' && up.lastDisconnect?.error?.output?.statusCode!=DisconnectReason.loggedOut){
      status="Reconectando..."
      setTimeout(()=>startBot(),3000)
    }
  })
  sock.ev.on('messages.upsert', async m=>{
    const msg=m.messages[0]; if(!msg.message || msg.key.fromMe) return
    const txt=msg.message.conversation||msg.message.extendedTextMessage?.text||""; if(!txt) return
    const t=txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    if(!t.includes("acordeon")&&!t.includes("acordion")) return
    if(["vendo","venta","yo voy","disponible"].some(p=>t.includes(p))) return
    sendTelegram(`🎹 CHAMBA:\n${txt}`)
  })
}

app.get('/', (req,res)=>{
  res.send(`<h1>${status}</h1>${qrCodeData?`<img src="${qrCodeData}" width="300">`:`<p>Bot activo, no ocupa QR</p>`}`)
})
app.listen(3000)
startBot()
