import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import RouteTracker from '../../components/RouteTracker.jsx';

const NEXT = { accepted:'picked_up', picked_up:'delivered' };
const NEXT_LABEL = { accepted:'Mark picked up', picked_up:'Mark delivered' };

function Countdown({ deadline }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    function tick() { setSecs(Math.max(0, Math.floor((new Date(deadline) - Date.now()) / 1000))); }
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, [deadline]);
  const mins = Math.floor(secs/60); const s = secs%60;
  const urgent = secs < 300;
  if (secs === 0) return <span className="text-red-400 font-mono text-sm font-bold">Expired — reassigning…</span>;
  return <span className={`font-mono text-sm font-bold ${urgent?'text-red-400':'text-amber'}`}>{mins}:{String(s).padStart(2,'0')} to pick up</span>;
}

export default function ActiveDelivery() {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function load() { api.activeDelivery().then(({order})=>setOrder(order)).finally(()=>setLoading(false)); }
  useEffect(() => { load(); const t=setInterval(load,10000); return ()=>clearInterval(t); }, []);

  async function advance() {
    if (!order) return;
    setBusy(true); setError('');
    try {
      const { order: updated } = await api.updateOrderStatus(order.id, NEXT[order.status]);
      if (NEXT[order.status] === 'delivered') navigate('/driver/earnings');
      else setOrder(updated);
    } catch(err) { setError(err.message); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-amber" /></div>;
  if (!order) return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-2xl mb-3">🛵</p>
      <p className="text-inkmuted">No active delivery.</p>
      <button onClick={()=>navigate('/driver')} className="mt-3 text-amber font-semibold hover:opacity-80">Browse available →</button>
    </div>
  );

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink">Active delivery</h1>
      <p className="text-sm text-inkmuted">Order #{order.id} · {order.store?.name}</p>

      {/* 20-min countdown for pickup */}
      {order.status === 'accepted' && order.pickupDeadline && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber/20 bg-amber/10 px-4 py-3">
          <span className="text-xl">⏱</span>
          <div>
            <p className="text-xs text-inkmuted">Pickup deadline</p>
            <Countdown deadline={order.pickupDeadline} />
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface p-5">
        <RouteTracker status={order.status} />
      </div>

      <div className="mt-4 space-y-3 rounded-2xl border border-line bg-surface p-4 text-sm">
        <div><p className="font-mono text-[10px] uppercase tracking-wider text-inkmuted">Pickup from</p><p className="font-medium text-ink">{order.store?.name} — {order.store?.address}</p></div>
        <div><p className="font-mono text-[10px] uppercase tracking-wider text-inkmuted">Deliver to</p><p className="font-medium text-ink">{order.deliveryAddress}</p></div>
        <div><p className="font-mono text-[10px] uppercase tracking-wider text-inkmuted">Customer</p><p className="font-medium text-ink">{order.customer?.name} {order.customer?.phone&&`· ${order.customer.phone}`}</p></div>
        <div className="border-t border-line pt-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-inkmuted mb-1">Items</p>
          {order.items.map(i=><p key={i.id} className="text-ink">{i.quantity}× {i.name}</p>)}
        </div>
        <div className="flex justify-between border-t border-line pt-3 font-bold"><span>Your earnings</span><span className="font-mono text-amber">ETB {order.deliveryFee.toFixed(2)}</span></div>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {NEXT[order.status] && (
        <button onClick={advance} disabled={busy}
          className="mt-5 w-full rounded-xl bg-amber py-3 text-sm font-bold text-paper shadow-green-sm transition-all hover:shadow-green-md active:scale-[0.98] disabled:opacity-50">
          {busy ? 'Updating…' : NEXT_LABEL[order.status]}
        </button>
      )}
    </div>
  );
}
