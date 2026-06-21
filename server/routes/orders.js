const express = require('express');
const pool = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');
const router = express.Router();

const DELIVERY_FEE = 4.99;
const PICKUP_MINUTES = 20;
const STATUS_FLOW = ['pending','accepted','picked_up','delivered'];

async function hydrateOrder(orderId) {
  const r = await pool.query(
    `SELECT o.*,
       s.name as store_name, s.address as store_address, s.category as store_category,
       cu.name as customer_name, cu.phone as customer_phone,
       dr.name as driver_name, dr.phone as driver_phone
     FROM orders o
     LEFT JOIN stores s ON s.id=o.store_id
     LEFT JOIN users cu ON cu.id=o.customer_id
     LEFT JOIN users dr ON dr.id=o.driver_id
     WHERE o.id=$1`, [orderId]);
  if (!r.rows.length) return null;
  const row = r.rows[0];
  const items = await pool.query(
    `SELECT oi.*, COALESCE(p.name, oi.name) as product_name, p.image
     FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id
     WHERE oi.order_id=$1 ORDER BY oi.id`, [orderId]);
  return {
    id: row.id, customerId: row.customer_id, storeId: row.store_id, driverId: row.driver_id,
    status: row.status, paymentStatus: row.payment_status,
    subtotal: parseFloat(row.subtotal), deliveryFee: parseFloat(row.delivery_fee), total: parseFloat(row.total),
    deliveryAddress: row.delivery_address, pickupDeadline: row.pickup_deadline,
    reassignmentCount: row.reassignment_count, createdAt: row.created_at,
    acceptedAt: row.accepted_at, pickedUpAt: row.picked_up_at, deliveredAt: row.delivered_at,
    items: items.rows.map(i => ({
      id: i.id, productId: i.product_id, name: i.product_name || i.name,
      price: parseFloat(i.price), quantity: i.quantity, image: i.image
    })),
    store: row.store_name ? { id: row.store_id, name: row.store_name, address: row.store_address, category: row.store_category } : null,
    customer: row.customer_name ? { id: row.customer_id, name: row.customer_name, phone: row.customer_phone } : null,
    driver: row.driver_name ? { id: row.driver_id, name: row.driver_name, phone: row.driver_phone } : null,
  };
}

// Auto-reassign expired pickup deadlines
async function reassignExpired() {
  await pool.query(
    `UPDATE orders SET status='pending', driver_id=NULL, accepted_at=NULL, pickup_deadline=NULL,
     reassignment_count=reassignment_count+1
     WHERE status='accepted' AND pickup_deadline < NOW()`);
}

function canView(order, user) {
  if (user.role === 'admin') return true;
  if (user.role === 'customer' && order.customerId === user.id) return true;
  if (user.role === 'driver' && order.driverId === user.id) return true;
  if (user.role === 'seller') return true; // sellers see all orders for their store (filtered elsewhere)
  return false;
}

