const https = require('https');

const TOKEN = '8715883040:AAE6BRzEXirmKHvZYpGvb31lXVdAh9sXVmU';
const APP_URL = 'https://qtt-uz-bot.vercel.app';

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(200).send('Bot is running...');
    }

    const { message } = req.body;
    if (!message || !message.text) {
        return res.status(200).send('No message');
    }

    const chatId = message.chat.id;
    const text = message.text;

    if (text === '/start') {
        const welcomeText = `🏭 *OmborUZ — Bo'limlar boshqaruvi*\n\n` +
            `Xush kelibsiz! Har bir bo'limga kirish uchun maxsus tugmani bosing:`;

        await sendMessage(chatId, welcomeText, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '👑 Rahbar', web_app: { url: `${APP_URL}/?dept=rahbar` } }],
                    [
                        { text: '👥 Kadirlar', web_app: { url: `${APP_URL}/?dept=kadirlar` } },
                        { text: '🧵 Mato ombori', web_app: { url: `${APP_URL}/?dept=mato_ombori` } }
                    ],
                    [
                        { text: '📦 Aksesuvar', web_app: { url: `${APP_URL}/?dept=aksesuvar_ombori` } },
                        { text: '👷 Omborchi', web_app: { url: `${APP_URL}/?dept=omborchi` } }
                    ],
                    [
                        { text: '✂️ Bichuv Bo\'limi', web_app: { url: `${APP_URL}/?dept=bichuv` } },
                        { text: '🔍 Tasnif Bo\'limi', web_app: { url: `${APP_URL}/?dept=tasnif` } }
                    ],
                    [
                        { text: '🌿 Taqsimot Bo\'limi', web_app: { url: `${APP_URL}/?dept=taqsimot` } },
                        { text: '👕 Tikuv Bo\'limlari', web_app: { url: `${APP_URL}/?dept=tikuv` } }
                    ],
                    [
                        { text: '✅ OTK (Sifat)', web_app: { url: `${APP_URL}/?dept=otk` } },
                        { text: '💨 Dazmol Bo\'limi', web_app: { url: `${APP_URL}/?dept=dazmol` } }
                    ],
                    [
                        { text: '📦 Qadoqlov Bo\'limi', web_app: { url: `${APP_URL}/?dept=qadoqlov` } },
                        { text: '🏢 Tayyor mahsulot', web_app: { url: `${APP_URL}/?dept=tayyor_ombor` } }
                    ],
                    [{ text: '🛒 Sotuv Bo\'limi', web_app: { url: `${APP_URL}/?dept=sotuv` } }]
                ]
            }
        });
    }

    res.status(200).json({ ok: true });
};

async function sendMessage(chatId, text, options) {
    const data = JSON.stringify({ chat_id: chatId, text, ...options });
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

    return new Promise((resolve) => {
        const req = https.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        }, (res) => {
            res.on('data', () => { });
            res.on('end', resolve);
        });
        req.write(data);
        req.end();
    });
}
