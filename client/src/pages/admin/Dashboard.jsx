import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';

export default function Dashboard() {
  const [stores, setStores] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listStores(), api.allOrders()]).then(([storesRes, ordersRes]) => {
      setStores(storesRes.stores);
      setOrders(ordersRes.orders);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-amber" />
      </div>
    );
  }

  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});
  const revenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.subtotal, 0);
  const inFlight = (counts.pending || 0) + (counts.accepted || 0) + (counts.picked_up || 0);

  const stats = [
    { label: 'Stores live', value: stores.length, to: '/admin/stores' },
    { label: 'Orders in flight', value: inFlight, to: '/admin/orders' },
    { label: 'Delivered all-time', value: counts.delivered || 0, to: '/admin/orders' },
    { label: 'Revenue (delivered)', value: `$${revenue.toFixed(2)}`, to: '/admin/orders' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
      <p className="text-sm text-slate-500">A snapshot of everything moving through Relay right now.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="rounded-xl border border-line bg-surface p-5 hover:shadow-sm">
            <p className="font-mono text-[11px] uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink">{s.value}</p>
          </Link>
        ))}
      </div>

      <p className="mt-8 mb-2 text-xs font-mono uppercase tracking-wide text-slate-500">Stores by category</p>
      <div className="flex flex-wrap gap-2">
        {Object.entries(
          stores.reduce((acc, s) => {
            acc[s.category] = (acc[s.category] || 0) + 1;
            return acc;
          }, {})
        ).map(([category, count]) => (
          <span key={category} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-inkmuted">
            {category} <span className="font-mono text-amber">{count}</span>
          </span>
        ))}
      </div>

      <p className="mt-8 mb-2 text-xs font-mono uppercase tracking-wide text-slate-500">Recent orders</p>
      <div className="divide-y divide-line rounded-xl border border-line bg-surface">
        {orders.slice(0, 5).map((order) => (
          <div key={order.id} className="flex items-center justify-between p-4 text-sm">
            <span className="text-ink">#{order.id} · {order.store?.name}</span>
            <span className="font-mono text-slate-500">${order.total.toFixed(2)}</span>
          </div>
        ))}
        {orders.length === 0 && <p className="p-4 text-sm text-slate-500">No orders yet.</p>}
      </div>
    </div>
  );
}
