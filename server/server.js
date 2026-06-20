require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { migrate } = require('./migrate');

const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/stores');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'relay-server' }));
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/orders', orderRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// Run schema migration then start listening.
// migrate() uses CREATE TABLE IF NOT EXISTS so it is always safe to run.
async function start() {
  try {
    await migrate();
    app.listen(PORT, () => {
      console.log(`Relay API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Startup failed:', err.message);
    process.exit(1);
  }
}

start();
