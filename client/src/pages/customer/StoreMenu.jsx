import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api.js';
import { useCart } from '../../context/CartContext.jsx';

export default function StoreMenu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, items, storeId, itemCount, subtotal } = useCart();
  const [store, setStore] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [justAdded, setJustAdded] = useState(null);

  useEffect(() => {
    Promise.all([api.getStore(id), api.getStoreItems(id)])
      .then(([storeRes, itemsRes]) => {
        setStore(storeRes.store);
        setMenuItems(itemsRes.items);
      })
      .finally(() => setLoading(false));
  }, [id]);

  function handleAdd(item) {
    addItem(store, item);
    setJustAdded(item.id);
    setTimeout(() => setJustAdded(null), 900);
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-amber" />
      </div>
    );
  }
  if (!store) return <div className="p-6 text-slate-500">Store not found.</div>;

  const cartIsOtherStore = storeId && storeId !== store.id && items.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-28 sm:px-6">
      <Link to="/customer" className="text-sm text-slate-500 hover:text-ink">
        ← Back to browse
      </Link>
      <div className="mt-2 flex items-start justify-between">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-wide text-amber">{store.category}</span>
          <h1 className="font-display text-2xl font-semibold text-ink">{store.name}</h1>
          <p className="text-sm text-slate-500">{store.address} · {store.etaMinutes} min</p>
        </div>
      </div>

      {cartIsOtherStore && (
        <div className="mt-4 rounded-lg border border-amber bg-ambersoft px-4 py-2 text-sm text-amber">
          Adding here will replace the items currently in your cart from another store.
        </div>
      )}

      <div className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface">
        {menuItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium text-ink">{item.name}</p>
              {item.description && <p className="text-sm text-slate-500">{item.description}</p>}
              <p className="mt-1 font-mono text-sm text-inkmuted">${item.price.toFixed(2)}</p>
            </div>
            <button
              onClick={() => handleAdd(item)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                justAdded === item.id
                  ? 'border-teal bg-tealsoft text-teal'
                  : 'border-line text-inkmuted hover:border-amber hover:text-amber'
              }`}
            >
              {justAdded === item.id ? 'Added' : 'Add'}
            </button>
          </div>
        ))}
      </div>

      {itemCount > 0 && (
        <button
          onClick={() => navigate('/customer/cart')}
          className="fixed bottom-0 left-0 right-0 z-30 mx-auto flex max-w-3xl items-center justify-between bg-ink px-6 py-4 text-white sm:bottom-6 sm:left-1/2 sm:right-auto sm:w-[calc(100%-3rem)] sm:max-w-md sm:-translate-x-1/2 sm:rounded-xl sm:shadow-lg"
        >
          <span className="text-sm font-medium">{itemCount} item{itemCount > 1 ? 's' : ''} in cart</span>
          <span className="font-mono text-sm">${subtotal.toFixed(2)} · View cart →</span>
        </button>
      )}
    </div>
  );
}
