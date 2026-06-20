// migrate.js
// Reads schema.sql and runs it against the connected database.
// All statements use IF NOT EXISTS so this is completely safe to call
// on every startup — it won't touch existing data.

const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Database schema is up to date.');
}

module.exports = { migrate };

// Allow running directly: node migrate.js
if (require.main === module) {
  require('dotenv').config();
  migrate()
    .then(() => { console.log('Migration complete.'); process.exit(0); })
    .catch((err) => { console.error('Migration failed:', err); process.exit(1); });
}
