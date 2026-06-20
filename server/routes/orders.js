const express = require('express');
const pool = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
const DELIVERY_FEE = 4.99;
const STATUS_FLOW = ['pending', 'accepted', 'picked_up', 'delivered'];

// Fetches a fully-hydrated order using JOINs — one query for the order +
// store + customer + driver, one for the order items.
async function hydrateOrder(orderId) {
  const orderRes = await pool.query(
    `SELECT
       o.*,
       s.name        AS store_name,
       s.address     AS store_address,
       s.category    AS store_category,
       cu.name       AS customer_name,
       cu.phone      AS customer_phone,
       dr.name       AS driver_name,
       dr.phone      AS driver_phone
     FROM orders o
     LEFT JOIN stores s  ON s.id  = o.store_id
     LEFT JOIN users cu  ON cu.id = o.customer_id
     LEFT JOIN users dr  ON dr.id = o.driver_id
     WHERE o.id = $1`,
    [orderId]
  );
  if (orderRes.rows.length === 0) return null;
  const row = orderRes.rows[0];

  const itemsRes = await pool.query(
    `SELECT oi.id, oi.item_id, oi.price, oi.quantity,
            COALESCE(i.name, 'Item removed') AS name
     FROM order_items oi
     LEFT JOIN items i ON i.id = oi.item_id
     WHERE oi.order_id = $1
     ORDER BY oi.id`,
    [orderId]
  );

  return {
    id: row.id,
    customerId: row.customer_id,
    storeId: row.store_id,
    driverId: row.driver_id,
    status: row.status,
    subtotal: parseFloat(row.subtotal),
    deliveryFee: parseFloat(row.delivery_fee),
    total: parseFloat(row.total),
    deliveryAddress: row.delivery_address,
    acceptedAt: row.accepted_at,
    pickedUpAt: row.picked_up_at,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
    items: itemsRes.rows.map((i) => ({
      id: i.id,
      itemId: i.item_id,
      name: i.name,
      price: parseFloat(i.price),
      quantity: i.quantity,
    })),
    store: row.store_name
      ? { id: row.store_id, name: row.store_name, address: row.store_address, category: row.store_category }
      : null,
    customer: row.customer_name
      ? { id: row.customer_id, name: row.customer_name, phone: row.customer_phone }
      : null,
    driver: row.driver_name
      ? { id: row.driver_id, name: row.driver_name, phone: row.driver_phone }
      : null,
  };
}

function canView(order, user) {
  if (user.role === 'admin') return true;
  if (user.role === 'customer' && order.customerId === user.id) return true;
  if (user.role === 'driver' && order.driverId === user.id) return true;
  return false;
}

// --- Customer: place an order ---
router.post('/', authRequired, requireRole('customer'), async (req, res) => {
  try {
    const { storeId, items, deliveryAddress } = req.body || {};
    if (!storeId || !Array.isArray(items) || items.length === 0 || !deliveryAddress) {
      return res.status(400).json({ error: 'storeId, items, and deliveryAddress are required.' });
    }

    const storeRes = await pool.query('SELECT id FROM stores WHERE id = $1', [storeId]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: 'Store not found.' });

    let subtotal = 0;
    const resolvedItems = [];
    for (const line of items) {
      const itemRes = await pool.query(
        'SELECT * FROM items WHERE id = $1 AND store_id = $2',
        [line.itemId, storeId]
      );
      if (itemRes.rows.length === 0) {
        return res.status(400).json({ error: `Item ${line.itemId} is not on this store's menu.` });
      }
      const item = itemRes.rows[0];
      const quantity = Math.max(1, Number(line.quantity) || 1);
      subtotal += parseFloat(item.price) * quantity;
      resolvedItems.push({ itemId: item.id, price: parseFloat(item.price), quantity });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const total = Math.round((subtotal + DELIVERY_FEE) * 100) / 100;

    const orderRes = await pool.query(
      `INSERT INTO orders (customer_id, store_id, status, subtotal, delivery_fee, total, delivery_address)
       VALUES ($1, $2, 'pending', $3, $4, $5, $6) RETURNING id`,
      [req.user.id, storeId, subtotal, DELIVERY_FEE, total, deliveryAddress]
    );
    const orderId = orderRes.rows[0].id;

    for (const line of resolvedItems) {
      await pool.query(
        'INSERT INTO order_items (order_id, item_id, price, quantity) VALUES ($1, $2, $3, $4)',
        [orderId, line.itemId, line.price, line.quantity]
      );
    }

    const order = await hydrateOrder(orderId);
    res.status(201).json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not place order.' });
  }
});

