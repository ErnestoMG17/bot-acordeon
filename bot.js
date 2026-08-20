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
    browser: ["Bot Acordeon","Chrome","1.0"],
    printQRInTerminal: false
  })
  
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (up)=>{
    if(up.qr){
      qrCodeData = await qrcode.toDataURL(up.qr)
      status = "Escanea el QR"
      console.log("QR generado")
    }
    if(up.connection==='open'){
      status = `CONECTADO ✅ - Vigilando ${TOPIC}`
      qrCodeData = null
      console.log("CONECTADO LISTO")
    }
    if(up.connection==='close'){
      const reason = up.lastDisconnect?.error?.output?.statusCode
      console.log("Desconectado razon:", reason)
      if(reason != DisconnectReason.loggedOut){
        console.log("Reconectando en 3 seg...")
        setTimeout(()=> startBot(), 3000)
      } else {
        status = "Sesion cerrada"
      }
    }
  })

  sock.ev.on('messages.upsert', async m=>{
    const msg = m.messages[0]
    if(!msg.message || msg.key.fromMe) return
    
    const txtRaw = (msg.message.conversation || msg.message.extendedTextMessage?.text || "")
    if(!txtRaw) return
    const txt = txtRaw.toLowerCase()
    const t = txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

    if(!["acordeon","acordion"].some(p=>t.includes(p))) return
    if(["vendo","venta","yo voy","si voy","disponible","yo toco","yo mero"].some(p=>t.includes(p))){
      console.log("Ignorado por oferta:", txtRaw)
      return
    }

    console.log("🎹 CHAMBA DETECTADA:", txtRaw)
    
    const https = require('https')
    const body = `🎹 CHAMBA DE ACORDEON\n\n${txtRaw}\n\nDe: ${msg.pushName || '?'}\nGrupo: ${msg.key.remoteJid}`
    const req = https.request({
      hostname: 'ntfy.sh',
      path: `/${TOPIC}`,
      method: 'POST',
      headers: { 'Title': 'Nueva chamba de acordeon!', 'Priority': 'high', 'Tags': 'accordion' }
    }, res => {
      console.log("ntfy status:", res.statusCode)
    })
    req.on('error', e=>console.log("Error ntfy:", e.message))
    req.write(body)
    req.end()
  })
}

app.get('/', (req,res)=>{
  res.send(`
    <h1>${status}</h1>
    <p>Topic: ${TOPIC}</p>
    ${qrCodeData?`<img src="${qrCodeData}" width="300">`:`<p>Si dice CONECTADO ya esta vigilando</p>`}
    <script>setTimeout(()=>location.reload(),5000)</script>
  `)
})

app.listen(3000, ()=>console.log("Web en 3000"))
startBot()
