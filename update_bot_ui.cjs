const https = require('https');

// Sizning bot tokeningiz
const TOKEN = '8730179502:AAGVxS18UISJR1BQYYTTOqkCj4Iktq1HmWE';
// Mini App manzili (Taxminiy, agar boshqa bo'lsa o'zgartiramiz)
const APP_URL = 'https://ombor-uz-production.vercel.app';

async function updateBotUI() {
    console.log('--- Telegram Bot UI Yangilanishi boshlandi ---');

    // 1. Menu Buttonni o'rnatish (web_app bilan)
    const menuData = JSON.stringify({
        menu_button: {
            type: 'web_app',
            text: '🏢 BO\'LIMLAR',
            web_app: { url: APP_URL }
        }
    });

    console.log('1. Menu tugmasi o\'rnatilmoqda...');
    await callApi('setChatMenuButton', menuData);

    // 2. Commandlarni o'rnatish
    const commandsData = JSON.stringify({
        commands: [
            { command: 'start', description: 'Botni ishga tushirish' },
            { command: 'rahbar', description: 'Rahbar bo\'limi' },
            { command: 'mato', description: 'Mato ombori' },
            { command: 'bichuv', description: 'Bichuv bo\'limi' },
            { command: 'tikuv', description: 'Tikuv bo\'limi' }
        ]
    });

    console.log('2. Buyruqlar (commands) o\'rnatilmoqda...');
    await callApi('setMyCommands', commandsData);

    console.log('\n✅ Bajarildi! Endi botingizni Telegramda tekshirib ko\'ring.');
}

function callApi(method, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.telegram.org',
            path: `/bot${TOKEN}/${method}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let resBody = '';
            res.on('data', (chunk) => resBody += chunk);
            res.on('end', () => {
                console.log(`${method} javobi:`, resBody);
                resolve(JSON.parse(resBody));
            });
        });

        req.on('error', (err) => {
            console.error(`${method} xatosi:`, err);
            reject(err);
        });

        req.write(data);
        req.end();
    });
}

updateBotUI().catch(console.error);
