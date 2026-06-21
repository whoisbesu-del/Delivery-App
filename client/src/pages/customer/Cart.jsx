import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { api } from '../../api.js';
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
    setBusy(true); setError('');
    try {
      const { order } = await api.placeOrder({ storeId, items: items.map(i=>({productId:i.productId, quantity:i.quantity})), deliveryAddress: addr });
      clearCart();
      navigate(`/customer/pay/${order.id}`);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  if (!items.length) return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-2xl mb-3">🛒</p>
      <p className="text-inkmuted">Your cart is empty.</p>
      <Link to="/customer" className="mt-3 inline-block font-semibold text-amber">Browse stores →</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">Your cart</h1>
      <p className="text-sm text-inkmuted">{storeName}</p>
      <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface">
        {items.map((item,i) => (
          <div key={item.productId} className={`flex items-center gap-3 p-4 ${i>0?'border-t border-line':''}`}>
            {item.image
              ? <img src={item.image} className="h-12 w-12 rounded-xl object-cover" />
              : <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-elevated text-xl">🛍️</div>}
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">{item.name}</p>
              <p className="font-mono text-sm text-amber">ETB {item.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>updateQuantity(item.productId,item.quantity-1)} className="h-7 w-7 rounded-full border border-line text-inkmuted hover:border-amber/40 hover:text-amber transition-all">−</button>
              <span className="w-5 text-center text-sm font-semibold text-ink">{item.quantity}</span>
              <button onClick={()=>updateQuantity(item.productId,item.quantity+1)} className="h-7 w-7 rounded-full border border-line text-inkmuted hover:border-amber/40 hover:text-amber transition-all">+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-line bg-surface p-4 text-sm">
        <div className="flex justify-between text-inkmuted"><span>Subtotal</span><span className="font-mono">ETB {subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between text-inkmuted mt-1"><span>Delivery fee</span><span className="font-mono">ETB {FEE.toFixed(2)}</span></div>
        <div className="flex justify-between font-bold text-ink mt-2 pt-2 border-t border-line"><span>Total</span><span className="font-mono text-amber">ETB {(subtotal+FEE).toFixed(2)}</span></div>
      </div>
      <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-inkmuted mb-1.5">Delivery address</label>
      <input id="addr-in" onChange={e=>setAddress(e.target.value)} placeholder="Street, area, building…"
        className="w-full rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm text-ink outline-none transition-all focus:border-amber/50 focus:shadow-green-sm" />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <button onClick={placeOrder} disabled={busy}
        className="mt-5 w-full rounded-xl bg-amber py-3 text-sm font-bold text-paper shadow-green-sm transition-all hover:shadow-green-md active:scale-[0.98] disabled:opacity-50">
        {busy ? 'Placing order…' : `Place order · ETB ${(subtotal+FEE).toFixed(2)}`}
      </button>
    </div>
  );
}
