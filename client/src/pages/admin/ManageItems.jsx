import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api.js';

const EMPTY_FORM = { name: '', description: '', price: '' };

export default function ManageItems() {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    Promise.all([api.getStore(storeId), api.getStoreItems(storeId)]).then(([storeRes, itemsRes]) => {
      setStore(storeRes.store);
      setItems(itemsRes.items);
    }).finally(() => setLoading(false));
  }
  useEffect(load, [storeId]);

  function startEdit(item) {
    setEditingId(item.id);
    setForm({ name: item.name, description: item.description || '', price: item.price });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const payload = { ...form, price: Number(form.price) };
      if (editingId) {
        await api.updateItem(editingId, payload);
      } else {
        await api.createItem(storeId, payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!confirm('Remove this item from the menu?')) return;
    await api.deleteItem(id);
    load();
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-amber" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link to="/admin/stores" className="text-sm text-slate-500 hover:text-ink">
        ← All stores
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">{store?.name} · Menu</h1>

      <form onSubmit={submit} className="mt-5 rounded-xl border border-line bg-surface p-5">
        <p className="mb-3 text-sm font-medium text-ink">{editingId ? 'Edit item' : 'Add an item'}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-amber"
          />
          <input
            required
            type="number"
            step="0.01"
            min={0}
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-amber"
          />
          <input
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-amber sm:col-span-2"
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {editingId ? 'Save changes' : 'Add item'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-lg border border-line px-4 py-2 text-sm text-inkmuted">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium text-ink">{item.name}</p>
              {item.description && <p className="text-sm text-slate-500">{item.description}</p>}
              <p className="font-mono text-sm text-inkmuted">${item.price.toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(item)} className="rounded-lg border border-line px-3 py-1.5 text-sm text-inkmuted hover:bg-paper">
                Edit
              </button>
              <button onClick={() => remove(item.id)} className="rounded-lg border border-line px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                Delete
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="p-4 text-sm text-slate-500">No items yet — add the first one above.</p>}
      </div>
    </div>
  );
}
