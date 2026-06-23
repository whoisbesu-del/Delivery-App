import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getMyStore(), api.sellerOrders()])
      .then(([sr, or]) => { setStore(sr.store); setOrders(or.orders); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="bg-base min-h-screen pb-nav p-3">
      <div className="h-8 w-48 skeleton mb-4 rounded-xl"/>
      <div className="grid grid-cols-2 gap-3 mb-4">{[1,2,3,4].map(i=><div key={i} className="h-20 skeleton rounded-2xl"/>)}</div>
    </div>
  );

  if (!store) return (
    <div className="bg-base min-h-screen pb-nav flex flex-col items-center justify-center p-6 text-center page-enter">
      <p className="text-6xl mb-4">🏪</p>
      <h1 className="font-bold text-base text-xl" style={{ fontFamily: 'Space Grotesk' }}>Open your store</h1>
      <p className="text-muted text-sm mt-2 max-w-xs">Submit your store details. Our admin will approve it, usually within a few hours.</p>
      <Link to="/seller/apply" className="mt-5 btn-green btn-glow px-6 py-3 rounded-xl text-sm">Apply to open a store →</Link>
    </div>
  );

  const counts = orders.reduce((a,o) => ({...a,[o.status]:(a[o.status]||0)+1}),{});
  const revenue = orders.filter(o=>o.status==='delivered').reduce((s,o)=>s+o.subtotal,0);

  return (
    <div className="bg-base min-h-screen pb-nav page-enter">
      <div className="card rounded-none border-x-0 border-t-0 sticky top-0 z-10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-base" style={{ fontFamily: 'Space Grotesk' }}>{store.name}</p>
            <p className="text-xs text-muted">{store.category} · {store.address}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
            store.status==='approved' ? 'text-white bg-green' :
            store.status==='rejected' ? 'bg-red-100 text-red-600' : 'bg-muted text-muted'}`}>
            {store.status}
          </span>
        </div>
      </div>

      <div className="p-3">
        {store.status === 'pending' && (
          <div className="card rounded-2xl p-4 mb-3 slide-up" style={{ border: '1px solid var(--border)' }}>
            <p className="text-sm text-muted">⏳ Your store is pending admin approval. You'll be notified once approved.</p>
          </div>
        )}
        {store.status === 'rejected' && (
          <div className="card rounded-2xl p-4 mb-3" style={{ border: '1px solid var(--red)', background: 'rgba(239,68,68,0.06)' }}>
            <p className="text-sm" style={{ color: 'var(--red)' }}>✕ Rejected: {store.rejectionReason || 'Contact admin for details.'}</p>
          </div>
        )}

        {store.status === 'approved' && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label:'Total orders', value: orders.length, icon:'📋' },
                { label:'In progress', value:(counts.pending||0)+(counts.accepted||0)+(counts.picked_up||0), icon:'🔄' },
                { label:'Delivered', value:counts.delivered||0, icon:'✅' },
                { label:'Revenue', value:`ETB ${revenue.toFixed(0)}`, icon:'💰' },
              ].map((s, i) => (
                <div key={s.label} className={`card rounded-2xl p-4 stagger-${i+1}`}>
                  <p className="text-xl mb-1">{s.icon}</p>
                  <p className="font-bold text-base text-xl text-green">{s.value}</p>
                  <p className="text-xs text-muted mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { to:'/seller/products', icon:'📦', label:'Products' },
                { to:'/seller/orders', icon:'📋', label:'Orders' },
                { to:'/seller/store', icon:'⚙️', label:'Edit Store' },
              ].map(link => (
                <Link key={link.to} to={link.to}
                  className="card rounded-2xl p-3 flex flex-col items-center gap-1 tap-scale transition-all">
                  <span className="text-2xl">{link.icon}</span>
                  <span className="text-xs font-semibold text-base">{link.label}</span>
                </Link>
              ))}
            </div>
          </>
        )}

        <p className="text-xs font-semibold uppercase tracking-wider text-dim mb-2">Recent orders</p>
        <div className="card rounded-2xl overflow-hidden">
          {orders.slice(0,5).map((o,i) => (
            <div key={o.id} className="flex items-center justify-between p-4"
              style={{ borderTop: i>0 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <p className="font-semibold text-base text-sm">Order #{o.id}</p>
                <p className="text-xs text-muted">{o.customer?.name} · ETB {o.total.toFixed(2)}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                o.status==='delivered' ? 'text-white bg-green' : 'bg-muted text-muted'}`}>
                {o.status.replace('_',' ')}
              </span>
            </div>
          ))}
          {orders.length===0 && <p className="p-4 text-sm text-muted text-center">No orders yet.</p>}
        </div>
      </div>
    </div>
  );
}
