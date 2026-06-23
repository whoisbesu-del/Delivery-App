import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import { useCart } from '../../context/CartContext.jsx';
import BackButton from '../../components/BackButton.jsx';

export default function StoreMenu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, items, storeId, itemCount, subtotal } = useCart();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState({});
  const [toast, setToast] = useState('');

  useEffect(() => {
    Promise.all([api.getStore(id), api.getStoreProducts(id)])
      .then(([sr, pr]) => { setStore(sr.store); setProducts(pr.products); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  function handleAdd(product) {
    if (!store) return;
    addItem(store, product);
    setAdded(a => ({ ...a, [product.id]: true }));
    setTimeout(() => setAdded(a => ({ ...a, [product.id]: false })), 1000);
    setToast(`${product.name} added to cart`);
    setTimeout(() => setToast(''), 2000);
  }

  const cartIsOther = storeId && storeId !== store?.id && items.length > 0;

  if (loading) return (
    <div className="bg-base min-h-screen pb-nav">
      <div className="card rounded-none border-x-0 border-t-0 px-4 py-3 flex items-center gap-3">
        <div className="w-16 h-4 skeleton" /><div className="w-32 h-5 skeleton" />
      </div>
      <div className="p-3 grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i=><div key={i} className="h-48 skeleton rounded-2xl"/>)}
      </div>
    </div>
  );

  if (!store) return <div className="p-6 text-muted">Store not found.</div>;

  return (
    <div className="bg-base min-h-screen pb-nav">
      {/* Header */}
      <div className="card rounded-none border-x-0 border-t-0 sticky top-0 z-10 px-4 py-3">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-2 flex-1">
            {store.logoImage
              ? <img src={store.logoImage} className="w-9 h-9 rounded-xl object-cover flex-shrink-0"/>
              : <span className="text-2xl">🏪</span>}
            <div>
              <p className="font-bold text-base text-sm leading-tight">{store.name}</p>
              <p className="text-xs text-dim">{store.category} · {store.etaMinutes} min</p>
            </div>
          </div>
        </div>
      </div>

      {cartIsOther && (
        <div className="mx-3 mt-3 rounded-xl px-4 py-2 text-sm animate-in"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)' }}>
          Adding here will clear your cart from another store.
        </div>
      )}

      {store.description && (
        <div className="mx-3 mt-3 card p-3">
          <p className="text-sm text-muted">{store.description}</p>
        </div>
      )}

      <div className="p-3 grid grid-cols-2 gap-3">
        {products.map((product, idx) => (
          <div key={product.id}
            className="card rounded-2xl overflow-hidden card-lift"
            style={{ animationDelay: `${idx * 0.05}s` }}>
            <div className="relative">
              {product.image
                ? <img src={product.image} alt={product.name} className="h-32 w-full object-cover"/>
                : <div className="h-32 w-full flex items-center justify-center text-5xl bg-muted">🛍️</div>}
              {product.stock < 10 && product.stock > 0 && (
                <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(239,68,68,0.85)', color: '#fff' }}>
                  Only {product.stock} left
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="font-semibold text-base text-sm leading-tight">{product.name}</p>
              {product.description && <p className="text-xs text-dim mt-0.5 line-clamp-2">{product.description}</p>}
              <div className="flex items-center justify-between mt-2">
                <p className="font-bold text-green text-sm">ETB {product.price.toFixed(2)}</p>
                <button
                  onClick={() => handleAdd(product)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full tap-scale transition-all ${
                    added[product.id]
                      ? 'text-white bg-green check-pop'
                      : 'text-green btn-green'
                  }`}
                  style={added[product.id] ? {} : { background: 'var(--primary-t)' }}>
                  {added[product.id] ? '✓ Added' : '+ Add'}
                </button>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-2 text-center py-12 text-muted">
            <p className="text-4xl mb-2">📭</p>
            <p>No products yet.</p>
          </div>
        )}
      </div>

      {/* Cart bar */}
      {itemCount > 0 && (
        <button onClick={() => navigate('/customer/cart')}
          className="fixed bottom-16 left-3 right-3 z-30 btn-green btn-glow py-3.5 rounded-2xl flex items-center justify-between px-5 toast">
          <span className="text-sm">{itemCount} item{itemCount>1?'s':''}</span>
          <span className="text-sm font-bold">View cart · ETB {subtotal.toFixed(2)} →</span>
        </button>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-white text-sm font-medium toast"
          style={{ background: 'rgba(0,0,0,0.75)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
