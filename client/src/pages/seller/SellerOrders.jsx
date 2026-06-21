import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.sellerOrders().then(r=>setOrders(r.orders)).finally(()=>setLoading(false)); }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">Store orders</h1>
      {loading ? <div className="mt-5 h-20 animate-pulse rounded-2xl border border-line bg-surface" /> : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface">
          {orders.map((o,i)=>(
            <div key={o.id} className={`flex items-center justify-between gap-4 p-4 ${i>0?'border-t border-line':''}`}>
              <div>
                <p className="font-semibold text-ink">Order #{o.id}</p>
                <p className="text-sm text-inkmuted">{o.customer?.name} · {o.deliveryAddress}</p>
                <p className="text-sm font-mono text-amber">ETB {o.total.toFixed(2)}</p>
              </div>
              <StatusBadge status={o.status} />
            </div>
          ))}
          {orders.length===0 && <p className="p-6 text-center text-sm text-inkmuted">No orders for your store yet.</p>}
        </div>
      )}
    </div>
  );
}
