import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';

const EMPTY_FORM = { name: '', category: '', address: '', etaMinutes: 30 };

export default function ManageStores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    api.listStores().then(({ stores }) => setStores(stores)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function startEdit(store) {
    setEditingId(store.id);
    setForm({ name: store.name, category: store.category, address: store.address, etaMinutes: store.etaMinutes });
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
      if (editingId) {
        await api.updateStore(editingId, form);
      } else {
        await api.createStore(form);
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
    if (!confirm('Delete this store and its menu?')) return;
    await api.deleteStore(id);
    load();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Stores</h1>
      <p className="text-sm text-slate-500">Add new stores or edit what's already live.</p>

      <form onSubmit={submit} className="mt-5 rounded-xl border border-line bg-surface p-5">
        <p className="mb-3 text-sm font-medium text-ink">{editingId ? 'Edit store' : 'Add a store'}</p>
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
            placeholder="Category (e.g. Restaurant)"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-amber"
          />
          <input
            required
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-amber sm:col-span-2"
          />
          <input
            type="number"
            min={5}
            placeholder="ETA minutes"
            value={form.etaMinutes}
            onChange={(e) => setForm({ ...form, etaMinutes: Number(e.target.value) })}
            className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-amber"
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {editingId ? 'Save changes' : 'Add store'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-lg border border-line px-4 py-2 text-sm text-inkmuted">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface">
        {loading ? (
          <p className="p-4 text-sm text-slate-500">Loading…</p>
        ) : (
          stores.map((store) => (
            <div key={store.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wide text-amber">{store.category}</span>
                <p className="font-medium text-ink">{store.name}</p>
                <p className="text-sm text-slate-500">{store.address}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/admin/stores/${store.id}/items`}
                  className="rounded-lg border border-line px-3 py-1.5 text-sm text-inkmuted hover:bg-paper"
                >
                  Menu
                </Link>
                <button onClick={() => startEdit(store)} className="rounded-lg border border-line px-3 py-1.5 text-sm text-inkmuted hover:bg-paper">
                  Edit
                </button>
                <button onClick={() => remove(store.id)} className="rounded-lg border border-line px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
