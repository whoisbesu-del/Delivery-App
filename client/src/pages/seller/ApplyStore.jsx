import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

export default function ApplyStore() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', category:'', address:'', description:'', etaMinutes:30, logoImage:'' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const up = (k,v) => setForm(f=>({...f,[k]:v}));

  function handleLogo(e) {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => up('logoImage', ev.target.result);
    r.readAsDataURL(file);
  }

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { await api.applyStore(form); navigate('/seller'); }
    catch(err) { setError(err.message); }
    finally { setBusy(false); }
  }

  const CATEGORIES = ['Restaurant','Grocery','Pharmacy','Electronics','Fashion','Beauty','Courier','Other'];

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">Open your store</h1>
      <p className="mt-1 text-sm text-inkmuted">Fill in your store details. Admin will review and approve within a few hours.</p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-line bg-surface p-6">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inkmuted">Store name *</label>
          <input required value={form.name} onChange={e=>up('name',e.target.value)} placeholder="e.g. Addis Bites"
            className="w-full rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm text-ink outline-none transition-all focus:border-amber/50" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inkmuted">Category *</label>
          <select required value={form.category} onChange={e=>up('category',e.target.value)}
            className="w-full rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm text-ink outline-none transition-all focus:border-amber/50">
            <option value="">Select category…</option>
            {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inkmuted">Address *</label>
          <input required value={form.address} onChange={e=>up('address',e.target.value)} placeholder="e.g. Bole Road, Addis Ababa"
            className="w-full rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm text-ink outline-none transition-all focus:border-amber/50" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inkmuted">Description</label>
          <textarea value={form.description} onChange={e=>up('description',e.target.value)} rows={3} placeholder="What do you sell?"
            className="w-full rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm text-ink outline-none transition-all focus:border-amber/50" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inkmuted">Average delivery time (minutes)</label>
          <input type="number" min={10} max={120} value={form.etaMinutes} onChange={e=>up('etaMinutes',Number(e.target.value))}
            className="w-full rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm text-ink outline-none transition-all focus:border-amber/50" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inkmuted">Store logo (optional)</label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line p-4 hover:border-amber/30 transition-all">
            <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
            {form.logoImage
              ? <img src={form.logoImage} className="h-12 w-12 rounded-xl object-cover" />
              : <span className="text-2xl">📷</span>}
            <span className="text-sm text-inkmuted">{form.logoImage ? 'Change logo' : 'Upload logo image'}</span>
          </label>
        </div>
        {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}
        <button type="submit" disabled={busy}
          className="w-full rounded-xl bg-amber py-3 text-sm font-bold text-paper shadow-green-sm transition-all hover:shadow-green-md active:scale-[0.98] disabled:opacity-50">
          {busy ? 'Submitting…' : 'Submit for approval'}
        </button>
      </form>
    </div>
  );
}
