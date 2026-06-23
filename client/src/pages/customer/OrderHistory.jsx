import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import BackButton from '../../components/BackButton.jsx';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.myOrders().then(({ orders }) => setOrders(orders)).finally(() => setLoading(false)); }, []);

  return (
    <div className="bg-base min-h-screen pb-nav page-enter">
      <div className="card rounded-none border-x-0 border-t-0 sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
        <BackButton />
        <p className="font-bold text-base">My Orders</p>
      </div>

      {loading ? (
        <div className="p-3 space-y-2">{[1,2,3].map(i=><div key={i} className="h-20 skeleton rounded-2xl"/>)}</div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted">
          <p className="text-5xl mb-3">📦</p>
          <p className="font-semibold text-base">No orders yet</p>
          <Link to="/customer" className="mt-3 btn-green px-5 py-2 rounded-xl text-sm">Start shopping</Link>
        </div>
      ) : (
        <div className="p-3 space-y-2">
          {orders.map((order, i) => (
            <Link key={order.id} to={`/customer/orders/${order.id}`}
              className="card rounded-2xl p-4 flex items-center gap-3 tap-scale transition-all slide-up"
              style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base">{order.store?.name}</p>
                <p className="text-sm text-muted">Order #{order.id} · {order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                <p className="text-sm font-mono font-bold text-green">ETB {order.total.toFixed(2)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={order.status} />
                <span className="text-dim text-lg">›</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
