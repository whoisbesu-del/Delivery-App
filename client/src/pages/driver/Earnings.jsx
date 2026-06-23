import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import BackButton from '../../components/BackButton.jsx';

export default function Earnings() {
  const [data, setData] = useState({ orders:[], earnings:0, deliveryCount:0 });
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.driverHistory().then(setData).finally(() => setLoading(false)); }, []);

  return (
    <div className="bg-base min-h-screen pb-nav page-enter">
      <div className="card rounded-none border-x-0 border-t-0 sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
        <BackButton />
        <p className="font-bold text-base">Earnings</p>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card rounded-2xl p-4 stagger-1">
            <p className="text-xs text-muted">Total earned</p>
            <p className="font-bold text-green text-2xl mt-1 font-mono">ETB {data.earnings.toFixed(2)}</p>
          </div>
          <div className="card rounded-2xl p-4 stagger-2">
            <p className="text-xs text-muted">Deliveries</p>
            <p className="font-bold text-base text-2xl mt-1">{data.deliveryCount}</p>
          </div>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-dim mb-2">Completed deliveries</p>
        {loading ? <div className="h-40 skeleton rounded-2xl" /> :
          data.orders.length === 0 ? (
            <div className="text-center py-10 text-muted">
              <p className="text-4xl mb-2">🛵</p>
              <p>No completed deliveries yet.</p>
            </div>
          ) : (
            <div className="card rounded-2xl overflow-hidden">
              {data.orders.map((order, i) => (
                <div key={order.id} className="flex items-center justify-between p-4"
                  style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div>
                    <p className="font-semibold text-base text-sm">{order.store?.name}</p>
                    <p className="text-xs text-muted">Order #{order.id} → {order.deliveryAddress}</p>
                  </div>
                  <span className="font-bold font-mono text-sm text-green">+ETB {order.deliveryFee.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
