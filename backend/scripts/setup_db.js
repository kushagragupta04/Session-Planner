const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    user: process.env.DB_USER,
    host: '127.0.0.1', // Force IPv4
    database: 'postgres', // Connect to default DB first
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
});

async function main() {
    console.log(`Connecting to database... User: ${process.env.DB_USER}, Host: 127.0.0.1, Port: ${process.env.DB_PORT}`);
    try {
        await client.connect();
        console.log('Connected to default postgres database successfully.');

        // Check if session_planner exists
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`);
        if (res.rowCount === 0) {
            console.log(`Database ${process.env.DB_NAME} does not exist. Creating it...`);
            await client.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
            console.log(`Database ${process.env.DB_NAME} created successfully.`);
        } else {
            console.log(`Database ${process.env.DB_NAME} already exists.`);
        }
    } catch (err) {
        console.error('Connection error details:', err);
    } finally {
        await client.end();
    }
}

main();
