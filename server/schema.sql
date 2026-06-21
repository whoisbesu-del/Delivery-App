-- South Shopping schema
-- All CREATE TABLE use IF NOT EXISTS — safe to run on every startup.
-- ALTER TABLE statements handle existing deployments.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'customer',
  phone         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
  id               SERIAL PRIMARY KEY,
  seller_id        INTEGER     REFERENCES users(id),
  name             TEXT        NOT NULL,
  category         TEXT        NOT NULL,
  address          TEXT        NOT NULL,
  description      TEXT        NOT NULL DEFAULT '',
  logo_image       TEXT,
  status           TEXT        NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  eta_minutes      INTEGER     NOT NULL DEFAULT 30,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
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
);

CREATE TABLE IF NOT EXISTS orders (
  id                       SERIAL PRIMARY KEY,
  customer_id              INTEGER       NOT NULL REFERENCES users(id),
  store_id                 INTEGER       NOT NULL REFERENCES stores(id),
  driver_id                INTEGER       REFERENCES users(id),
  status                   TEXT          NOT NULL DEFAULT 'pending',
  payment_status           TEXT          NOT NULL DEFAULT 'unpaid',
  subtotal                 NUMERIC(10,2) NOT NULL,
  delivery_fee             NUMERIC(10,2) NOT NULL,
  total                    NUMERIC(10,2) NOT NULL,
  delivery_address         TEXT          NOT NULL,
  receipt_image            TEXT,
  receipt_submitted_at     TIMESTAMPTZ,
  payment_verified_at      TIMESTAMPTZ,
  payment_verified_by      INTEGER       REFERENCES users(id),
  payment_rejection_reason TEXT,
  pickup_deadline          TIMESTAMPTZ,
  reassignment_count       INTEGER       NOT NULL DEFAULT 0,
  accepted_at              TIMESTAMPTZ,
  picked_up_at             TIMESTAMPTZ,
  delivered_at             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER       REFERENCES products(id) ON DELETE SET NULL,
  name       TEXT          NOT NULL,
  price      NUMERIC(10,2) NOT NULL,
  quantity   INTEGER       NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stores_seller_id     ON stores(seller_id);
CREATE INDEX IF NOT EXISTS idx_stores_status        ON stores(status);
CREATE INDEX IF NOT EXISTS idx_products_store_id    ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_status      ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id   ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id     ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Safe migration for existing deployments
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS seller_id INTEGER REFERENCES users(id);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS logo_image TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_deadline TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reassignment_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_image TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_submitted_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified_by INTEGER REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_rejection_reason TEXT;

-- Rename items → products if items table exists (migrate old data)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'items') THEN
    -- Create products from items if products is empty
    INSERT INTO products (store_id, name, description, price, status, created_at)
    SELECT store_id, name, description, price, 'approved', created_at
    FROM items
    WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Drop stale role constraint and re-add with seller included
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('customer','driver','admin','seller'));

-- Chat system
CREATE TABLE IF NOT EXISTS conversations (
  id           SERIAL PRIMARY KEY,
  type         TEXT NOT NULL, -- 'buyer_seller', 'buyer_driver', 'support'
  order_id     INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  participant1 INTEGER NOT NULL REFERENCES users(id),
  participant2 INTEGER NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id, participant1, participant2)
);

CREATE TABLE IF NOT EXISTS messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       INTEGER NOT NULL REFERENCES users(id),
  body            TEXT NOT NULL,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON conversations(participant1);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON conversations(participant2);
