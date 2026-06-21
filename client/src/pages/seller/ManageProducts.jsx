import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';

const EMPTY = { name:'', description:'', price:'', stock:999, image:'' };

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const up = (k,v) => setForm(f=>({...f,[k]:v}));

  async function load() {
    const store = await api.getMyStore();
    if (store.store) {
      const res = await api.getStoreProducts(store.store.id, true);
      setProducts(res.products);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function handleImage(e) {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => up('image', ev.target.result);
    r.readAsDataURL(file);
  }

  function startEdit(p) {
    setEditId(p.id);
    setForm({ name:p.name, description:p.description||'', price:p.price, stock:p.stock||999, image:p.image||'' });
  }

  function reset() { setEditId(null); setForm(EMPTY); setError(''); }

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (editId) await api.updateProduct(editId, form);
      else await api.addProduct(form);
      reset(); load();
    } catch(err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function remove(id) {
    if (!confirm('Delete this product?')) return;
    await api.deleteProduct(id); load();
  }

  const STATUS_STYLE = { approved:'text-amber bg-amber/10', pending:'text-inkmuted bg-elevated', rejected:'text-red-400 bg-red-500/10' };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">Products</h1>
      <p className="text-sm text-inkmuted">New products need admin approval before they appear to buyers.</p>

      <form onSubmit={submit} className="mt-5 rounded-2xl border border-line bg-surface p-5">
        <p className="mb-4 text-sm font-semibold text-ink">{editId ? 'Edit product' : 'Add a product'}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input required placeholder="Product name" value={form.name} onChange={e=>up('name',e.target.value)}
            className="rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm text-ink outline-none focus:border-amber/50" />
          <input required type="number" step="0.01" min={0} placeholder="Price (ETB)" value={form.price} onChange={e=>up('price',e.target.value)}
            className="rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm text-ink outline-none focus:border-amber/50" />
          <input placeholder="Description" value={form.description} onChange={e=>up('description',e.target.value)}
            className="rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm text-ink outline-none focus:border-amber/50 sm:col-span-2" />
          <input type="number" min={0} placeholder="Stock quantity" value={form.stock} onChange={e=>up('stock',Number(e.target.value))}
            className="rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm text-ink outline-none focus:border-amber/50" />
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line px-4 py-2.5 hover:border-amber/30 transition-all">
            <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
            {form.image
              ? <img src={form.image} className="h-8 w-8 rounded-lg object-cover" />
              : <span className="text-lg">📷</span>}
            <span className="text-sm text-inkmuted">{form.image ? 'Change image' : 'Upload product image'}</span>
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={busy}
            className="rounded-xl bg-amber px-5 py-2 text-sm font-bold text-paper shadow-green-sm transition-all hover:shadow-green-md active:scale-95 disabled:opacity-50">
            {busy ? 'Saving…' : editId ? 'Save changes' : 'Add product'}
          </button>
          {editId && <button type="button" onClick={reset} className="rounded-xl border border-line px-4 py-2 text-sm text-inkmuted hover:bg-elevated">Cancel</button>}
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {loading ? <div className="h-20 animate-pulse rounded-2xl border border-line bg-surface" /> :
          products.map(p => (
            <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
              {p.image
                ? <img src={p.image} className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />
                : <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-elevated text-2xl">🛍️</div>}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink truncate">{p.name}</p>
                <p className="text-sm text-amber font-mono">ETB {p.price.toFixed(2)}</p>
                {p.description && <p className="text-xs text-inkmuted truncate">{p.description}</p>}
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold flex-shrink-0 ${STATUS_STYLE[p.status]||'text-inkmuted bg-elevated'}`}>{p.status}</span>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={()=>startEdit(p)} className="rounded-xl border border-line px-3 py-1.5 text-xs text-inkmuted hover:bg-elevated transition-all">Edit</button>
                <button onClick={()=>remove(p.id)} className="rounded-xl border border-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-all">Delete</button>
              </div>
            </div>
          ))}
        {!loading && products.length === 0 && <div className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-inkmuted">No products yet — add your first one above.</div>}
      </div>
    </div>
  );
}
