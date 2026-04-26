const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listTables() {
    // Supabase indirect way to list tables via a common query or just trying to select from them
    // But since I don't know the names, I might use the RPC if enabled or just check known ones
    const knownTables = [
        'warehouse_batches',
        'warehouse_rolls',
        'warehouse_log',
        'department_logins',
        'warehouse_orders',
        'system_config',
        'accessories',
        'accessory_log',
        'cutting_log'
    ];

    for (const table of knownTables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Table ${table}: Not found or error (${error.message})`);
        } else {
            console.log(`Table ${table}: Exists. Columns:`, data.length > 0 ? Object.keys(data[0]) : 'Empty');
        }
    }
}

listTables();
