const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => qrcode.generate(qr, {small: true}));
client.on('ready', () => console.log('BOT ACORDEON FINAL LISTO'));

client.on('message', async msg => {
    try {
        if (msg.fromMe) return;
        const texto = msg.body.toLowerCase();
        if (!texto) return;

        const esChamba = texto.includes('acordeon') || texto.includes('acordeón') || texto.includes('acordeonista') || texto.includes('acordenista') || texto.includes('acordeonero');
        const esIgnorar = texto.includes('yo voy') || texto.includes('yo mero') || texto.includes('si voy') || texto.includes('sí voy') || texto.includes('vendo') || texto.includes('se vende') || texto.includes('venta');

        if (esChamba && !esIgnorar) {
            console.log('CHAMBA: ' + msg.body);
            await fetch('https://ntfy.sh/chamba-acordeon-4492526620', {
                method: 'POST',
                body: `CHAMBA: ${msg.body}`,
                headers: { 
                    'Title': 'CHAMBA DE ACORDEON!', 
                    'Priority': 'urgent', 
                    'Tags': 'accordion,moneybag' 
                }
            });
            console.log('Notificacion enviada OK!');
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
});

client.initialize();
