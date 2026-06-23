import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

export default function AvailableDeliveries() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [error, setError] = useState('');

  function load() {
    Promise.all([api.availableOrders(), api.activeDelivery()]).then(([pr, ar]) => {
      setOrders(pr.orders); setActiveOrder(ar.order);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, []);

  async function accept(orderId) {
    setError(''); setAcceptingId(orderId);
    try { await api.acceptOrder(orderId); navigate('/driver/active'); }
    catch (err) { setError(err.message); load(); }
    finally { setAcceptingId(null); }
  }

  if (activeOrder) return (
    <div className="bg-base min-h-screen pb-nav flex flex-col items-center justify-center p-6 text-center">
      <p className="text-5xl mb-3">🛵</p>
      <p className="font-bold text-base text-lg">You have an active delivery</p>
      <p className="text-muted text-sm mt-1">Complete it before accepting another.</p>
      <button onClick={() => navigate('/driver/active')}
        className="mt-4 btn-green px-6 py-2.5 rounded-xl text-sm">Go to active delivery →</button>
    </div>
  );

  return (
    <div className="bg-base min-h-screen pb-nav page-enter">
      <div className="card rounded-none border-x-0 border-t-0 sticky top-0 z-10 px-4 py-3">
        <p className="font-bold text-base text-lg" style={{ fontFamily: 'Space Grotesk' }}>Available Deliveries</p>
        <p className="text-xs text-muted">New orders appear here automatically</p>
      </div>

      {error && <div className="mx-3 mt-3 rounded-xl px-4 py-2 text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--red)' }}>{error}</div>}

      {loading ? (
        <div className="p-3 space-y-3">{[1,2].map(i=><div key={i} className="h-40 skeleton rounded-2xl"/>)}</div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted">
          <p className="text-5xl mb-3">📭</p>
          <p className="font-semibold text-base">No orders available</p>
          <p className="text-sm mt-1">Check back shortly</p>
        </div>
      ) : (
        <div className="p-3 space-y-3">
          {orders.map((order, i) => (
            <div key={order.id} className="card rounded-2xl p-4 slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-dim uppercase tracking-wider">{order.store?.category}</p>
                  <p className="font-bold text-base">{order.store?.name}</p>
                  <p className="text-sm text-muted">📍 {order.store?.address}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-green">
                  +ETB {order.deliveryFee.toFixed(2)}
                </span>
              </div>
              <div className="rounded-xl p-3 mb-3" style={{ background: 'var(--bg3)' }}>
                <p className="text-xs text-dim mb-1">Deliver to</p>
                <p className="text-sm font-semibold text-base">🏠 {order.deliveryAddress}</p>
              </div>
              <p className="text-sm text-muted mb-3">{order.items.length} item{order.items.length > 1 ? 's' : ''} · ETB {order.total.toFixed(2)} order total</p>
              <button onClick={() => accept(order.id)} disabled={acceptingId === order.id}
                className="btn-green btn-glow w-full py-3 rounded-xl text-sm tap-scale">
                {acceptingId === order.id ? 'Accepting…' : 'Accept delivery'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
