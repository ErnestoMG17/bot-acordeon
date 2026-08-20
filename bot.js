const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const express = require('express')
const qrcode = require('qrcode')
const https = require('https')
const app = express()

let qrCodeData = null
let status = "Iniciando..."
const TG_TOKEN = "8364493436:AAGb6WF2e84vZQJmW-btO5demFKQs0kcFGA"
let CHAT_ID = null

function sendTelegram(msg){
  if(!CHAT_ID) return console.log("Falta CHAT_ID")
  try{
    const data = JSON.stringify({chat_id: CHAT_ID, text: msg})
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${TG_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {'Content-Type':'application/json','Content-Length': Buffer.byteLength(data)}
    }, res=>{ console.log("Telegram:", res.statusCode) })
    req.on('error', e=> console.log("TG error ignorado:", e.message))
    req.write(data)
    req.end()
  }catch(e){ console.log("Error TG:", e.message) }
}

function getChatId(){
  try{
    https.get(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates`, res=>{
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
        try{
          console.log("getUpdates raw:", d.slice(0,500))
          const j = JSON.parse(d)
          if(j.result && j.result.length){
            const last = j.result[j.result.length-1]
            CHAT_ID = last.message.chat.id
            console.log("CHAT_ID DETECTADO:", CHAT_ID)
            sendTelegram("✅ Bot de chamba conectado. Ya te avisaré aquí")
          } else {
            console.log("No hay mensajes nuevos, mándale HOLA a tu bot primero")
          }
        }catch(e){ console.log("Error parse:", e.message) }
      })
    }).on('error', e=> console.log("Error getUpdates ignorado:", e.message))
  }catch(e){ console.log("Error getChatId:", e.message) }
}

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const sock = makeWASocket({ auth: state, browser: ["Bot","Chrome","1.0"] })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (up)=>{
    if(up.qr){ qrCodeData = await qrcode.toDataURL(up.qr); status = "Escanea QR" }
    if(up.connection==='open'){
      status = "CONECTADO ✅"
      qrCodeData = null
      console.log("WA CONECTADO")
      if(!CHAT_ID) getChatId()
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
    sendTelegram(`🎹 CHAMBA:\n${txt}`)
  })
}

app.get('/', (req,res)=>{
  res.send(`<h1>${status}</h1><p>ID: ${CHAT_ID || 'Manda HOLA a tu bot en Telegram'}</p>${qrCodeData?`<img src="${qrCodeData}" width="300">`:''}<br><a href="/getid"><button style="padding:15px">ACTIVAR TELEGRAM (pica después de mandar HOLA)</button></a>`)
})
app.get('/getid', (req,res)=>{
  getChatId()
  res.send(`Buscando... revisa logs. <a href="/">volver</a>`)
})
app.listen(3000)
startBot()
