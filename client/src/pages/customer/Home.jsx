import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

const CAT_ICONS = { Restaurant:'🍽️', Grocery:'🛒', Pharmacy:'💊', Courier:'📦', Electronics:'📱', Fashion:'👗', Beauty:'💄' };

export default function Home() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    api.listStores().then(({ stores }) => setStores(stores)).finally(() => setLoading(false));
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQ.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try {
      const res = await api.searchAll(searchQ);
      setSearchResults(res);
    } finally { setSearching(false); }
  }

  const categories = ['All', ...new Set(stores.map(s => s.category))];
  const visible = category === 'All' ? stores : stores.filter(s => s.category === category);

  return (
    <div className="min-h-screen bg-paper">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-line bg-surface px-4 pb-8 pt-10 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-green-glow" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-amber/5 blur-3xl" />
        <div className="relative mx-auto max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-amber">South Shopping</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink sm:text-4xl">
            Shop anything,<br /><span className="text-amber">delivered fast.</span>
          </h1>
          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-5 flex gap-2">
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
              placeholder="Search products or stores…"
              className="flex-1 rounded-xl border border-line bg-elevated px-4 py-3 text-sm text-ink outline-none transition-all focus:border-amber/50 focus:shadow-green-sm" />
            <button type="submit" disabled={searching}
              className="rounded-xl bg-amber px-5 py-3 text-sm font-bold text-paper shadow-green-sm transition-all hover:shadow-green-md active:scale-95 disabled:opacity-60">
              {searching ? '…' : '🔍'}
            </button>
            {searchResults && (
              <button type="button" onClick={() => { setSearchResults(null); setSearchQ(''); }}
                className="rounded-xl border border-line px-4 py-3 text-sm text-inkmuted hover:bg-elevated">✕</button>
            )}
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* Search results */}
        {searchResults && (
          <div className="mb-6 animate-slide-up">
            <p className="mb-3 text-sm font-medium text-inkmuted">
              {searchResults.products.length + searchResults.stores.length} results for "<span className="text-ink">{searchQ}</span>"
            </p>
            {searchResults.products.length > 0 && (
              <>
                <p className="mb-2 text-xs font-mono uppercase tracking-wider text-inkmuted/60">Products</p>
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {searchResults.products.map(p => (
                    <Link key={p.id} to={`/customer/store/${p.storeId}`}
                      className="group rounded-xl border border-line bg-surface p-3 transition-all hover:border-amber/25 hover:shadow-card-hover">
                      {p.image
                        ? <img src={p.image} alt={p.name} className="mb-2 h-24 w-full rounded-lg object-cover" />
                        : <div className="mb-2 flex h-24 w-full items-center justify-center rounded-lg bg-elevated text-3xl">{CAT_ICONS[p.storeCategory]||'📦'}</div>
                      }
                      <p className="text-xs font-mono text-amber">{p.storeName}</p>
                      <p className="text-sm font-semibold text-ink">{p.name}</p>
                      <p className="font-mono text-sm text-amber">ETB {parseFloat(p.price).toFixed(2)}</p>
                    </Link>
                  ))}
                </div>
              </>
            )}
            {searchResults.stores.length > 0 && (
              <>
                <p className="mb-2 text-xs font-mono uppercase tracking-wider text-inkmuted/60">Stores</p>
                <div className="grid gap-3">
                  {searchResults.stores.map(s => (
                    <Link key={s.id} to={`/customer/store/${s.id}`}
                      className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 transition-all hover:border-amber/25">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-elevated text-xl">
                        {s.logoImage ? <img src={s.logoImage} className="h-10 w-10 rounded-xl object-cover" /> : CAT_ICONS[s.category]||'🏪'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">{s.name}</p>
                        <p className="text-xs text-inkmuted">{s.category} · {s.etaMinutes} min</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
            {!searchResults.products.length && !searchResults.stores.length && (
              <div className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-inkmuted">Nothing found for "{searchQ}".</div>
            )}
          </div>
        )}

        {!searchResults && (
          <>
            {/* Category chips */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    category===c ? 'bg-amber text-paper shadow-green-sm' : 'border border-line bg-surface text-inkmuted hover:border-amber/30 hover:bg-elevated hover:text-ink'}`}>
                  {c !== 'All' && <span>{CAT_ICONS[c]||'🏪'}</span>}
                  {c}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[1,2,3,4].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl border border-line bg-surface" />)}
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {visible.map(store => (
                  <Link key={store.id} to={`/customer/store/${store.id}`}
                    className="group relative overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-amber/25 hover:shadow-card-hover">
                    <div className="pointer-events-none absolute inset-0 bg-card-shine opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-line bg-elevated">
                          {store.logoImage
                            ? <img src={store.logoImage} alt={store.name} className="h-12 w-12 object-cover" />
                            : <span className="text-2xl">{CAT_ICONS[store.category]||'🏪'}</span>}
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-widest text-amber">{store.category}</p>
                          <h2 className="font-display text-base font-bold text-ink">{store.name}</h2>
                        </div>
                        <span className="ml-auto rounded-full border border-line bg-elevated px-2.5 py-1 font-mono text-xs text-inkmuted">{store.etaMinutes}m</span>
                      </div>
                      {store.description && <p className="mt-2 text-xs text-inkmuted line-clamp-2">{store.description}</p>}
                      <p className="mt-2 flex items-center gap-1 text-xs text-inkmuted/60">📍 {store.address}</p>
                      <p className="mt-2 text-right text-xs font-medium text-amber opacity-0 transition-opacity group-hover:opacity-100">View products →</p>
                    </div>
                  </Link>
                ))}
                {visible.length === 0 && (
                  <div className="col-span-2 rounded-xl border border-dashed border-line p-8 text-center text-sm text-inkmuted">No stores in this category yet.</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
