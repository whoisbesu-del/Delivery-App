-- Relay database schema
-- Uses CREATE TABLE IF NOT EXISTS throughout so this is safe to run on every
-- server startup without losing existing data.

CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  name         TEXT        NOT NULL,
  email        TEXT        NOT NULL UNIQUE,
  password_hash TEXT       NOT NULL,
  role         TEXT        NOT NULL CHECK (role IN ('customer', 'driver', 'admin')),
  phone        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
  id          SERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  category    TEXT        NOT NULL,
  address     TEXT        NOT NULL,
  image_url   TEXT,
  eta_minutes INTEGER     NOT NULL DEFAULT 30,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
  id          SERIAL PRIMARY KEY,
  store_id    INTEGER     NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  price       NUMERIC(10,2) NOT NULL,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id                       SERIAL PRIMARY KEY,
  customer_id              INTEGER       NOT NULL REFERENCES users(id),
  store_id                 INTEGER       NOT NULL REFERENCES stores(id),
  driver_id                INTEGER       REFERENCES users(id),
  status                   TEXT          NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','accepted','picked_up','delivered')),
  payment_status           TEXT          NOT NULL DEFAULT 'unpaid'
                             CHECK (payment_status IN ('unpaid','pending_verification','verified','rejected')),
  subtotal                 NUMERIC(10,2) NOT NULL,
  delivery_fee             NUMERIC(10,2) NOT NULL,
  total                    NUMERIC(10,2) NOT NULL,
  delivery_address         TEXT          NOT NULL,
  receipt_image            TEXT,
  receipt_submitted_at     TIMESTAMPTZ,
  payment_verified_at      TIMESTAMPTZ,
  payment_verified_by      INTEGER       REFERENCES users(id),
  payment_rejection_reason TEXT,
  accepted_at              TIMESTAMPTZ,
  picked_up_at             TIMESTAMPTZ,
  delivered_at             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id    INTEGER       REFERENCES items(id) ON DELETE SET NULL,
  price      NUMERIC(10,2) NOT NULL,
  quantity   INTEGER       NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_items_store_id        ON items(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id    ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id      ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status         ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id  ON order_items(order_id);

-- Payment columns for existing deployments (safe to run on already-created tables)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_image TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_submitted_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified_by INTEGER REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_rejection_reason TEXT;
