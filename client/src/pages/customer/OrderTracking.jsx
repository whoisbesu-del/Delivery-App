import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api.js';
import RouteTracker from '../../components/RouteTracker.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

const STATUS_NOTE = {
  pending: "We're matching your order with a nearby driver.",
  accepted: 'A driver has your order and is heading to the store.',
  picked_up: 'Your order is on the way.',
  delivered: 'Delivered. Enjoy!',
};

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    function poll() {
      api.getOrder(id).then(({ order }) => {
        if (active) setOrder(order);
      }).finally(() => setLoading(false));
    }
    poll();
    const interval = setInterval(poll, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-amber" />
      </div>
    );
  }
  if (!order) return <div className="p-6 text-slate-500">Order not found.</div>;

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <Link to="/customer/orders" className="text-sm text-slate-500 hover:text-ink">
        ← All orders
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Order #{order.id}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="text-sm text-slate-500">{order.store?.name}</p>

      <div className="mt-6 rounded-xl border border-line bg-surface p-5">
        <RouteTracker status={order.status} />
        <p className="mt-5 text-sm text-inkmuted">{STATUS_NOTE[order.status]}</p>
        {order.driver && (
          <p className="mt-3 border-t border-line pt-3 text-sm text-slate-500">
            Driver: <span className="font-medium text-ink">{order.driver.name}</span>
          </p>
        )}
      </div>

      <div className="mt-5 rounded-xl border border-line bg-surface p-4">
        <p className="mb-2 text-xs font-mono uppercase tracking-wide text-slate-500">Items</p>
        <div className="space-y-1.5 text-sm">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span className="text-ink">{item.quantity}× {item.name}</span>
              <span className="font-mono text-slate-500">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between border-t border-line pt-2 text-sm font-semibold text-ink">
          <span>Total</span>
          <span className="font-mono">${order.total.toFixed(2)}</span>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500">Delivering to {order.deliveryAddress}</p>
    </div>
  );
}
