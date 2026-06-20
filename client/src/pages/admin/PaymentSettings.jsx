import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';

export default function PaymentSettings() {
  const [form, setForm] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    instructions: '',
  });
  const [pending, setPending] = useState([]);
  const [receipts, setReceipts] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPaymentSettings().then(({ settings }) => {
      if (settings) setForm((f) => ({ ...f, ...settings }));
    });
    loadPending();
  }, []);

  function loadPending() {
    api.getPendingPayments().then(({ orders }) => setPending(orders));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.savePaymentSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function loadReceipt(orderId) {
    if (receipts[orderId]) return;
    const { receiptImage } = await api.getReceipt(orderId);
    setReceipts((r) => ({ ...r, [orderId]: receiptImage }));
  }

  async function verify(orderId) {
    await api.verifyPayment(orderId);
    loadPending();
    setReceipts((r) => { const n = { ...r }; delete n[orderId]; return n; });
  }

  async function reject(orderId) {
    const reason = prompt('Reason for rejection (shown to customer):') || 'Payment could not be confirmed.';
    await api.rejectPayment(orderId, reason);
    loadPending();
    setReceipts((r) => { const n = { ...r }; delete n[orderId]; return n; });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Payment Settings</h1>
      <p className="text-sm text-slate-500">Set your bank account details. Customers see this when checking out.</p>

      <form onSubmit={save} className="mt-5 rounded-xl border border-line bg-surface p-5">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-inkmuted">Bank name</label>
            <input
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              placeholder="e.g. Commercial Bank of Ethiopia"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-inkmuted">Account number</label>
            <input
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              placeholder="e.g. 1000123456789"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-inkmuted">Account holder name</label>
            <input
              value={form.accountHolder}
              onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
              placeholder="e.g. Relay Delivery PLC"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-inkmuted">Instructions for customers (optional)</label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              placeholder="e.g. Transfer the exact amount and upload your receipt. Payment is verified within 5 minutes."
              rows={3}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-amber"
            />
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-lg bg-ink px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">
        Pending verification
        {pending.length > 0 && (
          <span className="ml-2 rounded-full bg-amber px-2.5 py-0.5 text-sm text-white">{pending.length}</span>
        )}
      </h2>
      <p className="text-sm text-slate-500">Orders waiting for you to confirm their bank transfer.</p>

      {pending.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-line p-6 text-center text-sm text-slate-500">
          No payments waiting for verification.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {pending.map((order) => (
            <div key={order.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-ink">Order #{order.id} · {order.store_name}</p>
                  <p className="text-sm text-slate-500">{order.customer_name} · {order.customer_email}</p>
                  <p className="font-mono text-sm text-amber">Amount due: ${parseFloat(order.total).toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Receipt submitted {new Date(order.receipt_submitted_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {!receipts[order.id] ? (
                <button
                  onClick={() => loadReceipt(order.id)}
                  className="mt-3 rounded-lg border border-line px-4 py-1.5 text-sm text-inkmuted hover:bg-paper"
                >
                  View receipt
                </button>
              ) : (
                <div className="mt-3">
                  <img
                    src={receipts[order.id]}
                    alt="Payment receipt"
                    className="max-h-64 rounded-lg border border-line object-contain"
                  />
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => verify(order.id)}
                  className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  ✓ Verify payment
                </button>
                <button
                  onClick={() => reject(order.id)}
                  className="rounded-lg border border-line px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
