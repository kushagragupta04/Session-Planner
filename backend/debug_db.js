const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgres://postgres:postgres@localhost:5432/session_planner",
});

async function check() {
    try {
        const res = await pool.query('SELECT * FROM conferences');
        console.log('CONFERENCES_RESULT:', JSON.stringify(res.rows));
        
        const rooms = await pool.query('SELECT count(*) FROM rooms');
        console.log('ROOMS_COUNT:', rooms.rows[0].count);
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await pool.end();
    }
}
check();
