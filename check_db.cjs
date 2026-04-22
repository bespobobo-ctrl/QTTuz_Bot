const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    try {
        const { data: rolls, error: rErr } = await supabase.from('warehouse_rolls').select('*').limit(1);
        if (rolls && rolls.length > 0) {
            console.log('Columns in warehouse_rolls:', Object.keys(rolls[0]));
        } else {
            console.log('No rolls found to check columns.');
        }
    } catch (e) {
        console.error('Fatal:', e);
    }
}
check();
