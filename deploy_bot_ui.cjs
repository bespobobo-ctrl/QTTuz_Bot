const https = require('https');

const TOKEN = '8715883040:AAE6BRzEXirmKHvZYpGvb31lXVdAh9sXVmU';
// Botingizning Vercel-dagi haqiqiy manzili (App ochilishi uchun)
const APP_URL = 'https://qtt-uz-bot.vercel.app';

const DEPARTMENTS = [
    { id: 'rahbar', name: '👑 Rahbar' },
    { id: 'kadirlar', name: '👥 Kadirlar' },
    { id: 'mato_ombori', name: '🧵 Mato ombori' },
    { id: 'aksesuvar_ombori', name: '📦 Aksesuvar' },
    { id: 'omborchi', name: '👷 Omborchi' },
    { id: 'bichuv', name: '✂️ Bichuv' },
    { id: 'tasnif', name: '🔍 Tasnif' },
    { id: 'taqsimot', name: '🌿 Taqsimot' },
    { id: 'tikuv', name: '👕 Tikuv' },
    { id: 'otk', name: '✅ OTK' },
    { id: 'dazmol', name: '💨 Dazmol' },
    { id: 'qadoqlov', name: '📦 Qadoqlov' },
    { id: 'tayyor_ombor', name: '🏢 Tayyor mahsulot' },
    { id: 'sotuv', name: '🛒 Sotuv' }
];

async function deployUI() {
    console.log('Bot Interfeysini yangilash boshlandi...');

    // 1. Menu Buttonni yangilash
    const menuData = JSON.stringify({
        menu_button: {
            type: 'web_app',
            text: '🏢 BO\'LIMLAR',
            web_app: { url: APP_URL }
        }
    });
    await callApi('setChatMenuButton', menuData);

    // 2. Buyruqlarni yangilash
    const commandsData = JSON.stringify({
        commands: [
            { command: 'start', description: 'Boshlash' },
            { command: 'menu', description: 'Bo\'limlar ro\'yxati' }
        ]
    });
    await callApi('setMyCommands', commandsData);

    console.log('\n✅ MUVAFFAQIYATLI! Botingiz endi yangilandi.');
    console.log('Endi Telegram-ga kirib, botni o\'chirib qayta start bering.');
}

function callApi(method, data) {
    return new Promise((resolve) => {
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
            res.on('data', (d) => process.stdout.write(d));
            res.on('end', resolve);
        });
        req.write(data);
        req.end();
    });
}

deployUI();
