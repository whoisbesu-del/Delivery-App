import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import BackButton from '../../components/BackButton.jsx';

const CATEGORIES = ['Restaurant','Grocery','Pharmacy','Electronics','Fashion','Beauty','Courier','Other'];

export default function ApplyStore() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', category:'', address:'', description:'', etaMinutes:30, logoImage:'' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const up = (k,v) => setForm(f=>({...f,[k]:v}));

  function handleLogo(e) {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader(); r.onload = ev => up('logoImage', ev.target.result); r.readAsDataURL(file);
  }

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { await api.applyStore(form); navigate('/seller'); }
    catch(err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="bg-base min-h-screen pb-nav page-enter">
      <div className="card rounded-none border-x-0 border-t-0 sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
        <BackButton />
        <p className="font-bold text-base">Open Your Store</p>
      </div>

      <div className="p-3">
        <div className="card rounded-2xl p-4 mb-3" style={{ border:'1px solid var(--primary)', background:'var(--primary-t)' }}>
          <p className="text-sm font-semibold text-green">📋 Application will be reviewed by admin</p>
          <p className="text-xs text-muted mt-0.5">Usually approved within a few hours.</p>
        </div>

        <form onSubmit={submit} className="card rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Store name *</label>
            <input required value={form.name} onChange={e=>up('name',e.target.value)} placeholder="e.g. Addis Bites"
              className="w-full rounded-xl px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Category *</label>
            <select required value={form.category} onChange={e=>up('category',e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm">
              <option value="">Select category…</option>
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Address *</label>
            <input required value={form.address} onChange={e=>up('address',e.target.value)} placeholder="e.g. Bole Road, Addis Ababa"
              className="w-full rounded-xl px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Description</label>
            <textarea value={form.description} onChange={e=>up('description',e.target.value)} rows={3}
              placeholder="What do you sell?" className="w-full rounded-xl px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Average delivery time (minutes)</label>
            <input type="number" min={10} max={120} value={form.etaMinutes} onChange={e=>up('etaMinutes',Number(e.target.value))}
              className="w-full rounded-xl px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Store logo (optional)</label>
            <label className="flex items-center gap-3 rounded-xl p-4 cursor-pointer tap-scale transition-all"
              style={{ border:'2px dashed var(--border)' }}>
              <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
              {form.logoImage
                ? <img src={form.logoImage} className="h-12 w-12 rounded-xl object-cover" />
                : <span className="text-2xl">📷</span>}
              <span className="text-sm text-muted">{form.logoImage ? 'Change logo' : 'Upload store logo'}</span>
            </label>
          </div>
          {error && <p className="text-sm" style={{ color:'var(--red)' }}>{error}</p>}
          <button type="submit" disabled={busy} className="btn-green btn-glow w-full py-3.5 rounded-xl text-sm tap-scale">
            {busy ? 'Submitting…' : 'Submit for approval'}
          </button>
        </form>
      </div>
    </div>
  );
}
