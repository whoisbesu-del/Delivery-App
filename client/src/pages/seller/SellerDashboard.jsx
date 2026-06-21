import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function SellerDashboard() {
  const { user } = useAuth();
  const [store, setStore] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getMyStore(), api.sellerOrders()]).then(([sr, or]) => {
      setStore(sr.store);
      setOrders(or.orders);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-amber" /></div>;

  if (!store) return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mb-4 text-5xl">🏪</div>
      <h1 className="font-display text-xl font-bold text-ink">Open your store</h1>
      <p className="mt-2 text-sm text-inkmuted">Submit your store details and our admin will approve it, usually within a few hours.</p>
      <Link to="/seller/apply" className="mt-5 inline-block rounded-xl bg-amber px-6 py-3 text-sm font-bold text-paper shadow-green-sm transition-all hover:shadow-green-md">
        Apply to open a store →
      </Link>
    </div>
  );

  const pending = store.status === 'pending';
  const rejected = store.status === 'rejected';
  const counts = orders.reduce((a,o)=>({...a,[o.status]:(a[o.status]||0)+1}),{});
  const revenue = orders.filter(o=>o.status==='delivered').reduce((s,o)=>s+o.subtotal,0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{store.name}</h1>
          <p className="text-sm text-inkmuted">{store.category} · {store.address}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
          store.status==='approved' ? 'bg-amber/10 text-amber border border-amber/20' :
          store.status==='rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
          'bg-elevated text-inkmuted border border-line'}`}>
          {store.status}
        </span>
      </div>

      {pending && (
        <div className="mt-4 rounded-xl border border-line bg-elevated p-4 text-sm text-inkmuted">
          ⏳ Your store is pending admin approval. You'll be able to add products once approved.
        </div>
      )}
      {rejected && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          ✕ Your store was rejected: {store.rejectionReason || 'No reason given.'}
        </div>
      )}

      {store.status === 'approved' && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label:'Total orders', value: orders.length },
              { label:'In progress', value: (counts.pending||0)+(counts.accepted||0)+(counts.picked_up||0) },
              { label:'Delivered', value: counts.delivered||0 },
              { label:'Revenue', value: `ETB ${revenue.toFixed(0)}` },
            ].map(s=>(
              <div key={s.label} className="rounded-2xl border border-line bg-surface p-4">
                <p className="text-xs text-inkmuted">{s.label}</p>
                <p className="mt-1 font-display text-2xl font-bold text-amber">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <Link to="/seller/products" className="flex-1 rounded-xl border border-line bg-surface p-4 text-center transition-all hover:border-amber/25 hover:bg-elevated">
              <p className="text-2xl">📦</p>
              <p className="mt-1 text-sm font-semibold text-ink">Manage Products</p>
            </Link>
            <Link to="/seller/orders" className="flex-1 rounded-xl border border-line bg-surface p-4 text-center transition-all hover:border-amber/25 hover:bg-elevated">
              <p className="text-2xl">📋</p>
              <p className="mt-1 text-sm font-semibold text-ink">View Orders</p>
            </Link>
            <Link to="/seller/store" className="flex-1 rounded-xl border border-line bg-surface p-4 text-center transition-all hover:border-amber/25 hover:bg-elevated">
              <p className="text-2xl">⚙️</p>
              <p className="mt-1 text-sm font-semibold text-ink">Edit Store</p>
            </Link>
          </div>

          <p className="mt-8 mb-3 text-xs font-mono uppercase tracking-wider text-inkmuted">Recent orders</p>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {orders.slice(0,5).map((o,i)=>(
              <div key={o.id} className={`flex items-center justify-between p-4 text-sm ${i>0?'border-t border-line':''}`}>
                <div>
                  <p className="font-medium text-ink">Order #{o.id}</p>
                  <p className="text-xs text-inkmuted">{o.customer?.name} · ETB {o.total.toFixed(2)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  o.status==='delivered'?'bg-teal/10 text-teal':
                  o.status==='pending'?'bg-elevated text-inkmuted':'bg-amber/10 text-amber'}`}>
                  {o.status.replace('_',' ')}
                </span>
              </div>
            ))}
            {orders.length===0&&<p className="p-4 text-sm text-inkmuted">No orders yet.</p>}
          </div>
        </>
      )}
    </div>
  );
}
