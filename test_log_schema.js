import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
    console.log("Testing insert with item_name...");
    const r1 = await supabase.from('warehouse_log').insert({ item_name: 'test' });
    if (r1.error) console.log("item_name error:", r1.error.message);
    else console.log("item_name worked!");

    console.log("Testing insert with action_type...");
    const r2 = await supabase.from('warehouse_log').insert({ action_type: 'test' });
    if (r2.error) console.log("action_type error:", r2.error.message);
    else console.log("action_type worked!");
}
test();
