const express = require('express');
const pool = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Store payment settings in a simple JSON file (no extra DB table needed)
const SETTINGS_PATH = path.join(__dirname, '..', 'data', 'payment_settings.json');

function loadSettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return {};
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  } catch { return {}; }
}

function saveSettings(data) {
  const dir = path.dirname(SETTINGS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2));
}

// --- Get payment settings (public — customers need to see bank details) ---
router.get('/settings', (req, res) => {
  res.json({ settings: loadSettings() });
});

// --- Admin: update payment settings ---
router.put('/settings', authRequired, requireRole('admin'), (req, res) => {
  const { bankName, accountNumber, accountHolder, instructions } = req.body || {};
  const current = loadSettings();
  const updated = {
    ...current,
    bankName: bankName ?? current.bankName ?? '',
    accountNumber: accountNumber ?? current.accountNumber ?? '',
    accountHolder: accountHolder ?? current.accountHolder ?? '',
    instructions: instructions ?? current.instructions ?? '',
    updatedAt: new Date().toISOString(),
  };
  saveSettings(updated);
  res.json({ settings: updated });
});

// --- Customer: submit receipt (base64 image stored in DB) ---
router.post('/receipt/:orderId', authRequired, requireRole('customer'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { receiptImage } = req.body || {}; // base64 data URL

    if (!receiptImage) {
      return res.status(400).json({ error: 'Receipt image is required.' });
    }

    // Verify order belongs to this customer
    const orderRes = await pool.query(
      'SELECT id, customer_id, payment_status FROM orders WHERE id = $1',
      [orderId]
    );
    if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Order not found.' });
    const order = orderRes.rows[0];
    if (order.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your order.' });
    }

    await pool.query(
      `UPDATE orders SET receipt_image = $1, payment_status = 'pending_verification', receipt_submitted_at = NOW() WHERE id = $2`,
      [receiptImage, orderId]
    );

    res.json({ ok: true, message: 'Receipt submitted. Admin will verify within 5 minutes.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not submit receipt.' });
  }
});

// --- Admin: get orders pending payment verification ---
router.get('/pending', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.id, o.total, o.delivery_address, o.payment_status, o.receipt_submitted_at,
              u.name as customer_name, u.email as customer_email,
              s.name as store_name
       FROM orders o
       LEFT JOIN users u ON u.id = o.customer_id
       LEFT JOIN stores s ON s.id = o.store_id
       WHERE o.payment_status = 'pending_verification'
       ORDER BY o.receipt_submitted_at ASC`,
      []
    );
    res.json({ orders: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch pending payments.' });
  }
});

// --- Admin: get receipt image for an order ---
router.get('/receipt/:orderId', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT receipt_image FROM orders WHERE id = $1',
      [req.params.orderId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found.' });
    res.json({ receiptImage: result.rows[0].receipt_image });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch receipt.' });
  }
});

// --- Admin: verify payment → order becomes active ---
router.post('/verify/:orderId', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE orders SET payment_status = 'verified', payment_verified_at = NOW(), payment_verified_by = $1
       WHERE id = $2 AND payment_status = 'pending_verification'
       RETURNING id`,
      [req.user.id, req.params.orderId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found or already verified.' });
    }
    res.json({ ok: true, message: 'Payment verified. Order is now active.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not verify payment.' });
  }
});

// --- Admin: reject payment ---
router.post('/reject/:orderId', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const { reason } = req.body || {};
    const result = await pool.query(
      `UPDATE orders SET payment_status = 'rejected', payment_rejection_reason = $1
       WHERE id = $2 AND payment_status = 'pending_verification'
       RETURNING id`,
      [reason || 'Payment could not be confirmed.', req.params.orderId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found or already processed.' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not reject payment.' });
  }
});

module.exports = router;
