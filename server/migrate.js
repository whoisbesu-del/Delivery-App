const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function migrate() {
  // Run schema.sql first (CREATE TABLE IF NOT EXISTS)
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  
  // Split into individual statements and run one by one so one failure
  // doesn't block the rest
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
    } catch (err) {
      // Log but don't crash — some statements may fail on fresh DBs
      // (e.g. ALTER on non-existent columns that were just created)
      console.warn('Migration warning:', err.message.split('\n')[0]);
    }
  }

  // Explicit safe column additions — belt and suspenders
  const safeAlters = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`,
    `ALTER TABLE stores ADD COLUMN IF NOT EXISTS seller_id INTEGER REFERENCES users(id)`,
    `ALTER TABLE stores ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''`,
    `ALTER TABLE stores ADD COLUMN IF NOT EXISTS logo_image TEXT`,
    `ALTER TABLE stores ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'`,
    `ALTER TABLE stores ADD COLUMN IF NOT EXISTS rejection_reason TEXT`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_deadline TIMESTAMPTZ`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS reassignment_count INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid'`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_image TEXT`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_submitted_at TIMESTAMPTZ`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified_by INTEGER`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_rejection_reason TEXT`,
    // Make sure products table exists (in case old DB only has items table)
    `CREATE TABLE IF NOT EXISTS products (
      id               SERIAL PRIMARY KEY,
      store_id         INTEGER       NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      name             TEXT          NOT NULL,
      description      TEXT          NOT NULL DEFAULT '',
      price            NUMERIC(10,2) NOT NULL,
      image            TEXT,
      stock            INTEGER       NOT NULL DEFAULT 999,
      status           TEXT          NOT NULL DEFAULT 'pending',
      rejection_reason TEXT,
      created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
      id         SERIAL PRIMARY KEY,
      order_id   INTEGER       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER       REFERENCES products(id) ON DELETE SET NULL,
      name       TEXT          NOT NULL DEFAULT '',
      price      NUMERIC(10,2) NOT NULL,
      quantity   INTEGER       NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    )`,
    // Add name column to order_items if it doesn't exist (old schema had no name column)
    `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL`,
    // Update role constraint to include seller
    `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`,
    `ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer','driver','admin','seller'))`,
    // Ensure stores have a status value
    `UPDATE stores SET status = 'approved' WHERE status IS NULL`,
  ];

  for (const stmt of safeAlters) {
    try {
      await pool.query(stmt);
    } catch (err) {
      console.warn('Migration warning:', err.message.split('\n')[0]);
    }
  }

  console.log('Database schema is up to date.');
}

module.exports = { migrate };

if (require.main === module) {
  require('dotenv').config();
  migrate()
    .then(() => { console.log('Migration complete.'); process.exit(0); })
    .catch(err => { console.error('Migration failed:', err); process.exit(1); });
}
