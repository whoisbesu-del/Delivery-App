import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import RouteTracker from '../../components/RouteTracker.jsx';

export default function AllOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  function load() {
    api.allOrders().then(({ orders }) => setOrders(orders)).finally(() => setLoading(false));
  }
  useEffect(() => {
    load();
    const interval = setInterval(load, 6000);
    return () => clearInterval(interval);
  }, []);

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  const filters = ['all', 'pending', 'accepted', 'picked_up', 'delivered'];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-amber" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink">All orders</h1>

      <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium ${
              filter === f ? 'bg-ink text-white' : 'border border-line bg-surface text-inkmuted hover:bg-paper'
            }`}
          >
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="mt-5 divide-y divide-line rounded-xl border border-line bg-surface">
        {filtered.map((order) => (
          <div key={order.id}>
            <button
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-paper"
            >
              <div>
                <p className="font-medium text-ink">#{order.id} · {order.store?.name}</p>
                <p className="text-sm text-slate-500">
                  {order.customer?.name} → {order.deliveryAddress}
                  {order.driver ? ` · driver: ${order.driver.name}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-inkmuted">${order.total.toFixed(2)}</span>
                <StatusBadge status={order.status} />
              </div>
            </button>
            {expandedId === order.id && (
              <div className="border-t border-line bg-paper p-4">
                <RouteTracker status={order.status} compact />
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="text-sm">
                    <p className="font-mono text-[11px] uppercase tracking-wide text-slate-500">Items</p>
                    {order.items.map((item) => (
                      <p key={item.id} className="text-ink">{item.quantity}× {item.name}</p>
                    ))}
                  </div>
                  <div className="text-sm">
                    <p className="font-mono text-[11px] uppercase tracking-wide text-slate-500">Totals</p>
                    <p className="text-ink">Subtotal ${order.subtotal.toFixed(2)}</p>
                    <p className="text-ink">Delivery fee ${order.deliveryFee.toFixed(2)}</p>
                    <p className="font-medium text-ink">Total ${order.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="p-4 text-sm text-slate-500">No orders match this filter.</p>}
      </div>
    </div>
  );
}
