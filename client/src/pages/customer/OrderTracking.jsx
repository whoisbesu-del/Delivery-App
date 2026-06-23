import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api.js';
import RouteTracker from '../../components/RouteTracker.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import BackButton from '../../components/BackButton.jsx';

const NOTES = {
  pending: "Waiting for payment verification and driver.",
  accepted: 'A driver is heading to pick up your order.',
  picked_up: 'Your order is on the way!',
  delivered: 'Delivered. Enjoy! 🎉',
};

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    function poll() {
      api.getOrder(id).then(({ order }) => { if (active) setOrder(order); }).finally(() => setLoading(false));
    }
    poll();
    const t = setInterval(poll, 4000);
    return () => { active = false; clearInterval(t); };
  }, [id]);

  if (loading) return (
    <div className="bg-base min-h-screen pb-nav">
      <div className="card rounded-none border-x-0 border-t-0 px-4 py-3"><div className="w-48 h-5 skeleton"/></div>
      <div className="p-3 space-y-3">
        <div className="h-32 skeleton rounded-2xl"/><div className="h-40 skeleton rounded-2xl"/>
      </div>
    </div>
  );
  if (!order) return <div className="p-6 text-muted">Order not found.</div>;

  return (
    <div className="bg-base min-h-screen pb-nav page-enter">
      <div className="card rounded-none border-x-0 border-t-0 sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
        <BackButton to="/customer/orders" />
        <div className="flex-1">
          <p className="font-bold text-base text-sm">Order #{order.id}</p>
          <p className="text-xs text-dim">{order.store?.name}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="p-3 space-y-3">
        <div className="card rounded-2xl p-5">
          <div className="overflow-x-auto pb-2">
            <RouteTracker status={order.status} />
          </div>
          <p className="mt-4 text-sm text-muted">{NOTES[order.status]}</p>
          {order.driver && (
            <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-xl">🛵</span>
              <div>
                <p className="text-xs text-dim">Your driver</p>
                <p className="font-semibold text-base text-sm">{order.driver.name}</p>
              </div>
            </div>
          )}
        </div>

        <div className="card rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-dim mb-3">Order items</p>
          <div className="space-y-2">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-base">{item.quantity}× {item.name}</span>
                <span className="font-mono text-muted">ETB {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-base mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <span>Total</span>
            <span className="font-mono text-green">ETB {order.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="card rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-dim mb-1">Delivering to</p>
          <p className="text-sm text-base">📍 {order.deliveryAddress}</p>
        </div>
      </div>
    </div>
  );
}
