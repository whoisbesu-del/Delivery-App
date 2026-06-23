const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authRequired, JWT_SECRET } = require('../middleware/auth');
const { sendOTP } = require('../mailer');

const router = express.Router();
const VALID_ROLES = ['customer', 'driver', 'seller'];

function toPublicUser(row) {
  return { id:row.id, name:row.name, email:row.email, role:row.role, phone:row.phone,
    emailVerified:row.email_verified, createdAt:row.created_at };
}

function signToken(user) {
  return jwt.sign({ id:user.id, role:user.role, name:user.name, email:user.email }, JWT_SECRET, { expiresIn:'30d' });
}

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Check if admin exists
router.get('/setup-status', async (req, res) => {
  try {
    const r = await pool.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
    res.json({ adminExists: r.rows.length > 0 });
  } catch { res.status(500).json({ error: 'Could not check setup status.' }); }
});

// First-time admin setup
router.post('/setup', async (req, res) => {
  try {
    const existing = await pool.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
    if (existing.rows.length > 0) return res.status(403).json({ error: 'Setup already completed.' });
    const { name, email, password, phone } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    const taken = await pool.query('SELECT id FROM users WHERE LOWER(email)=LOWER($1)', [email]);
    if (taken.rows.length) return res.status(409).json({ error: 'Email already in use.' });
    const hash = bcrypt.hashSync(password, 10);
    const r = await pool.query(
      'INSERT INTO users (name,email,password_hash,role,phone,email_verified) VALUES ($1,LOWER($2),$3,$4,$5,TRUE) RETURNING *',
      [name, email, hash, 'admin', phone||null]
    );
    res.status(201).json({ token: signToken(r.rows[0]), user: toPublicUser(r.rows[0]) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Setup failed.' }); }
});

// Register — sends OTP
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body || {};
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'All fields are required.' });
    if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });

    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email)=LOWER($1)', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'An account with that email already exists.' });

    const hash = bcrypt.hashSync(password, 10);
    const r = await pool.query(
      'INSERT INTO users (name,email,password_hash,role,phone,email_verified) VALUES ($1,LOWER($2),$3,$4,$5,FALSE) RETURNING *',
      [name, email, hash, role, phone||null]
    );
    const user = r.rows[0];

    // Generate and send OTP
    const otp = generateOTP();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await pool.query('DELETE FROM verification_tokens WHERE user_id=$1', [user.id]);
    await pool.query('INSERT INTO verification_tokens (user_id,token,expires_at) VALUES ($1,$2,$3)', [user.id, otp, expires]);

    try { await sendOTP(user.email, user.name, otp); }
    catch (mailErr) { console.error('Email send failed:', mailErr.message); }

    // Return token so user is logged in but not verified
    res.status(201).json({ token: signToken(user), user: toPublicUser(user), requiresVerification: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Registration failed.' }); }
});

// Verify OTP
router.post('/verify-otp', authRequired, async (req, res) => {
  try {
    const { otp } = req.body || {};
    if (!otp) return res.status(400).json({ error: 'OTP is required.' });
    const r = await pool.query(
      'SELECT * FROM verification_tokens WHERE user_id=$1 AND token=$2 AND expires_at > NOW()',
      [req.user.id, String(otp).trim()]
    );
    if (!r.rows.length) return res.status(400).json({ error: 'Invalid or expired code. Request a new one.' });
    await pool.query('UPDATE users SET email_verified=TRUE WHERE id=$1', [req.user.id]);
    await pool.query('DELETE FROM verification_tokens WHERE user_id=$1', [req.user.id]);
    const user = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    res.json({ user: toPublicUser(user.rows[0]), verified: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Verification failed.' }); }
});

// Resend OTP
router.post('/resend-otp', authRequired, async (req, res) => {
  try {
    const userR = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    const user = userR.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.email_verified) return res.status(400).json({ error: 'Email already verified.' });
    const otp = generateOTP();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query('DELETE FROM verification_tokens WHERE user_id=$1', [user.id]);
    await pool.query('INSERT INTO verification_tokens (user_id,token,expires_at) VALUES ($1,$2,$3)', [user.id, otp, expires]);
    try { await sendOTP(user.email, user.name, otp); }
    catch (mailErr) { console.error('Email send failed:', mailErr.message); }
    res.json({ ok: true, message: 'New code sent.' });
  } catch (err) { res.status(500).json({ error: 'Could not resend code.' }); }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const r = await pool.query('SELECT * FROM users WHERE LOWER(email)=LOWER($1)', [email]);
    const user = r.rows[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    res.json({ token: signToken(user), user: toPublicUser(user),
      requiresVerification: !user.email_verified });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Login failed.' }); }
});

router.get('/me', authRequired, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: toPublicUser(r.rows[0]) });
  } catch { res.status(500).json({ error: 'Could not fetch user.' }); }
});

module.exports = router;
