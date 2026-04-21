const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function update() {
    const { error } = await supabase.from('system_config').update({ value: '12.1 WAREHOUSE-NETO-PRO' }).eq('key', 'app_version');
    if (error) console.error(error);
    else console.log('Updated DB version to 12.1 WAREHOUSE-NETO-PRO');
}
update();
