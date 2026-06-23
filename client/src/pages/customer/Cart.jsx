import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { api } from '../../api.js';
import BackButton from '../../components/BackButton.jsx';

const FEE = 4.99;

export default function Cart() {
  const { storeId, storeName, items, updateQuantity, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function placeOrder() {
    const addr = document.getElementById('addr-in')?.value.trim() || address.trim();
    if (!addr) { setError('Add a delivery address.'); return; }
    if (!items.length) { setError('Your cart is empty.'); return; }
    setBusy(true); setError('');
    try {
      const { order } = await api.placeOrder({
        storeId,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddress: addr,
      });
      clearCart();
      navigate(`/customer/pay/${order.id}`);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  if (!items.length) return (
    <div className="bg-base min-h-screen pb-nav">
      <div className="card rounded-none border-x-0 border-t-0 px-4 py-3 flex items-center gap-3">
        <BackButton />
        <p className="font-bold text-base">Cart</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-muted">
        <p className="text-6xl mb-4">🛒</p>
        <p className="font-semibold text-base text-lg">Your cart is empty</p>
        <button onClick={() => navigate('/customer')}
          className="mt-4 btn-green px-6 py-2.5 rounded-xl text-sm">Browse stores</button>
      </div>
    </div>
  );

  return (
    <div className="bg-base min-h-screen pb-nav page-enter">
      <div className="card rounded-none border-x-0 border-t-0 sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
        <BackButton />
        <p className="font-bold text-base">Cart · {storeName}</p>
      </div>

      <div className="p-3 space-y-2">
        {items.map((item, i) => (
          <div key={item.productId} className="card rounded-2xl flex items-center gap-3 p-3 slide-up"
            style={{ animationDelay: `${i * 0.05}s` }}>
            {item.image
              ? <img src={item.image} className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />
              : <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">🛍️</div>}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base text-sm truncate">{item.name}</p>
              <p className="text-green font-bold text-sm font-mono">ETB {item.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                className="w-7 h-7 rounded-full border flex items-center justify-center text-base font-bold tap-scale transition-all"
                style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>−</button>
              <span className="w-6 text-center font-bold text-base text-sm">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold tap-scale transition-all text-white bg-green">+</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-3 card rounded-2xl p-4 text-sm">
        <div className="flex justify-between text-muted mb-1"><span>Subtotal</span><span className="font-mono">ETB {subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between text-muted"><span>Delivery fee</span><span className="font-mono">ETB {FEE.toFixed(2)}</span></div>
        <div className="flex justify-between font-bold text-base mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <span>Total</span><span className="font-mono text-green">ETB {(subtotal + FEE).toFixed(2)}</span>
        </div>
      </div>

      <div className="mx-3 mt-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Delivery address</label>
        <input id="addr-in" onChange={e => setAddress(e.target.value)} placeholder="Street, area, building…"
          className="w-full rounded-xl px-4 py-3 text-sm" />
      </div>

      {error && <p className="mx-3 mt-2 text-sm" style={{ color: 'var(--red)' }}>{error}</p>}

      <div className="mx-3 mt-4">
        <button onClick={placeOrder} disabled={busy}
          className="btn-green btn-glow w-full py-3.5 rounded-xl text-sm tap-scale">
          {busy ? 'Placing order…' : `Place order · ETB ${(subtotal + FEE).toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
