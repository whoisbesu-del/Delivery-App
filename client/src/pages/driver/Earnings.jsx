import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';

export default function Earnings() {
  const [data, setData] = useState({ orders: [], earnings: 0, deliveryCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.driverHistory().then(setData).finally(() => setLoading(false));
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
      <h1 className="font-display text-2xl font-semibold text-ink">Earnings</h1>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="font-mono text-[11px] uppercase tracking-wide text-slate-500">Total earned</p>
          <p className="mt-1 font-display text-2xl font-semibold text-teal">${data.earnings.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="font-mono text-[11px] uppercase tracking-wide text-slate-500">Deliveries</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">{data.deliveryCount}</p>
        </div>
      </div>

      <p className="mt-6 mb-2 text-xs font-mono uppercase tracking-wide text-slate-500">Completed deliveries</p>
      {data.orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-8 text-center text-slate-500">
          No completed deliveries yet.
        </div>
      ) : (
        <div className="divide-y divide-line rounded-xl border border-line bg-surface">
          {data.orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-ink">{order.store?.name}</p>
                <p className="text-sm text-slate-500">Order #{order.id} → {order.deliveryAddress}</p>
              </div>
              <span className="font-mono text-sm text-teal">+${order.deliveryFee.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
