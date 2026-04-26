const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function initOrders() {
    const exampleOrder = {
        customer_name: 'Alisher',
        fabric_type: 'TR',
        total_quantity: 2000,
        status: 'PENDING',
        details: JSON.stringify([
            { model: 'Model A', color: 'Qora', qty: 80 },
            { model: 'Model B', color: 'To\'q Ko\'k', qty: 60 },
            { model: 'Model C', color: 'Kulrang', qty: 40 },
            { model: 'Model D', color: 'Qizil', qty: 10 },
            { model: 'Model E', color: 'Bordo', qty: 10 }
        ]),
        created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('warehouse_orders').insert(exampleOrder);
    if (error) console.error('Error inserting order:', error);
    else console.log('Example order created for Alisher!');
}

initOrders();
