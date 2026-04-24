const { createClient } = require('@supabase/supabase-js');
const s = createClient(
    "https://woonyxwygwwnhnghqihu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU"
);

async function testInsert() {
    const { error } = await s.from('warehouse_log').insert({
        batch_id: null,
        item_name: `TEST INSERT LOG`,
        quantity: 123,
        action_type: 'KIRIM'
    });
    if (error) {
        console.log("INSERT ERROR:", error);
    } else {
        console.log("INSERT SUCCESS!");
    }
}
testInsert();
