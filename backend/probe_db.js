const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:postgres@db:5432/session_planner' });

async function check() {
  try {
    await client.connect();
    const res = await client.query('SELECT count(*) FROM tracks');
    console.log('TRACK_COUNT:', res.rows[0].count);
    const tracks = await client.query('SELECT * FROM tracks');
    console.log('TRACKS:', JSON.stringify(tracks.rows));
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await client.end();
  }
}
check();
