const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const express = require('express')
const qrcode = require('qrcode')
const app = express()
let qrCodeData = null
let status = "Iniciando..."

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const sock = makeWASocket({
    auth: state,
    browser: ["Bot Acordeon", "Chrome", "1.0"]
  })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (up)=>{
    if(up.qr){
      qrCodeData = await qrcode.toDataURL(up.qr)
      status = "Escanea el QR"
      console.log("QR LISTO")
    }
    if(up.connection==='open'){
      status = "CONECTADO ✅"
      qrCodeData = null
    }
    if(up.connection==='close'){
      if(up.lastDisconnect?.error?.output?.statusCode!= DisconnectReason.loggedOut){
        startBot()
      }
    }
  })
  sock.ev.on('messages.upsert', async m=>{
    const msg=m.messages[0]
    if(!msg.message || msg.key.fromMe) return
    const txt = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
    if(txt.toLowerCase()=="hola"){
      await sock.sendMessage(msg.key.remoteJid, {text:"Hola! Soy Bot Acordeon 🎹"})
    }
  })
}
app.get('/', (req,res)=>{
  res.send(`<h1>${status}</h1>${qrCodeData?`<img src="${qrCodeData}" width="300">`:''}<script>setTimeout(()=>location.reload(),4000)</script>`)
})
app.listen(3000, ()=>console.log("Web en 3000"))
startBot()
