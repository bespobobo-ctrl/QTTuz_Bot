const SUPABASE_URL = "https://woonyxwygwwnhnghqihu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb255eHd5Z3d3bmhuZ2hxaWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTk3NTUsImV4cCI6MjA5MjIzNTc1NX0.JmxloO9JSLkrJXY_S1WmWlIecSHqCzq1idygtHhlxwU";

async function cleanup() {
    try {
        console.log("Cleaning up all non-BRUTO rolls...");
        const response = await fetch(`${SUPABASE_URL}/rest/v1/warehouse_rolls?status=neq.BRUTO`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log("Success! All inspected rolls have been deleted.");
        } else {
            const error = await response.text();
            console.error("Error:", error);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}
cleanup();
