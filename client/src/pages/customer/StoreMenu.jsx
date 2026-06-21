import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api.js';
import { useCart } from '../../context/CartContext.jsx';

export default function StoreMenu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, items, storeId, itemCount, subtotal } = useCart();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [justAdded, setJustAdded] = useState(null);

  useEffect(() => {
    Promise.all([api.getStore(id), api.getStoreProducts(id)])
      .then(([sr, pr]) => { setStore(sr.store); setProducts(pr.products); })
      .finally(() => setLoading(false));
  }, [id]);

  function handleAdd(product) {
    addItem(store, product);
    setJustAdded(product.id);
    setTimeout(() => setJustAdded(null), 800);
  }

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-amber" /></div>;
  if (!store) return <div className="p-6 text-inkmuted">Store not found.</div>;
  const cartIsOther = storeId && storeId !== store.id && items.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-6 sm:px-6">
      <Link to="/customer" className="text-sm text-inkmuted hover:text-ink">← Back</Link>
      <div className="mt-3 flex items-start gap-4">
        {store.logoImage
          ? <img src={store.logoImage} className="h-16 w-16 rounded-2xl border border-line object-cover" />
          : <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-elevated text-3xl">🏪</div>}
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-amber">{store.category} · {store.etaMinutes} min</p>
          <h1 className="font-display text-2xl font-bold text-ink">{store.name}</h1>
          <p className="text-sm text-inkmuted">{store.address}</p>
          {store.description && <p className="mt-1 text-sm text-inkmuted/70">{store.description}</p>}
        </div>
      </div>

      {cartIsOther && (
        <div className="mt-4 rounded-xl border border-amber/30 bg-amber/10 px-4 py-2 text-sm text-amber">
          Adding here will clear your current cart from another store.
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {products.map(product => (
          <div key={product.id} className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all hover:border-amber/20 hover:shadow-card-hover">
            {product.image
              ? <img src={product.image} alt={product.name} className="h-36 w-full object-cover" />
              : <div className="flex h-24 w-full items-center justify-center bg-elevated text-4xl">🛍️</div>}
            <div className="p-4">
              <p className="font-semibold text-ink">{product.name}</p>
              {product.description && <p className="mt-0.5 text-xs text-inkmuted">{product.description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <p className="font-mono font-bold text-amber">ETB {product.price.toFixed(2)}</p>
                <button onClick={() => handleAdd(product)}
                  className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition-all active:scale-95 ${
                    justAdded === product.id
                      ? 'bg-teal/20 text-teal border border-teal/30'
                      : 'border border-line text-inkmuted hover:border-amber/40 hover:bg-amber/10 hover:text-amber'}`}>
                  {justAdded === product.id ? '✓ Added' : '+ Add'}
                </button>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && <div className="col-span-2 rounded-xl border border-dashed border-line p-8 text-center text-sm text-inkmuted">No products listed yet.</div>}
      </div>

      {itemCount > 0 && (
        <button onClick={() => navigate('/customer/cart')}
          className="fixed bottom-0 left-0 right-0 z-30 mx-4 mb-4 flex items-center justify-between rounded-2xl bg-amber px-6 py-4 font-bold text-paper shadow-green-lg sm:mx-auto sm:max-w-md">
          <span>{itemCount} item{itemCount>1?'s':''}</span>
          <span>ETB {subtotal.toFixed(2)} · View cart →</span>
        </button>
      )}
    </div>
  );
}
