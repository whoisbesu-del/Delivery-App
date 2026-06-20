import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';

const CATEGORY_HINTS = {
  Restaurant: 'Hot food, made to order',
  Grocery: 'Pantry staples & fresh picks',
  Pharmacy: 'Health & wellness essentials',
  Courier: 'Send a package across town',
};

export default function Home() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    api.listStores().then(({ stores }) => setStores(stores)).finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...new Set(stores.map((s) => s.category))];
  const visible = activeCategory === 'All' ? stores : stores.filter((s) => s.category === activeCategory);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">Where to today?</h1>
      <p className="mt-1 text-slate-500">Food, groceries, essentials, or a package — pick a place and we'll route it.</p>

      <div className="mt-6 flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat ? 'bg-ink text-white' : 'border border-line bg-surface text-inkmuted hover:bg-paper'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-amber" />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visible.map((store) => (
            <Link
              key={store.id}
              to={`/customer/store/${store.id}`}
              className="group rounded-xl border border-line bg-surface p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wide text-amber">{store.category}</span>
                  <h2 className="mt-1 font-display text-lg font-semibold text-ink">{store.name}</h2>
                  <p className="mt-0.5 text-sm text-slate-500">{CATEGORY_HINTS[store.category] || store.address}</p>
                </div>
                <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-mono text-inkmuted">
                  {store.etaMinutes} min
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-500">{store.address}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
