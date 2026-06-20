import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

export default function AvailableDeliveries() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [error, setError] = useState('');

  function load() {
    Promise.all([api.availableOrders(), api.activeDelivery()]).then(([poolRes, activeRes]) => {
      setOrders(poolRes.orders);
      setActiveOrder(activeRes.order);
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  async function accept(orderId) {
    setError('');
    setAcceptingId(orderId);
    try {
      await api.acceptOrder(orderId);
      navigate('/driver/active');
    } catch (err) {
      setError(err.message);
      setAcceptingId(null);
      load();
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-amber" />
      </div>
    );
  }

  if (activeOrder) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-slate-500">You already have a delivery in progress.</p>
        <button onClick={() => navigate('/driver/active')} className="mt-3 font-medium text-amber">
          Go to active delivery →
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Available deliveries</h1>
      <p className="text-sm text-slate-500">New requests appear here as customers place orders.</p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {orders.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-line p-8 text-center text-slate-500">
          Nothing in the queue right now. Check back shortly.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wide text-amber">{order.store?.category}</span>
                  <p className="font-medium text-ink">{order.store?.name}</p>
                  <p className="text-sm text-slate-500">{order.store?.address}</p>
                </div>
                <span className="rounded-full bg-tealsoft px-2.5 py-1 text-xs font-mono text-teal">
                  +${order.deliveryFee.toFixed(2)}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">→ {order.deliveryAddress}</p>
              <p className="mt-1 text-sm text-inkmuted">{order.items.length} item{order.items.length > 1 ? 's' : ''} · ${order.total.toFixed(2)} order total</p>
              <button
                onClick={() => accept(order.id)}
                disabled={acceptingId === order.id}
                className="mt-3 w-full rounded-lg bg-ink py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {acceptingId === order.id ? 'Accepting…' : 'Accept delivery'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
