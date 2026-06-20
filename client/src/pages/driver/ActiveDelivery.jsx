import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import RouteTracker from '../../components/RouteTracker.jsx';

const NEXT_STATUS = { accepted: 'picked_up', picked_up: 'delivered' };
const NEXT_LABEL = { accepted: 'Mark picked up', picked_up: 'Mark delivered' };

export default function ActiveDelivery() {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function load() {
    api.activeDelivery().then(({ order }) => setOrder(order)).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function advance() {
    if (!order) return;
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setBusy(true);
    setError('');
    try {
      const { order: updated } = await api.updateOrderStatus(order.id, next);
      if (next === 'delivered') {
        navigate('/driver/earnings');
      } else {
        setOrder(updated);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-amber" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-slate-500">No active delivery.</p>
        <button onClick={() => navigate('/driver')} className="mt-3 font-medium text-amber">
          Browse available deliveries →
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Active delivery</h1>
      <p className="text-sm text-slate-500">Order #{order.id} · {order.store?.name}</p>

      <div className="mt-6 rounded-xl border border-line bg-surface p-5">
        <RouteTracker status={order.status} />
      </div>

      <div className="mt-5 space-y-3 rounded-xl border border-line bg-surface p-4 text-sm">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-slate-500">Pickup</p>
          <p className="text-ink">{order.store?.name} — {order.store?.address}</p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-slate-500">Drop-off</p>
          <p className="text-ink">{order.deliveryAddress}</p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-slate-500">Customer</p>
          <p className="text-ink">{order.customer?.name} {order.customer?.phone ? `· ${order.customer.phone}` : ''}</p>
        </div>
        <div className="border-t border-line pt-3">
          <p className="font-mono text-[11px] uppercase tracking-wide text-slate-500">Items ({order.items.length})</p>
          {order.items.map((item) => (
            <p key={item.id} className="text-ink">{item.quantity}× {item.name}</p>
          ))}
        </div>
        <div className="flex justify-between border-t border-line pt-3 font-semibold text-ink">
          <span>You earn</span>
          <span className="font-mono text-teal">${order.deliveryFee.toFixed(2)}</span>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {NEXT_STATUS[order.status] && (
        <button
          onClick={advance}
          disabled={busy}
          className="mt-5 w-full rounded-lg bg-amber py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Updating…' : NEXT_LABEL[order.status]}
        </button>
      )}
    </div>
  );
}
