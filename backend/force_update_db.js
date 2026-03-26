const { Client } = require('pg');
const fs = require('fs');

async function update() {
    const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/session_planner' });
    try {
        console.log('Connecting...');
        await client.connect();
        console.log('Connected. Updating...');
        
        // Let's set the conference to a wide range to solve this once and for all
        const res = await client.query("UPDATE conferences SET start_date = '2026-03-10', end_date = '2026-03-25'");
        console.log('Update result:', res.rowCount);
        
        const dump = await client.query("SELECT * FROM conferences");
        console.log('Final data:', JSON.stringify(dump.rows));
        
        fs.writeFileSync('db_status.txt', 'SUCCESS: ' + JSON.stringify(dump.rows));
    } catch (err) {
        console.error('ERROR:', err.message);
        fs.writeFileSync('db_status.txt', 'FAILURE: ' + err.message);
    } finally {
        await client.end();
    }
}

update();
