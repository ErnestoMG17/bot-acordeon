const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const express = require('express')
const qrcode = require('qrcode')
const app = express()

let qrCodeData = null
let status = "Iniciando..."
let sockGlobal = null

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const sock = makeWASocket({
    auth: state,
    browser: ["Bot Acordeon", "Chrome", "1.0"]
  })
  sockGlobal = sock
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (up)=>{
    if(up.qr){
      qrCodeData = await qrcode.toDataURL(up.qr)
      status = "Escanea el QR"
    }
    if(up.connection==='open'){
      status = "CONECTADO ✅ - Vigilando chambas de acordeon"
      qrCodeData = null
    }
    if(up.connection==='close'){
      const shouldReconnect = up.lastDisconnect?.error?.output?.statusCode!= DisconnectReason.loggedOut
      if(shouldReconnect) startBot()
      else status = "Desconectado"
    }
  })

  // --- AQUI ESTA LA LOGICA DE CHAMBA ---
  sock.ev.on('messages.upsert', async m=>{
    const msg = m.messages[0]
    if(!msg.message || msg.key.fromMe) return

    const txt = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase()
    if(!txt) return
    const textoNormalizado = txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

    const palabrasAcordeon = ["acordeon", "acordion", "acordeonero", "acordionero", "acordenista", "acordeonista"]
    const palabrasBusqueda = ["ocupo", "necesito", "busco", "se busca", "requiero", "urge", "alguien", "solicito", "hace falta", "ocupamos"]
    const palabrasOferta = ["vendo", "venta", "yo voy", "si voy", "yo mero", "disponible", "yo toco", "me apunto", "a la orden", "cuanto pagan"]

    const mencionaAcordeon = palabrasAcordeon.some(p => textoNormalizado.includes(p))
    if(!mencionaAcordeon) return
    if(palabrasOferta.some(p => textoNormalizado.includes(p))) return

    // Si quieres que solo alerte cuando diga ocupo/busco, descomenta la siguiente linea:
    // if(!palabrasBusqueda.some(p => textoNormalizado.includes(p))) return

    console.log("🎹 CHAMBA:", txt)
    try {
      await fetch('https://ntfy.sh/chamba-acordeon-4492526620', {
        method: 'POST',
        body: `🎹 CHAMBA DETECTADA\n\nMensaje: ${txt}\nDe: ${msg.pushName}\nChat: ${msg.key.remoteJid}`,
        headers: { 'Title': 'Nueva chamba de acordeon!', 'Priority': 'high', 'Tags': 'accordion' }
      })
    } catch(e){ console.log(e) }
  })
}

app.get('/', (req,res)=>{
  res.send(`<h1>${status}</h1>${qrCodeData?`<img src="${qrCodeData}" width="300">`:`<p>Vigilando... Topic: chamba-acordeon-4492526620</p>`}<script>setTimeout(()=>location.reload(),5000)</script>`)
})
app.listen(3000)
startBot()