// Customer: place order
router.post('/', authRequired, requireRole('customer'), async (req, res) => {
  try {
    const { storeId, items, deliveryAddress } = req.body || {};
    if (!storeId || !Array.isArray(items) || !items.length || !deliveryAddress)
      return res.status(400).json({ error: 'storeId, items and deliveryAddress are required.' });
    const storeRes = await pool.query("SELECT id FROM stores WHERE id=$1 AND status='approved'", [storeId]);
    if (!storeRes.rows.length) return res.status(404).json({ error: 'Store not found.' });
    let subtotal = 0;
    const resolved = [];
    for (const line of items) {
      const p = await pool.query("SELECT * FROM products WHERE id=$1 AND store_id=$2 AND status='approved'", [line.productId, storeId]);
      if (!p.rows.length) return res.status(400).json({ error: `Product ${line.productId} not available.` });
      const qty = Math.max(1, Number(line.quantity) || 1);
      subtotal += parseFloat(p.rows[0].price) * qty;
      resolved.push({ productId: p.rows[0].id, name: p.rows[0].name, price: parseFloat(p.rows[0].price), qty });
    }
    subtotal = Math.round(subtotal * 100) / 100;
    const total = Math.round((subtotal + DELIVERY_FEE) * 100) / 100;
    const orderRes = await pool.query(
      `INSERT INTO orders (customer_id,store_id,status,payment_status,subtotal,delivery_fee,total,delivery_address)
       VALUES ($1,$2,'pending','unpaid',$3,$4,$5,$6) RETURNING id`,
      [req.user.id, storeId, subtotal, DELIVERY_FEE, total, deliveryAddress]);
    const orderId = orderRes.rows[0].id;
    for (const line of resolved) {
      await pool.query('INSERT INTO order_items (order_id,product_id,name,price,quantity) VALUES ($1,$2,$3,$4,$5)',
        [orderId, line.productId, line.name, line.price, line.qty]);
    }
    res.status(201).json({ order: await hydrateOrder(orderId) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Could not place order.' }); }
});

router.get('/mine', authRequired, requireRole('customer'), async (req, res) => {
  try {
    const r = await pool.query('SELECT id FROM orders WHERE customer_id=$1 ORDER BY id DESC', [req.user.id]);
    res.json({ orders: await Promise.all(r.rows.map(x => hydrateOrder(x.id))) });
  } catch (err) { res.status(500).json({ error: 'Could not fetch orders.' }); }
});

// Driver: available pool (auto-reassigns expired ones first)
router.get('/available', authRequired, requireRole('driver'), async (req, res) => {
  try {
    await reassignExpired();
    const r = await pool.query("SELECT id FROM orders WHERE status='pending' AND driver_id IS NULL AND payment_status='verified' ORDER BY id ASC");
    res.json({ orders: await Promise.all(r.rows.map(x => hydrateOrder(x.id))) });
  } catch (err) { res.status(500).json({ error: 'Could not fetch available orders.' }); }
});

router.get('/driver/active', authRequired, requireRole('driver'), async (req, res) => {
  try {
    await reassignExpired();
    const r = await pool.query("SELECT id FROM orders WHERE driver_id=$1 AND status IN ('accepted','picked_up') LIMIT 1", [req.user.id]);
    res.json({ order: r.rows.length ? await hydrateOrder(r.rows[0].id) : null });
  } catch (err) { res.status(500).json({ error: 'Could not fetch active delivery.' }); }
});

router.get('/driver/history', authRequired, requireRole('driver'), async (req, res) => {
  try {
    const r = await pool.query("SELECT id,delivery_fee FROM orders WHERE driver_id=$1 AND status='delivered' ORDER BY id DESC", [req.user.id]);
    const earnings = r.rows.reduce((s, x) => s + parseFloat(x.delivery_fee), 0);
    res.json({ orders: await Promise.all(r.rows.map(x => hydrateOrder(x.id))), earnings: Math.round(earnings*100)/100, deliveryCount: r.rows.length });
  } catch (err) { res.status(500).json({ error: 'Could not fetch history.' }); }
});

router.post('/:id/accept', authRequired, requireRole('driver'), async (req, res) => {
  try {
    await reassignExpired();
    const active = await pool.query("SELECT id FROM orders WHERE driver_id=$1 AND status IN ('accepted','picked_up') LIMIT 1", [req.user.id]);
    if (active.rows.length) return res.status(409).json({ error: 'Finish your current delivery first.' });
    const deadline = new Date(Date.now() + PICKUP_MINUTES * 60 * 1000).toISOString();
    const r = await pool.query(
      `UPDATE orders SET driver_id=$1, status='accepted', accepted_at=NOW(), pickup_deadline=$2
       WHERE id=$3 AND status='pending' AND driver_id IS NULL RETURNING id`,
      [req.user.id, deadline, req.params.id]);
    if (!r.rows.length) return res.status(409).json({ error: 'Order already claimed.' });
    res.json({ order: await hydrateOrder(r.rows[0].id) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Could not accept order.' }); }
});

router.put('/:id/status', authRequired, requireRole('driver'), async (req, res) => {
  try {
    const { status } = req.body || {};
    const orderRes = await pool.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!orderRes.rows.length) return res.status(404).json({ error: 'Order not found.' });
    const order = orderRes.rows[0];
    if (order.driver_id !== req.user.id) return res.status(403).json({ error: 'Not your delivery.' });
    const ci = STATUS_FLOW.indexOf(order.status);
    const ni = STATUS_FLOW.indexOf(status);
    if (ni !== ci + 1) return res.status(400).json({ error: `Cannot move from ${order.status} to ${status}.` });
    let sql;
    if (status === 'picked_up') sql = "UPDATE orders SET status='picked_up', picked_up_at=NOW() WHERE id=$1 RETURNING id";
    else if (status === 'delivered') sql = "UPDATE orders SET status='delivered', delivered_at=NOW() WHERE id=$1 RETURNING id";
    else sql = 'UPDATE orders SET status=$2 WHERE id=$1 RETURNING id';
    const r = await pool.query(sql, [req.params.id]);
    res.json({ order: await hydrateOrder(r.rows[0].id) });
  } catch (err) { res.status(500).json({ error: 'Could not update status.' }); }
});

// Seller: orders for their store
router.get('/seller', authRequired, requireRole('seller'), async (req, res) => {
  try {
    const store = await pool.query('SELECT id FROM stores WHERE seller_id=$1', [req.user.id]);
    if (!store.rows.length) return res.json({ orders: [] });
    const r = await pool.query('SELECT id FROM orders WHERE store_id=$1 ORDER BY id DESC', [store.rows[0].id]);
    res.json({ orders: await Promise.all(r.rows.map(x => hydrateOrder(x.id))) });
  } catch (err) { res.status(500).json({ error: 'Could not fetch orders.' }); }
});

// Admin
router.get('/', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const r = await pool.query('SELECT id FROM orders ORDER BY id DESC');
    res.json({ orders: await Promise.all(r.rows.map(x => hydrateOrder(x.id))) });
  } catch (err) { res.status(500).json({ error: 'Could not fetch orders.' }); }
});

router.get('/:id', authRequired, async (req, res) => {
  try {
    const order = await hydrateOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (!canView(order, req.user)) return res.status(403).json({ error: 'Access denied.' });
    res.json({ order });
  } catch (err) { res.status(500).json({ error: 'Could not fetch order.' }); }
});

module.exports = router;
