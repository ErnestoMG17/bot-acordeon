const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const express = require('express')
const https = require('https')
const app = express()

const TG_TOKEN = "8364493436:AAGb6WF2e84vZQJmW-btO5demFKQs0kcFGA"
const CHAT_ID = 8090050207 // <-- TU ID YA DETECTADO, ya quedó fijo

function sendTelegram(msg){
  const data = JSON.stringify({chat_id: CHAT_ID, text: msg})
  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${TG_TOKEN}/sendMessage`,
    method: 'POST',
    headers: {'Content-Type':'application/json','Content-Length': Buffer.byteLength(data)}
  }, res=>console.log("TG:", res.statusCode))
  req.on('error', e=>console.log(e.message))
  req.write(data)
  req.end()
}

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const sock = makeWASocket({ auth: state, browser: ["Bot","Chrome","1.0"] })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', up=>{
    if(up.connection==='open'){
      console.log("WA CONECTADO")
      sendTelegram("✅ Bot activo y vigilando chambas de acordeonero")
    }
    if(up.connection==='close' && up.lastDisconnect?.error?.output?.statusCode!=DisconnectReason.loggedOut){
      setTimeout(()=>startBot(),3000)
    }
  })
  sock.ev.on('messages.upsert', async m=>{
    const msg = m.messages[0]
    if(!msg.message || msg.key.fromMe) return
    const txt = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
    if(!txt) return
    const t = txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    if(!t.includes("acordeon") &&!t.includes("acordion")) return
    if(["vendo","venta","yo voy","disponible"].some(p=>t.includes(p))) return
    console.log("CHAMBA:", txt)
    sendTelegram(`🎹 CHAMBA DETECTADA:\n\n${txt}`)
  })
}

app.get('/', (req,res)=> res.send("<h1>Bot activo ✅ Vigilando chambas</h1>"))
app.listen(3000)
startBot()
