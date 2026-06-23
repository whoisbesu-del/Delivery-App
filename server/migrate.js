const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function migrate() {
  // Run each statement individually, logging warnings
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 5 && !s.startsWith('--'));

  for (const stmt of statements) {
    try { await pool.query(stmt); }
    catch (err) { console.warn('Migration warning:', err.message.split('\n')[0]); }
  }

  // Belt-and-suspenders: explicit safe column additions
  const alters = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE`,
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
    `CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price NUMERIC(10,2) NOT NULL,
      image TEXT,
      stock INTEGER NOT NULL DEFAULT 999,
      status TEXT NOT NULL DEFAULT 'pending',
      rejection_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      name TEXT NOT NULL DEFAULT '',
      price NUMERIC(10,2) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL`,
    // Copy old items → products if products is empty
    `INSERT INTO products (store_id, name, description, price, status, created_at)
     SELECT store_id, name, COALESCE(description,''), price, 'approved', created_at
     FROM items
     WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1)
     ON CONFLICT DO NOTHING`,
    // Chat tables
    `CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'support',
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      participant1 INTEGER NOT NULL REFERENCES users(id),
      participant2 INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    // Verification tokens
    `CREATE TABLE IF NOT EXISTS verification_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(6) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id)`,
    `CREATE INDEX IF NOT EXISTS idx_conv_p1 ON conversations(participant1)`,
    `CREATE INDEX IF NOT EXISTS idx_conv_p2 ON conversations(participant2)`,
    `CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id)`,
    `CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)`,
    `UPDATE stores SET status='approved' WHERE status IS NULL OR status=''`,
    `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`,
    `ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer','driver','admin','seller'))`,
  ];

  for (const stmt of alters) {
    try { await pool.query(stmt); }
    catch (err) { console.warn('Migration warning:', err.message.split('\n')[0]); }
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
