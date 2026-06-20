// db.js — PostgreSQL connection pool.
// All routes import this pool and call pool.query(sql, params) directly.
// The DATABASE_URL environment variable is set automatically by Render
// when you link a PostgreSQL database to your web service.

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render's internal Postgres URLs don't need SSL, but external ones do.
  // This setting handles both safely.
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')
    ? false
    : process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

module.exports = pool;
