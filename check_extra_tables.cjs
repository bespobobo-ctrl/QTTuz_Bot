const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTables() {
    const tables = ['warehouse_orders', 'fabric_stock_alerts', 'warehouse_defect_decisions'];
    for (const t of tables) {
        console.log(`Checking ${t}...`);
        const { error } = await supabase.from(t).select('*').limit(1);
        if (error) console.log(`${t} Status: FAIL (${error.message})`);
        else console.log(`${t} Status: OK`);
    }
}
checkTables();
