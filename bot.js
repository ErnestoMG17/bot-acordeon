const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const express = require('express')
const qrcode = require('qrcode')
const https = require('https')
const app = express()

let qrCodeData = null
let status = "Iniciando..."
const TG_TOKEN = "8364493436:AAGb6WF2e84vZQJmW-btO5demFKQs0kcFGA"
let CHAT_ID = null // se detecta solo

function sendTelegram(msg){
  if(!CHAT_ID) return console.log("Aun no tengo CHAT_ID, manda hola a tu bot en Telegram")
  const data = JSON.stringify({chat_id: CHAT_ID, text: msg})
  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${TG_TOKEN}/sendMessage`,
    method: 'POST',
    headers: {'Content-Type':'application/json','Content-Length': data.length}
  }, res=>console.log("Telegram status:", res.statusCode))
  req.on('error', e=>console.log("TG error:", e.message))
  req.write(data)
  req.end()
}

async function getChatId(){
  https.get(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates`, res=>{
    let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
      console.log("getUpdates:", d)
      try{
        const j = JSON.parse(d)
        if(j.result && j.result.length){
          const last = j.result[j.result.length-1]
          CHAT_ID = last.message.chat.id
          console.log("CHAT_ID DETECTADO:", CHAT_ID)
          sendTelegram("✅ Bot de chamba conectado. Ya te avisaré aquí cada que salga jale de acordeonero")
        }
      }catch(e){}
    })
  })
}

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const sock = makeWASocket({ auth: state, browser: ["Bot","Chrome","1.0"] })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (up)=>{
    if(up.qr){
      qrCodeData = await qrcode.toDataURL(up.qr)
      status = "Escanea QR WhatsApp"
    }
    if(up.connection==='open'){
      status = "CONECTADO ✅ - Esperando tu ID de Telegram"
      qrCodeData = null
      console.log("WA CONECTADO")
      getChatId()
    }
    if(up.connection==='close' && up.lastDisconnect?.error?.output?.statusCode!= DisconnectReason.loggedOut){
      setTimeout(()=>startBot(),3000)
    }
  })
  sock.ev.on('messages.upsert', async m=>{
    const msg = m.messages[0]
    if(!msg.message || msg.key.fromMe) return
    const txtRaw = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
    if(!txtRaw) return
    const t = txtRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    if(!t.includes("acordeon") &&!t.includes("acordion")) return
    if(["vendo","venta","yo voy","disponible"].some(p=>t.includes(p))) return
    console.log("CHAMBA:", txtRaw)
    sendTelegram(`🎹 CHAMBA DETECTADA:\n${txtRaw}`)
  })
}

app.get('/', (req,res)=>{
  res.send(`<h1>${status}</h1><p>CHAT_ID: ${CHAT_ID || 'aun no, manda HOLA a tu bot en Telegram'}</p>${qrCodeData?`<img src="${qrCodeData}" width="300">`:''}<br><br><a href="/getid"><button style="padding:15px;font-size:18px;">1. Manda HOLA a tu bot y luego pica AQUÍ para activar Telegram</button></a>`)
})

app.get('/getid', (req,res)=>{
  getChatId()
  res.send(`<h1>Buscando tu ID...</h1><p>Revisa logs en Render, debe decir CHAT_ID DETECTADO. Luego vuelve a /</p><a href="/">volver</a>`)
})

app.listen(3000)
startBot()
