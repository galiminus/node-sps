const { Pool } = require('pg')
const process = require('process');

exports.pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
