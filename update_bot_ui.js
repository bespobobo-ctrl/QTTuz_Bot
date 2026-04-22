import https from 'https';

const TOKEN = '8730179502:AAGVxS18UISJR1BQYYTTOqkCj4Iktq1HmWE';
const APP_URL = 'https://ombor-uz-production.vercel.app';

async function updateBotUI() {
    console.log('--- Telegram Bot UI Yangilanishi boshlandi ---');

    // 1. Menu Buttonni o'rnatish
    const menuData = JSON.stringify({
        menu_button: {
            type: 'web_app',
            text: '🏢 BO\'LIMLAR',
            web_app: { url: APP_URL }
        }
    });

    console.log('1. Menu tugmasi o\'rnatilmoqda...');
    const res1 = await callApi('setChatMenuButton', menuData);
    console.log('Menu javobi:', res1);

    // 2. Commandlarni o'rnatish
    const commandsData = JSON.stringify({
        commands: [
            { command: 'start', description: 'Botni ishga tushirish' },
            { command: 'sections', description: 'Bo\'limlar ro\'yxati' }
        ]
    });

    console.log('2. Buyruqlar o\'rnatilmoqda...');
    const res2 = await callApi('setMyCommands', commandsData);
    console.log('Commands javobi:', res2);

    console.log('\n✅ Bajarildi! Telegram-da botni tekshirib ko\'ring.');
}

function callApi(method, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.telegram.org',
            path: `/bot${TOKEN}/${method}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let resBody = '';
            res.on('data', (chunk) => resBody += chunk);
            res.on('end', () => resolve(JSON.parse(resBody)));
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

updateBotUI().catch(console.error);
