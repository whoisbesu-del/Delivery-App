const express = require('express');
const pool = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');
const router = express.Router();

function toStore(row) {
  return {
    id: row.id, sellerId: row.seller_id, name: row.name, category: row.category,
    address: row.address, description: row.description, logoImage: row.logo_image,
    status: row.status, etaMinutes: row.eta_minutes, createdAt: row.created_at,
  };
}
function toProduct(row) {
  return {
    id: row.id, storeId: row.store_id, name: row.name, description: row.description,
    price: parseFloat(row.price), image: row.image, stock: row.stock,
    status: row.status, createdAt: row.created_at,
  };
}

// --- Public browsing (approved only) ---
router.get('/', async (req, res) => {
  try {
    const { category, q } = req.query;
    let sql = "SELECT * FROM stores WHERE status = 'approved'";
    const params = [];
    if (category) { params.push(category); sql += ` AND LOWER(category) = LOWER($${params.length})`; }
    if (q) { params.push(`%${q}%`); sql += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`; }
    sql += ' ORDER BY id';
    const result = await pool.query(sql, params);
    res.json({ stores: result.rows.map(toStore) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Could not fetch stores.' }); }
});

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ stores: [], products: [] });
    const term = `%${q}%`;
    const storeRes = await pool.query(
      "SELECT * FROM stores WHERE status='approved' AND (name ILIKE $1 OR description ILIKE $1 OR category ILIKE $1) LIMIT 10", [term]);
    const prodRes = await pool.query(
      `SELECT p.*, s.name as store_name, s.category as store_category
       FROM products p JOIN stores s ON s.id = p.store_id
       WHERE p.status='approved' AND s.status='approved'
       AND (p.name ILIKE $1 OR p.description ILIKE $1) LIMIT 20`, [term]);
    res.json({ stores: storeRes.rows.map(toStore), products: prodRes.rows.map(r => ({ ...toProduct(r), storeName: r.store_name, storeCategory: r.store_category })) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Search failed.' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stores WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Store not found.' });
    res.json({ store: toStore(result.rows[0]) });
  } catch (err) { res.status(500).json({ error: 'Could not fetch store.' }); }
});

router.get('/:id/products', async (req, res) => {
  try {
    const showAll = req.query.all === '1'; // sellers see all statuses
    const sql = showAll
      ? 'SELECT * FROM products WHERE store_id = $1 ORDER BY id'
      : "SELECT * FROM products WHERE store_id = $1 AND status = 'approved' ORDER BY id";
    const result = await pool.query(sql, [req.params.id]);
    res.json({ products: result.rows.map(toProduct) });
  } catch (err) { res.status(500).json({ error: 'Could not fetch products.' }); }
});

// --- Seller: manage own store ---
router.get('/seller/mine', authRequired, requireRole('seller'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stores WHERE seller_id = $1', [req.user.id]);
    res.json({ store: result.rows[0] ? toStore(result.rows[0]) : null });
  } catch (err) { res.status(500).json({ error: 'Could not fetch your store.' }); }
});

router.post('/seller/apply', authRequired, requireRole('seller'), async (req, res) => {
  try {
    const existing = await pool.query('SELECT id FROM stores WHERE seller_id = $1', [req.user.id]);
    if (existing.rows.length) return res.status(409).json({ error: 'You already have a store.' });
    const { name, category, address, description, logoImage, etaMinutes } = req.body || {};
    if (!name || !category || !address) return res.status(400).json({ error: 'Name, category and address are required.' });
    const result = await pool.query(
      `INSERT INTO stores (seller_id, name, category, address, description, logo_image, eta_minutes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending') RETURNING *`,
      [req.user.id, name, category, address, description || '', logoImage || null, etaMinutes || 30]);
    res.status(201).json({ store: toStore(result.rows[0]) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Could not create store.' }); }
});

router.put('/seller/store', authRequired, requireRole('seller'), async (req, res) => {
  try {
    const { name, category, address, description, logoImage, etaMinutes } = req.body || {};
    const result = await pool.query(
      `UPDATE stores SET name=COALESCE($1,name), category=COALESCE($2,category),
       address=COALESCE($3,address), description=COALESCE($4,description),
       logo_image=COALESCE($5,logo_image), eta_minutes=COALESCE($6,eta_minutes)
       WHERE seller_id=$7 RETURNING *`,
      [name||null, category||null, address||null, description||null, logoImage||null, etaMinutes||null, req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Store not found.' });
    res.json({ store: toStore(result.rows[0]) });
  } catch (err) { res.status(500).json({ error: 'Could not update store.' }); }
});

// --- Seller: manage products ---
router.post('/seller/products', authRequired, requireRole('seller'), async (req, res) => {
  try {
    const store = await pool.query("SELECT id FROM stores WHERE seller_id=$1 AND status='approved'", [req.user.id]);
    if (!store.rows.length) return res.status(403).json({ error: 'Your store must be approved before adding products.' });
    const { name, description, price, image, stock } = req.body || {};
    if (!name || price == null) return res.status(400).json({ error: 'Name and price are required.' });
    const result = await pool.query(
      `INSERT INTO products (store_id, name, description, price, image, stock, status)
       VALUES ($1,$2,$3,$4,$5,$6,'pending') RETURNING *`,
      [store.rows[0].id, name, description||'', Number(price), image||null, stock||999]);
    res.status(201).json({ product: toProduct(result.rows[0]) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Could not add product.' }); }
});

router.put('/seller/products/:id', authRequired, requireRole('seller'), async (req, res) => {
  try {
    const store = await pool.query('SELECT id FROM stores WHERE seller_id=$1', [req.user.id]);
    if (!store.rows.length) return res.status(404).json({ error: 'Store not found.' });
    const { name, description, price, image, stock } = req.body || {};
    const result = await pool.query(
      `UPDATE products SET name=COALESCE($1,name), description=COALESCE($2,description),
       price=COALESCE($3,price), image=COALESCE($4,image), stock=COALESCE($5,stock), status='pending'
       WHERE id=$6 AND store_id=$7 RETURNING *`,
      [name||null, description||null, price!=null?Number(price):null, image||null, stock!=null?Number(stock):null,
       req.params.id, store.rows[0].id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found.' });
    res.json({ product: toProduct(result.rows[0]) });
  } catch (err) { res.status(500).json({ error: 'Could not update product.' }); }
});

router.delete('/seller/products/:id', authRequired, requireRole('seller'), async (req, res) => {
  try {
    const store = await pool.query('SELECT id FROM stores WHERE seller_id=$1', [req.user.id]);
    if (!store.rows.length) return res.status(404).json({ error: 'Store not found.' });
    await pool.query('DELETE FROM products WHERE id=$1 AND store_id=$2', [req.params.id, store.rows[0].id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Could not delete product.' }); }
});

// --- Admin ---
router.get('/admin/pending', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const stores = await pool.query(
      `SELECT s.*, u.name as seller_name, u.email as seller_email
       FROM stores s LEFT JOIN users u ON u.id=s.seller_id
       WHERE s.status='pending' ORDER BY s.created_at`);
    const products = await pool.query(
      `SELECT p.*, s.name as store_name, u.name as seller_name
       FROM products p JOIN stores s ON s.id=p.store_id LEFT JOIN users u ON u.id=s.seller_id
       WHERE p.status='pending' ORDER BY p.created_at`);
    res.json({ stores: stores.rows, products: products.rows });
  } catch (err) { res.status(500).json({ error: 'Could not fetch pending items.' }); }
});

router.post('/admin/stores/:id/approve', authRequired, requireRole('admin'), async (req, res) => {
  try {
    await pool.query("UPDATE stores SET status='approved', rejection_reason=NULL WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Could not approve store.' }); }
});

router.post('/admin/stores/:id/reject', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const { reason } = req.body || {};
    await pool.query("UPDATE stores SET status='rejected', rejection_reason=$1 WHERE id=$2", [reason||'Not approved.', req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Could not reject store.' }); }
});

router.post('/admin/products/:id/approve', authRequired, requireRole('admin'), async (req, res) => {
  try {
    await pool.query("UPDATE products SET status='approved', rejection_reason=NULL WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Could not approve product.' }); }
});

router.post('/admin/products/:id/reject', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const { reason } = req.body || {};
    await pool.query("UPDATE products SET status='rejected', rejection_reason=$1 WHERE id=$2", [reason||'Not approved.', req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Could not reject product.' }); }
});

// Admin: all stores
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let sql = "SELECT * FROM stores WHERE status='approved'";
    const params = [];
    if (category) { params.push(category); sql += ` AND LOWER(category)=LOWER($1)`; }
    sql += ' ORDER BY id';
    const result = await pool.query(sql, params);
    res.json({ stores: result.rows.map(toStore) });
  } catch (err) { res.status(500).json({ error: 'Could not fetch stores.' }); }
});

module.exports = router;
