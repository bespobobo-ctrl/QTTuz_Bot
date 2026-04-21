const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    try {
        const { data: batches, error: bErr } = await supabase.from('warehouse_batches').select('*');
        const { data: rolls, error: rErr } = await supabase.from('warehouse_rolls').select('*');
        const { data: ver, error: vErr } = await supabase.from('system_config').select('*').eq('key', 'app_version').single();

        console.log('Batches count:', batches ? batches.length : 'null');
        console.log('Rolls count:', rolls ? rolls.length : 'null');
        console.log('DB Version:', ver ? ver.value : 'null');
        if (bErr || rErr || vErr) {
            console.log('Errors:', { bErr, rErr, vErr });
        }
    } catch (e) {
        console.error('Fatal:', e);
    }
}

check();
