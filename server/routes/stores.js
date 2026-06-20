const express = require('express');
const pool = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

function toStore(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    address: row.address,
    imageUrl: row.image_url,
    etaMinutes: row.eta_minutes,
    createdAt: row.created_at,
  };
}

function toItem(row) {
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    description: row.description,
    price: parseFloat(row.price),
    imageUrl: row.image_url,
    createdAt: row.created_at,
  };
}

// --- Public / customer browsing ---

router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let result;
    if (category) {
      result = await pool.query(
        'SELECT * FROM stores WHERE LOWER(category) = LOWER($1) ORDER BY id',
        [category]
      );
    } else {
      result = await pool.query('SELECT * FROM stores ORDER BY id');
    }
    res.json({ stores: result.rows.map(toStore) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch stores.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stores WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Store not found.' });
    res.json({ store: toStore(result.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch store.' });
  }
});

router.get('/:id/items', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM items WHERE store_id = $1 ORDER BY id',
      [req.params.id]
    );
    res.json({ items: result.rows.map(toItem) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch items.' });
  }
});

// --- Admin management ---

router.post('/', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const { name, category, address, imageUrl, etaMinutes } = req.body || {};
    if (!name || !category || !address) {
      return res.status(400).json({ error: 'Name, category, and address are required.' });
    }
    const result = await pool.query(
      `INSERT INTO stores (name, category, address, image_url, eta_minutes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, category, address, imageUrl || null, etaMinutes || 30]
    );
    res.status(201).json({ store: toStore(result.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create store.' });
  }
});

router.put('/:id', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const { name, category, address, imageUrl, etaMinutes } = req.body || {};
    const result = await pool.query(
      `UPDATE stores
       SET name        = COALESCE($1, name),
           category    = COALESCE($2, category),
           address     = COALESCE($3, address),
           image_url   = COALESCE($4, image_url),
           eta_minutes = COALESCE($5, eta_minutes)
       WHERE id = $6 RETURNING *`,
      [name || null, category || null, address || null, imageUrl || null, etaMinutes || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Store not found.' });
    res.json({ store: toStore(result.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update store.' });
  }
});

router.delete('/:id', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM stores WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Store not found.' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete store.' });
  }
});

router.post('/:id/items', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const storeRes = await pool.query('SELECT id FROM stores WHERE id = $1', [req.params.id]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: 'Store not found.' });
    const { name, description, price, imageUrl } = req.body || {};
    if (!name || price == null) {
      return res.status(400).json({ error: 'Name and price are required.' });
    }
    const result = await pool.query(
      `INSERT INTO items (store_id, name, description, price, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.id, name, description || '', Number(price), imageUrl || null]
    );
    res.status(201).json({ item: toItem(result.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create item.' });
  }
});

router.put('/items/:itemId', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, price, imageUrl } = req.body || {};
    const result = await pool.query(
      `UPDATE items
       SET name        = COALESCE($1, name),
           description = COALESCE($2, description),
           price       = COALESCE($3, price),
           image_url   = COALESCE($4, image_url)
       WHERE id = $5 RETURNING *`,
      [name || null, description || null, price != null ? Number(price) : null, imageUrl || null, req.params.itemId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found.' });
    res.json({ item: toItem(result.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update item.' });
  }
});

router.delete('/items/:itemId', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING id', [req.params.itemId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found.' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete item.' });
  }
});

module.exports = router;
