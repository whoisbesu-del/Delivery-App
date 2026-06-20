import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { api } from '../../api.js';

const DELIVERY_FEE = 4.99;

export default function Cart() {
  const { storeId, storeName, items, updateQuantity, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function placeOrder() {
    if (!address.trim()) {
      setError('Add a delivery address first.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const { order } = await api.placeOrder({
        storeId,
        items: items.map((i) => ({ itemId: i.itemId, quantity: i.quantity })),
        deliveryAddress: address.trim(),
      });
      clearCart();
      navigate(`/customer/orders/${order.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-slate-500">Your cart is empty.</p>
        <Link to="/customer" className="mt-3 inline-block font-medium text-amber">
          Browse stores →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Your cart</h1>
      <p className="text-sm text-slate-500">{storeName}</p>

      <div className="mt-5 divide-y divide-line rounded-xl border border-line bg-surface">
        {items.map((item) => (
          <div key={item.itemId} className="flex items-center justify-between gap-3 p-4">
            <div className="flex-1">
              <p className="font-medium text-ink">{item.name}</p>
              <p className="font-mono text-sm text-slate-500">${item.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                className="h-7 w-7 rounded-full border border-line text-inkmuted hover:bg-paper"
              >
                −
              </button>
              <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                className="h-7 w-7 rounded-full border border-line text-inkmuted hover:bg-paper"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-1.5 rounded-xl border border-line bg-surface p-4 text-sm">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal</span>
          <span className="font-mono">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Delivery fee</span>
          <span className="font-mono">${DELIVERY_FEE.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t border-line pt-1.5 font-semibold text-ink">
          <span>Total</span>
          <span className="font-mono">${(subtotal + DELIVERY_FEE).toFixed(2)}</span>
        </div>
      </div>

      <label className="mb-1 mt-5 block text-sm font-medium text-inkmuted">Delivery address</label>
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Street, city, unit number…"
        className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-amber"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        onClick={placeOrder}
        disabled={busy}
        className="mt-5 w-full rounded-lg bg-ink py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? 'Placing order…' : `Place order · $${(subtotal + DELIVERY_FEE).toFixed(2)}`}
      </button>
    </div>
  );
}
