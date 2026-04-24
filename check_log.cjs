const { createClient } = require('@supabase/supabase-js');
const s = createClient(
    "https://woonyxwygwwnhnghqihu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU"
);

async function main() {
    const { data } = await s.from('warehouse_log').select('*').order('created_at', { ascending: false }).limit(3);
    console.log(JSON.stringify(data[0], null, 2));
    console.log("---");
    console.log("timestamp field exists:", 'timestamp' in data[0]);
    console.log("timestamp value:", data[0].timestamp);
    console.log("created_at value:", data[0].created_at);

    // Simulate isToday check
    const now = new Date();
    const ts = data[0].timestamp || data[0].created_at;
    const logDate = new Date(ts);
    console.log("\nNow toDateString:", now.toDateString());
    console.log("Log toDateString:", logDate.toDateString());
    console.log("isToday match:", logDate.toDateString() === now.toDateString());

    // Check timezone offset
    console.log("\nNow ISO:", now.toISOString());
    console.log("Log raw ts:", ts);
    console.log("Timezone offset mins:", now.getTimezoneOffset());
}
main();
