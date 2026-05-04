const { Client } = require('pg');

const client = new Client({
  host: 'db-zelify.cslsykku6bft.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'zelify_auth_service',
  user: 'postgres',
  password: 'ZeliTes3sOPoS',
  ssl: false
});

async function check() {
  try {
    await client.connect();
    console.log('--- Webhooks ---');
    const wh = await client.query('SELECT id, url, event, organization_id, is_active FROM webhooks');
    console.table(wh.rows);

    console.log('--- Delivery Logs ---');
    const logs = await client.query('SELECT * FROM webhook_delivery_logs ORDER BY created_at DESC LIMIT 10');
    console.table(logs.rows);

    await client.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
