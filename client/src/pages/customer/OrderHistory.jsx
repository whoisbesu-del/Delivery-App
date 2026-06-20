import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.myOrders().then(({ orders }) => setOrders(orders)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-amber" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Your orders</h1>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-line p-8 text-center text-slate-500">
          No orders yet. <Link to="/customer" className="font-medium text-amber">Browse stores</Link> to place your first one.
        </div>
      ) : (
        <div className="mt-5 divide-y divide-line rounded-xl border border-line bg-surface">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/customer/orders/${order.id}`}
              className="flex items-center justify-between gap-4 p-4 hover:bg-paper"
            >
              <div>
                <p className="font-medium text-ink">{order.store?.name}</p>
                <p className="text-sm text-slate-500">
                  Order #{order.id} · {order.items.length} item{order.items.length > 1 ? 's' : ''} · ${order.total.toFixed(2)}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
