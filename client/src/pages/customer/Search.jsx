import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api.js';

const CAT_ICONS = { Restaurant:'🍽️', Grocery:'🛒', Pharmacy:'💊', Courier:'📦', Electronics:'📱', Fashion:'👗', Beauty:'💄', Other:'🏪' };

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [results, setResults] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const cat = params.get('cat');

  useEffect(() => {
    if (q) { search(q); }
    else if (cat) { api.listStores().then(r => setStores(r.stores.filter(s => s.category === cat))); }
    else { api.listStores().then(r => setStores(r.stores)); }
  }, [q, cat]);

  async function search(query) {
    setLoading(true);
    try { const r = await api.searchAll(query); setResults(r); }
    finally { setLoading(false); }
  }

  function handleSearch(e) {
    e.preventDefault();
    if (q.trim()) { setParams({ q: q.trim() }); search(q.trim()); }
    else { setParams({}); setResults(null); }
  }

  const products = results?.products || [];
  const foundStores = results?.stores || [];

  return (
    <div className="bg-base min-h-screen pb-nav">
      {/* Search bar */}
      <div className="card rounded-none border-x-0 border-t-0 sticky top-0 z-10 px-3 py-2">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-full px-3 py-2" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <span className="text-dim">🔍</span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products, stores…" autoFocus
              className="flex-1 bg-transparent border-none outline-none text-sm" style={{ color: 'var(--text)' }} />
            {q && <button type="button" onClick={() => { setQ(''); setResults(null); setParams({}); }} className="text-dim">✕</button>}
          </div>
          <button type="submit" className="btn-green px-4 py-2 rounded-full text-sm">Search</button>
        </form>
      </div>

      <div className="p-3">
        {loading && <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i=><div key={i} className="h-48 rounded-2xl bg-muted animate-pulse"/>)}</div>}

        {!loading && results && (
          <>
            {products.length > 0 && (
              <>
                <p className="font-bold text-base text-sm mb-2">Products ({products.length})</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {products.map(p => (
                    <Link key={p.id} to={`/customer/store/${p.storeId}`} className="card rounded-2xl overflow-hidden active:scale-95 transition-all">
                      <div className="h-32 flex items-center justify-center" style={{ background: 'var(--bg3)' }}>
                        {p.image ? <img src={p.image} className="h-32 w-full object-cover" /> : <span className="text-4xl">🛍️</span>}
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs text-muted">{p.storeName}</p>
                        <p className="font-semibold text-base text-sm leading-tight">{p.name}</p>
                        <p className="font-bold text-green text-sm mt-1">ETB {parseFloat(p.price).toFixed(2)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
            {foundStores.length > 0 && (
              <>
                <p className="font-bold text-base text-sm mb-2">Stores ({foundStores.length})</p>
                <div className="flex flex-col gap-2">
                  {foundStores.map(s => (
                    <Link key={s.id} to={`/customer/store/${s.id}`} className="card rounded-xl flex items-center gap-3 p-3 active:scale-95 transition-all">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'var(--bg3)' }}>
                        {s.logoImage ? <img src={s.logoImage} className="w-12 h-12 rounded-xl object-cover" /> : CAT_ICONS[s.category]||'🏪'}
                      </div>
                      <div>
                        <p className="font-semibold text-base text-sm">{s.name}</p>
                        <p className="text-xs text-muted">{s.category} · {s.etaMinutes} min</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
            {!products.length && !foundStores.length && (
              <div className="text-center py-12 text-muted">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-semibold">No results for "{q}"</p>
              </div>
            )}
          </>
        )}

        {!loading && !results && (
          <>
            <p className="font-bold text-base text-sm mb-3">{cat ? cat : 'All Stores'}</p>
            <div className="grid grid-cols-2 gap-3">
              {stores.map(store => (
                <Link key={store.id} to={`/customer/store/${store.id}`} className="card rounded-2xl overflow-hidden active:scale-95 transition-all">
                  <div className="h-24 flex items-center justify-center" style={{ background: 'var(--bg3)' }}>
                    {store.logoImage ? <img src={store.logoImage} className="h-24 w-full object-cover" /> : <span className="text-4xl">{CAT_ICONS[store.category]||'🏪'}</span>}
                  </div>
                  <div className="p-2.5">
                    <p className="font-semibold text-base text-sm">{store.name}</p>
                    <p className="text-xs text-muted">{store.category} · {store.etaMinutes} min</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
