import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

export default function EditStore() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', category:'', address:'', description:'', etaMinutes:30, logoImage:'' });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const up = (k,v) => setForm(f=>({...f,[k]:v}));

  useEffect(() => {
    api.getMyStore().then(({ store }) => {
      if (store) setForm({ name:store.name, category:store.category, address:store.address, description:store.description||'', etaMinutes:store.etaMinutes, logoImage:store.logoImage||'' });
    });
  }, []);

  function handleLogo(e) {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader(); r.onload = ev => up('logoImage', ev.target.result); r.readAsDataURL(file);
  }

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { await api.updateMyStore(form); setSaved(true); setTimeout(()=>setSaved(false),2000); }
    catch(err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">Edit Store</h1>
      <form onSubmit={submit} className="mt-5 space-y-4 rounded-2xl border border-line bg-surface p-6">
        {[
          {label:'Store name',field:'name',type:'text',ph:'Store name',req:true},
          {label:'Category',field:'category',type:'text',ph:'e.g. Restaurant',req:true},
          {label:'Address',field:'address',type:'text',ph:'Full address',req:true},
        ].map(f=>(
          <div key={f.field}>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inkmuted">{f.label}</label>
            <input type={f.type} required={f.req} value={form[f.field]} onChange={e=>up(f.field,e.target.value)} placeholder={f.ph}
              className="w-full rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm text-ink outline-none focus:border-amber/50" />
          </div>
        ))}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inkmuted">Description</label>
          <textarea value={form.description} onChange={e=>up('description',e.target.value)} rows={3}
            className="w-full rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm text-ink outline-none focus:border-amber/50" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inkmuted">Delivery time (minutes)</label>
          <input type="number" value={form.etaMinutes} onChange={e=>up('etaMinutes',Number(e.target.value))}
            className="w-full rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm text-ink outline-none focus:border-amber/50" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inkmuted">Store logo</label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line p-4 hover:border-amber/30 transition-all">
            <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
            {form.logoImage ? <img src={form.logoImage} className="h-10 w-10 rounded-xl object-cover" /> : <span className="text-2xl">📷</span>}
            <span className="text-sm text-inkmuted">Upload logo</span>
          </label>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={busy}
          className="w-full rounded-xl bg-amber py-3 text-sm font-bold text-paper shadow-green-sm transition-all hover:shadow-green-md active:scale-[0.98] disabled:opacity-50">
          {saved ? 'Saved ✓' : busy ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
