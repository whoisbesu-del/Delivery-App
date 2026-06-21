require('dotenv').config();
const bcrypt = require('bcryptjs');
const { migrate } = require('./migrate');
const pool = require('./db');

const USERS = [
  { name: 'Avery Admin',    email: 'admin@south.app',    password: 'password123', role: 'admin',    phone: '555-0100' },
  { name: 'Sam Driver',     email: 'driver@south.app',   password: 'password123', role: 'driver',   phone: '555-0101' },
  { name: 'Casey Customer', email: 'customer@south.app', password: 'password123', role: 'customer', phone: '555-0102' },
  { name: 'Seller Sara',    email: 'seller@south.app',   password: 'password123', role: 'seller',   phone: '555-0103' },
];

const CATALOG = [
  {
    store: { name: 'Addis Bites', category: 'Restaurant', address: 'Bole Road, Addis Ababa', description: 'Authentic Ethiopian & international fast food', eta: 35, status: 'approved' },
    products: [
      { name: 'Tibs Special', description: 'Sautéed beef with onion and jalapeño', price: 180 },
      { name: 'Injera Combo', description: 'Injera with 3 stews', price: 120 },
      { name: 'Burger & Fries', description: 'Beef patty, lettuce, tomato', price: 150 },
      { name: 'Fresh Juice', description: 'Mango or avocado', price: 60 },
    ],
  },
  {
    store: { name: 'MegaMart', category: 'Grocery', address: 'Piazza, Addis Ababa', description: 'Fresh groceries and household essentials', eta: 45, status: 'approved' },
    products: [
      { name: 'Teff Flour 1kg', description: 'Premium injera-grade teff', price: 85 },
      { name: 'Cooking Oil 1L', description: 'Pure sunflower oil', price: 120 },
      { name: 'Rice 2kg', description: 'Long grain white rice', price: 95 },
      { name: 'Sugar 1kg', description: 'Refined white sugar', price: 55 },
    ],
  },
  {
    store: { name: 'Selam Pharmacy', category: 'Pharmacy', address: 'Kazanchis, Addis Ababa', description: '24/7 pharmacy and health products', eta: 20, status: 'approved' },
    products: [
      { name: 'Paracetamol 500mg', description: '20 tablets', price: 35 },
      { name: 'Vitamin C 1000mg', description: '30 tablets', price: 90 },
      { name: 'Hand Sanitizer', description: '500ml gel', price: 75 },
      { name: 'Face Mask (10 pack)', description: 'Surgical-grade', price: 50 },
    ],
  },
  {
    store: { name: 'SpeedShip Courier', category: 'Courier', address: 'Mexico Square, Addis Ababa', description: 'Same-day package delivery anywhere in the city', eta: 60, status: 'approved' },
    products: [
      { name: 'Small Parcel', description: 'Up to 2kg, same-day', price: 80 },
      { name: 'Medium Parcel', description: 'Up to 10kg, same-day', price: 140 },
      { name: 'Large Parcel', description: 'Up to 25kg, same-day', price: 220 },
      { name: 'Document Delivery', description: 'Envelopes and documents', price: 50 },
    ],
  },
];

async function seed() {
  await migrate();
  console.log('Clearing existing data…');
  await pool.query('DELETE FROM order_items');
  await pool.query('DELETE FROM orders');
  await pool.query('DELETE FROM products');
  await pool.query('DELETE FROM stores');
  await pool.query('DELETE FROM users');
  for (const t of ['users','stores','products','orders','order_items']) {
    await pool.query(`ALTER SEQUENCE ${t}_id_seq RESTART WITH 1`).catch(() => {});
  }

  console.log('Creating users…');
  const userIds = {};
  for (const u of USERS) {
    const r = await pool.query(
      'INSERT INTO users (name,email,password_hash,role,phone) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [u.name, u.email, bcrypt.hashSync(u.password,10), u.role, u.phone]);
    userIds[u.role] = r.rows[0].id;
  }

  console.log('Creating stores and products…');
  for (const entry of CATALOG) {
    const s = entry.store;
    const sr = await pool.query(
      'INSERT INTO stores (seller_id,name,category,address,description,eta_minutes,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [userIds.seller, s.name, s.category, s.address, s.description, s.eta, s.status]);
    const storeId = sr.rows[0].id;
    for (const p of entry.products) {
      await pool.query('INSERT INTO products (store_id,name,description,price,status) VALUES ($1,$2,$3,$4,$5)',
        [storeId, p.name, p.description, p.price, 'approved']);
    }
  }

  // Also create a pending store application from the seller
  await pool.query(
    "INSERT INTO stores (seller_id,name,category,address,description,eta_minutes,status) VALUES ($1,$2,$3,$4,$5,$6,'pending')",
    [userIds.seller, 'Sara\'s Electronics', 'Electronics', 'Merkato, Addis Ababa', 'Mobile phones, accessories and electronics', 40]);

  console.log('\nDone. Demo accounts (password: password123):');
  console.log('  admin@south.app    → admin');
  console.log('  driver@south.app   → driver');
  console.log('  customer@south.app → customer');
  console.log('  seller@south.app   → seller');
}

seed().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
