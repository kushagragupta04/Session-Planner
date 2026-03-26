const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/session_planner' });

async function check() {
  try {
    await client.connect();
    const res = await client.query('SELECT name, start_date::text, end_date::text FROM conferences');
    console.log('CONFERENCES:', JSON.stringify(res.rows));
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await client.end();
  }
}
check();
