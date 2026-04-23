const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkOrdersSchema() {
    const { data } = await supabase.from('warehouse_orders').select('*').limit(1);
    if (data && data[0]) {
        console.log("ORDERS_COLUMNS:", JSON.stringify(Object.keys(data[0])));
    } else {
        console.log("No data in warehouse_orders to infer schema.");
        // Try to insert and rollback or just guess from common patterns if possible
    }
}
checkOrdersSchema();
