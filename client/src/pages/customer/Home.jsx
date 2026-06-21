import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import { useTheme } from '../../context/ThemeContext.jsx';

const CAT_ICONS = { Restaurant:'🍽️', Grocery:'🛒', Pharmacy:'💊', Courier:'📦', Electronics:'📱', Fashion:'👗', Beauty:'💄', Other:'🏪' };

export default function Home() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    api.listStores().then(({ stores }) => setStores(stores)).finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(stores.map(s => s.category))];

  function handleSearch(e) {
    e.preventDefault();
    if (searchQ.trim()) navigate(`/customer/search?q=${encodeURIComponent(searchQ)}`);
  }

  return (
    <div className="bg-base min-h-screen pb-nav">
      {/* Top bar */}
      <div className="card rounded-none border-x-0 border-t-0 sticky top-0 z-10 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-green-t flex items-center justify-center">
              <span className="font-bold text-green text-sm" style={{ fontFamily: 'Space Grotesk' }}>S</span>
            </div>
          </div>
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-full px-3 py-1.5 text-sm" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <span className="text-dim">🔍</span>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="Search products, stores…"
                className="flex-1 bg-transparent border-none outline-none text-sm"
                style={{ color: 'var(--text)' }} />
            </div>
          </form>
          <button onClick={toggle} className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'var(--bg3)' }}>
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Banner */}
      <div className="mx-3 mt-3 rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #16A34A, #22C55E)', minHeight: 120 }}>
        <div className="p-5">
          <p className="text-white/70 text-xs font-medium mb-1">Welcome to</p>
          <p className="text-white font-bold text-2xl" style={{ fontFamily: 'Space Grotesk' }}>South Shopping</p>
          <p className="text-white/80 text-sm mt-1">Your local marketplace, delivered fast</p>
          <Link to="/customer/search" className="mt-3 inline-block bg-white text-green font-bold text-xs px-4 py-1.5 rounded-full">
            Shop now →
          </Link>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl opacity-20">🛍️</div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="mt-4 px-3">
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-base text-sm">Categories</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {categories.slice(0, 8).map(cat => (
              <Link key={cat} to={`/customer/search?cat=${encodeURIComponent(cat)}`}
                className="flex flex-col items-center gap-1 p-2 rounded-xl card transition-all active:scale-95">
                <span className="text-2xl">{CAT_ICONS[cat] || '🏪'}</span>
                <span className="text-xs text-muted text-center leading-tight">{cat}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stores */}
      <div className="mt-4 px-3">
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-base text-sm">All Stores</p>
          <Link to="/customer/search" className="text-xs text-green font-semibold">View all</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {stores.map(store => (
              <Link key={store.id} to={`/customer/store/${store.id}`}
                className="card rounded-2xl overflow-hidden transition-all active:scale-95">
                <div className="h-24 flex items-center justify-center" style={{ background: 'var(--bg3)' }}>
                  {store.logoImage
                    ? <img src={store.logoImage} className="h-24 w-full object-cover" />
                    : <span className="text-4xl">{CAT_ICONS[store.category] || '🏪'}</span>}
                </div>
                <div className="p-2.5">
                  <p className="font-semibold text-base text-sm leading-tight">{store.name}</p>
                  <p className="text-xs text-muted mt-0.5">{store.category}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-dim">⏱ {store.etaMinutes} min</span>
                    <span className="text-xs text-green font-semibold">Open →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
