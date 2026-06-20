// seed.js — populates the database with demo stores, menus, and three users.
// Run with: npm run seed
// WIPES existing stores, items, and users before inserting fresh demo data.
// Safe to re-run whenever you want a clean slate.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { migrate } = require('./migrate');
const pool = require('./db');

const DEMO_USERS = [
  { name: 'Avery Admin', email: 'admin@relay.app', password: 'password123', role: 'admin', phone: '555-0100' },
  { name: 'Sam Driver', email: 'driver@relay.app', password: 'password123', role: 'driver', phone: '555-0101' },
  { name: 'Casey Customer', email: 'customer@relay.app', password: 'password123', role: 'customer', phone: '555-0102' },
];

const CATALOG = [
  {
    store: { name: 'Basil & Bone', category: 'Restaurant', address: '12 Market St', eta_minutes: 35 },
    items: [
      { name: 'Margherita Pizza', description: 'San Marzano tomato, fresh mozzarella, basil', price: 14.50 },
      { name: 'Chicken Parm Sub', description: 'Breaded chicken, marinara, provolone', price: 11.00 },
      { name: 'Caesar Salad', description: 'Romaine, parmesan, garlic croutons', price: 8.50 },
      { name: 'Tiramisu', description: 'Espresso-soaked ladyfingers, mascarpone', price: 6.00 },
    ],
  },
  {
    store: { name: 'GreenCart Grocery', category: 'Grocery', address: '88 Oak Ave', eta_minutes: 45 },
    items: [
      { name: 'Organic Bananas (bunch)', description: 'About 6 bananas', price: 2.50 },
      { name: 'Whole Milk, 1 gal', description: 'Local dairy', price: 3.80 },
      { name: 'Sourdough Loaf', description: 'Baked fresh daily', price: 4.20 },
      { name: 'Free-range Eggs (dozen)', description: 'Grade A large', price: 5.10 },
    ],
  },
  {
    store: { name: 'CornerStone Pharmacy', category: 'Pharmacy', address: '5 Elm St', eta_minutes: 25 },
    items: [
      { name: 'Pain Relief Tablets', description: '500mg, 50 count', price: 6.99 },
      { name: 'Allergy Relief', description: '24-hour, 30 count', price: 9.49 },
      { name: 'First Aid Kit', description: 'Compact home kit', price: 12.00 },
      { name: 'Vitamin C 1000mg', description: '100 count', price: 7.25 },
    ],
  },
  {
    store: { name: 'QuickShip Courier', category: 'Courier', address: '200 Industrial Way', eta_minutes: 60 },
    items: [
      { name: 'Small Package (up to 2kg)', description: 'Same-day local courier', price: 8.00 },
      { name: 'Medium Package (up to 10kg)', description: 'Same-day local courier', price: 14.00 },
      { name: 'Large Package (up to 25kg)', description: 'Same-day local courier', price: 22.00 },
      { name: 'Document Envelope', description: 'Letters & documents only', price: 5.00 },
    ],
  },
];

async function seed() {
  await migrate();

  console.log('Clearing existing data…');
  await pool.query('DELETE FROM order_items');
  await pool.query('DELETE FROM orders');
  await pool.query('DELETE FROM items');
  await pool.query('DELETE FROM stores');
  await pool.query('DELETE FROM users');
  // Reset sequences so IDs start from 1 again
  for (const seq of ['users', 'stores', 'items', 'orders', 'order_items']) {
    await pool.query(`ALTER SEQUENCE ${seq}_id_seq RESTART WITH 1`);
  }

  console.log('Creating demo users…');
  for (const u of DEMO_USERS) {
    const hash = bcrypt.hashSync(u.password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES ($1, $2, $3, $4, $5)',
      [u.name, u.email.toLowerCase(), hash, u.role, u.phone]
    );
  }

  console.log('Creating stores and menu items…');
  for (const entry of CATALOG) {
    const storeRes = await pool.query(
      'INSERT INTO stores (name, category, address, eta_minutes) VALUES ($1, $2, $3, $4) RETURNING id',
      [entry.store.name, entry.store.category, entry.store.address, entry.store.eta_minutes]
    );
    const storeId = storeRes.rows[0].id;
    for (const item of entry.items) {
      await pool.query(
        'INSERT INTO items (store_id, name, description, price) VALUES ($1, $2, $3, $4)',
        [storeId, item.name, item.description, item.price]
      );
    }
  }

  console.log('\nDone. Demo accounts (password: password123):');
  console.log('  admin@relay.app    → admin');
  console.log('  driver@relay.app   → driver');
  console.log('  customer@relay.app → customer');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => { console.error('Seed failed:', err.message); process.exit(1); });
