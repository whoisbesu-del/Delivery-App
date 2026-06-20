import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

export default function PaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState(null);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getOrder(orderId).then(({ order }) => setOrder(order));
    api.getPaymentSettings().then(({ settings }) => setSettings(settings));
  }, [orderId]);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target.result);
      setPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  async function submitReceipt() {
    if (!image) { setError('Please select your receipt screenshot first.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await api.submitReceipt(orderId, image);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!order || !settings) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-amber" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-tealsoft text-2xl">✓</div>
        <h1 className="font-display text-xl font-semibold text-ink">Receipt submitted!</h1>
        <p className="mt-2 text-sm text-slate-500">
          We'll verify your payment within 5 minutes and your order will be on its way.
        </p>
        <button
          onClick={() => navigate(`/customer/orders/${orderId}`)}
          className="mt-6 rounded-lg bg-ink px-6 py-2.5 text-sm font-semibold text-white"
        >
          Track my order
        </button>
      </div>
    );
  }

  const hasSettings = settings.bankName || settings.accountNumber;

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Pay for your order</h1>
      <p className="text-sm text-slate-500">Order #{order.id} · Total: <span className="font-mono font-medium text-ink">${order.total.toFixed(2)}</span></p>

      {/* Bank details */}
      {hasSettings ? (
        <div className="mt-5 rounded-xl border-2 border-amber bg-ambersoft p-5">
          <p className="mb-3 text-xs font-mono uppercase tracking-wide text-amber">Transfer to this account</p>
          <div className="space-y-2 text-sm">
            {settings.bankName && (
              <div className="flex justify-between">
                <span className="text-inkmuted">Bank</span>
                <span className="font-medium text-ink">{settings.bankName}</span>
              </div>
            )}
            {settings.accountNumber && (
              <div className="flex justify-between">
                <span className="text-inkmuted">Account number</span>
                <span className="font-mono font-semibold text-ink">{settings.accountNumber}</span>
              </div>
            )}
            {settings.accountHolder && (
              <div className="flex justify-between">
                <span className="text-inkmuted">Account name</span>
                <span className="font-medium text-ink">{settings.accountHolder}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-amber/30 pt-2">
              <span className="text-inkmuted">Amount to transfer</span>
              <span className="font-mono font-bold text-amber">${order.total.toFixed(2)}</span>
            </div>
          </div>
          {settings.instructions && (
            <p className="mt-3 text-sm text-inkmuted">{settings.instructions}</p>
          )}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-line p-5 text-center text-sm text-slate-500">
          Payment details not configured yet. Contact support.
        </div>
      )}

      {/* Receipt upload */}
      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-ink">Upload your payment receipt</p>
        <p className="mb-3 text-sm text-slate-500">After transferring, take a screenshot of the confirmation and upload it here.</p>

        <label className="block cursor-pointer rounded-xl border-2 border-dashed border-line p-6 text-center hover:border-amber hover:bg-ambersoft transition-colors">
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          {preview ? (
            <img src={preview} alt="Receipt preview" className="mx-auto max-h-48 rounded-lg object-contain" />
          ) : (
            <div>
              <p className="text-2xl">📎</p>
              <p className="mt-1 text-sm font-medium text-inkmuted">Tap to select screenshot</p>
              <p className="text-xs text-slate-500">JPG, PNG supported</p>
            </div>
          )}
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={submitReceipt}
        disabled={submitting || !image}
        className="mt-5 w-full rounded-lg bg-ink py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit receipt for verification'}
      </button>
    </div>
  );
}
