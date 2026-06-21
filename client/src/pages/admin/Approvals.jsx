import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';

export default function Approvals() {
  const [data, setData] = useState({ stores:[], products:[] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  function load() { api.getPending().then(setData).finally(()=>setLoading(false)); }
  useEffect(load, []);

  async function act(fn, id, ...args) {
    setBusy(id); try { await fn(id,...args); load(); } finally { setBusy(null); }
  }

  const total = data.stores.length + data.products.length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">
        Approvals
        {total > 0 && <span className="ml-2 rounded-full bg-amber px-2.5 py-0.5 text-sm text-paper">{total}</span>}
      </h1>
      <p className="text-sm text-inkmuted">Review store applications and product listings before they go live.</p>

      {loading ? <div className="mt-5 h-20 animate-pulse rounded-2xl border border-line bg-surface" /> : (
        <>
          {/* Pending stores */}
          {data.stores.length > 0 && (
            <>
              <p className="mt-6 mb-3 text-xs font-mono uppercase tracking-wider text-inkmuted">Store applications ({data.stores.length})</p>
              <div className="space-y-3">
                {data.stores.map(s=>(
                  <div key={s.id} className="rounded-2xl border border-line bg-surface p-4">
                    <div className="flex items-start gap-3">
                      {s.logo_image ? <img src={s.logo_image} className="h-12 w-12 rounded-xl object-cover flex-shrink-0" /> : <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-elevated text-2xl flex-shrink-0">🏪</div>}
                      <div className="flex-1">
                        <p className="font-semibold text-ink">{s.name}</p>
                        <p className="text-sm text-inkmuted">{s.category} · {s.address}</p>
                        <p className="text-xs text-inkmuted/70 mt-0.5">By {s.seller_name} ({s.seller_email})</p>
                        {s.description && <p className="mt-1 text-sm text-inkmuted">{s.description}</p>}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button disabled={busy===s.id} onClick={()=>act(api.approveStore, s.id)}
                        className="flex-1 rounded-xl bg-amber py-2 text-sm font-bold text-paper shadow-green-sm transition-all hover:shadow-green-md active:scale-95 disabled:opacity-50">
                        ✓ Approve
                      </button>
                      <button disabled={busy===s.id} onClick={()=>{ const r=prompt('Reason for rejection:'); if(r) act(api.rejectStore, s.id, r); }}
                        className="flex-1 rounded-xl border border-red-500/20 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all">
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pending products */}
          {data.products.length > 0 && (
            <>
              <p className="mt-6 mb-3 text-xs font-mono uppercase tracking-wider text-inkmuted">Product listings ({data.products.length})</p>
              <div className="space-y-3">
                {data.products.map(p=>(
                  <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
                    {p.image ? <img src={p.image} className="h-16 w-16 rounded-xl object-cover flex-shrink-0" /> : <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-elevated text-2xl">🛍️</div>}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink truncate">{p.name}</p>
                      <p className="text-xs text-inkmuted">Store: {p.store_name} · by {p.seller_name}</p>
                      {p.description && <p className="text-sm text-inkmuted mt-0.5 truncate">{p.description}</p>}
                      <p className="font-mono text-sm text-amber mt-0.5">ETB {parseFloat(p.price).toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button disabled={busy===p.id} onClick={()=>act(api.approveProduct, p.id)}
                        className="rounded-xl bg-amber px-3 py-1.5 text-xs font-bold text-paper shadow-green-sm active:scale-95 disabled:opacity-50">✓ Approve</button>
                      <button disabled={busy===p.id} onClick={()=>{ const r=prompt('Reason:'); if(r) act(api.rejectProduct, p.id, r); }}
                        className="rounded-xl border border-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10">✕ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {total === 0 && (
            <div className="mt-6 rounded-xl border border-dashed border-line p-10 text-center text-sm text-inkmuted">
              Nothing pending. All caught up ✓
            </div>
          )}
        </>
      )}
    </div>
  );
}
