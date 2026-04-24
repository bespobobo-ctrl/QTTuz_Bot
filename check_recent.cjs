const { createClient } = require('@supabase/supabase-js');
const s = createClient(
    "https://woonyxwygwwnhnghqihu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU"
);
async function main() {
    console.log("=== BATCHES ===");
    const b = await s.from('warehouse_batches').select('*').order('id', { ascending: false }).limit(3);
    console.log(b.data);

    console.log("=== ROLLS ===");
    const r = await s.from('warehouse_rolls').select('*').order('id', { ascending: false }).limit(3);
    console.log(r.data);

    console.log("=== LOGS ===");
    const l = await s.from('warehouse_log').select('*').order('id', { ascending: false }).limit(3);
    console.log(l.data);
}
main();
