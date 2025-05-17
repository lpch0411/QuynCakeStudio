const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'quyncake123',
  database: 'cakes',
  host: '/cloudsql/quyn-cake-studio:asia-southeast1:admin',
  port: 5432,
});

module.exports = pool;
