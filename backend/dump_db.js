const { Client } = require('pg');
const fs = require('fs');
const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/session_planner' });

async function check() {
  try {
    await client.connect();
    const res = await client.query('SELECT id, name, start_date::text, end_date::text FROM conferences');
    fs.writeFileSync('db_dump.txt', JSON.stringify(res.rows, null, 2));
    const rooms = await client.query('SELECT * FROM rooms');
    fs.appendFileSync('db_dump.txt', '\nROOMS:\n' + JSON.stringify(rooms.rows, null, 2));
    process.exit(0);
  } catch (err) {
    fs.writeFileSync('db_dump.txt', 'ERROR: ' + err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}
check();
