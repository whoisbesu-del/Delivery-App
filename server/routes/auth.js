const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authRequired, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const VALID_ROLES = ['customer', 'driver', 'seller'];

function toPublicUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role, phone: row.phone, createdAt: row.created_at };
}

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
}

// Check if any admin exists — used by frontend to show/hide setup screen
router.get('/setup-status', async (req, res) => {
  try {
    const result = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    res.json({ adminExists: result.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: 'Could not check setup status.' });
  }
});

// One-time admin setup — only works if no admin exists yet
router.post('/setup', async (req, res) => {
  try {
    const existing = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (existing.rows.length > 0) {
      return res.status(403).json({ error: 'Setup already completed. An admin account already exists.' });
    }
    const { name, email, password, phone } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const taken = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (taken.rows.length > 0) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    const passwordHash = bcrypt.hashSync(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES ($1, LOWER($2), $3, $4, $5) RETURNING *',
      [name, email, passwordHash, 'admin', phone || null]
    );
    const user = result.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Setup failed. Try again.' });
  }
});

// Normal registration — customer, seller, driver only
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body || {};
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password and role are required.' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Role must be customer, seller or driver.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    const passwordHash = bcrypt.hashSync(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES ($1, LOWER($2), $3, $4, $5) RETURNING *',
      [name, email, passwordHash, role, phone || null]
    );
    const user = result.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed. Try again.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    const user = result.rows[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    const token = signToken(user);
    res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed. Try again.' });
  }
});

router.get('/me', authRequired, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: toPublicUser(result.rows[0]) });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch user.' });
  }
});

module.exports = router;