// --- Customer: my orders ---
router.get('/mine', authRequired, requireRole('customer'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id FROM orders WHERE customer_id = $1 ORDER BY id DESC',
      [req.user.id]
    );
    const orders = await Promise.all(result.rows.map((r) => hydrateOrder(r.id)));
    res.json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch orders.' });
  }
});

// --- Driver: available pool ---
router.get('/available', authRequired, requireRole('driver'), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id FROM orders WHERE status = 'pending' AND driver_id IS NULL ORDER BY id ASC"
    );
    const orders = await Promise.all(result.rows.map((r) => hydrateOrder(r.id)));
    res.json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch available orders.' });
  }
});

// --- Driver: currently active delivery ---
router.get('/driver/active', authRequired, requireRole('driver'), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id FROM orders WHERE driver_id = $1 AND status IN ('accepted', 'picked_up') LIMIT 1",
      [req.user.id]
    );
    if (result.rows.length === 0) return res.json({ order: null });
    const order = await hydrateOrder(result.rows[0].id);
    res.json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch active delivery.' });
  }
});

// --- Driver: history + earnings ---
router.get('/driver/history', authRequired, requireRole('driver'), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, delivery_fee FROM orders WHERE driver_id = $1 AND status = 'delivered' ORDER BY id DESC",
      [req.user.id]
    );
    const earnings = result.rows.reduce((s, r) => s + parseFloat(r.delivery_fee), 0);
    const orders = await Promise.all(result.rows.map((r) => hydrateOrder(r.id)));
    res.json({
      orders,
      earnings: Math.round(earnings * 100) / 100,
      deliveryCount: result.rows.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch driver history.' });
  }
});

// --- Driver: accept an order ---
router.post('/:id/accept', authRequired, requireRole('driver'), async (req, res) => {
  try {
    // Block if driver already has an active delivery
    const activeCheck = await pool.query(
      "SELECT id FROM orders WHERE driver_id = $1 AND status IN ('accepted', 'picked_up') LIMIT 1",
      [req.user.id]
    );
    if (activeCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Finish your current delivery before accepting another.' });
    }

    // Atomic claim: only succeeds if the order is still pending and unclaimed
    const result = await pool.query(
      `UPDATE orders
       SET driver_id = $1, status = 'accepted', accepted_at = NOW()
       WHERE id = $2 AND status = 'pending' AND driver_id IS NULL
       RETURNING id`,
      [req.user.id, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'This order has already been claimed.' });
    }

    const order = await hydrateOrder(result.rows[0].id);
    res.json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not accept order.' });
  }
});

// --- Driver: advance status (accepted → picked_up → delivered) ---
router.put('/:id/status', authRequired, requireRole('driver'), async (req, res) => {
  try {
    const { status } = req.body || {};
    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Order not found.' });
    const order = orderRes.rows[0];

    if (order.driver_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not assigned to this delivery.' });
    }

    const currentIdx = STATUS_FLOW.indexOf(order.status);
    const nextIdx = STATUS_FLOW.indexOf(status);
    if (nextIdx !== currentIdx + 1) {
      return res.status(400).json({ error: `Cannot move from ${order.status} to ${status}.` });
    }

    let sql;
    if (status === 'picked_up') {
      sql = "UPDATE orders SET status = 'picked_up', picked_up_at = NOW() WHERE id = $1 RETURNING id";
    } else if (status === 'delivered') {
      sql = "UPDATE orders SET status = 'delivered', delivered_at = NOW() WHERE id = $1 RETURNING id";
    } else {
      sql = 'UPDATE orders SET status = $2 WHERE id = $1 RETURNING id';
    }
    const updated = await pool.query(sql, [req.params.id]);
    const hydrated = await hydrateOrder(updated.rows[0].id);
    res.json({ order: hydrated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update order status.' });
  }
});

// --- Admin: all orders ---
router.get('/', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT id FROM orders ORDER BY id DESC');
    const orders = await Promise.all(result.rows.map((r) => hydrateOrder(r.id)));
    res.json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch orders.' });
  }
});

// --- Shared: single order (customer/driver who own it, or admin) ---
router.get('/:id', authRequired, async (req, res) => {
  try {
    const order = await hydrateOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (!canView(order, req.user)) {
      return res.status(403).json({ error: 'You do not have access to this order.' });
    }
    res.json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch order.' });
  }
});

module.exports = router;
