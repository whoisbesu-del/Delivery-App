require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { migrate } = require('./migrate');

const authRoutes    = require('./routes/auth');
const storeRoutes   = require('./routes/stores');
const orderRoutes   = require('./routes/orders');
const paymentRoutes = require('./routes/payment');
const chatRoutes    = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'south-shopping' }));

app.get('/api/seed', async (req, res) => {
  const secret = process.env.SEED_SECRET;
  if (!secret || req.query.secret !== secret) return res.status(403).json({ error: 'Forbidden.' });
  try {
    const { execSync } = require('child_process');
    execSync('node seed.js', { cwd: __dirname, stdio: 'inherit' });
    res.json({ ok: true, message: 'Demo data seeded.' });
  } catch (err) { res.status(500).json({ error: 'Seed failed: ' + err.message }); }
});

app.use('/api/auth',    authRoutes);
app.use('/api/stores',  storeRoutes);
app.use('/api/orders',  orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/chat',    chatRoutes);

app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Server error.' }); });

async function start() {
  try {
    await migrate();
    app.listen(PORT, () => console.log(`South Shopping API on http://localhost:${PORT}`));
  } catch (err) { console.error('Startup failed:', err.message); process.exit(1); }
}
start();
