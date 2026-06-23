import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import BackButton from '../../components/BackButton.jsx';

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
    Promise.all([api.getOrder(orderId), api.getPaymentSettings()])
      .then(([or, sr]) => { setOrder(or.order); setSettings(sr.settings); });
  }, [orderId]);

  function handleFile(e) {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => { setImage(ev.target.result); setPreview(ev.target.result); };
    r.readAsDataURL(file);
  }

  async function submit() {
    if (!image) { setError('Please select your receipt screenshot.'); return; }
    setSubmitting(true); setError('');
    try {
      await api.submitReceipt(orderId, image);
      setSubmitted(true);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  if (submitted) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-green-t flex items-center justify-center text-5xl check-pop mx-auto mb-4">✓</div>
      <h1 className="font-bold text-base text-xl" style={{ fontFamily: 'Space Grotesk' }}>Receipt submitted!</h1>
      <p className="text-muted text-sm mt-2">We'll verify your payment within 5 minutes.</p>
      <button onClick={() => navigate(`/customer/orders/${orderId}`)}
        className="mt-6 btn-green btn-glow px-6 py-3 rounded-xl text-sm">Track my order →</button>
    </div>
  );

  if (!order || !settings) return (
    <div className="flex min-h-screen items-center justify-center bg-base">
      <div className="w-8 h-8 rounded-full border-2 border-green spin" style={{ borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="bg-base min-h-screen pb-nav page-enter">
      <div className="card rounded-none border-x-0 border-t-0 sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
        <BackButton />
        <p className="font-bold text-base">Pay for Order #{order.id}</p>
      </div>

      <div className="p-3 space-y-3">
        {/* Bank details */}
        <div className="card rounded-2xl p-4" style={{ border: '2px solid var(--primary)', background: 'var(--primary-t)' }}>
          <p className="text-xs font-bold uppercase tracking-wider text-green mb-3">Transfer to this account</p>
          {settings.bankName && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Bank</span>
              <span className="font-semibold text-base">{settings.bankName}</span>
            </div>
          )}
          {settings.accountNumber && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Account number</span>
              <span className="font-bold font-mono text-base">{settings.accountNumber}</span>
            </div>
          )}
          {settings.accountHolder && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Account name</span>
              <span className="font-semibold text-base">{settings.accountHolder}</span>
            </div>
          )}
          <div className="flex justify-between text-sm pt-2 mt-1" style={{ borderTop: '1px solid var(--primary)' }}>
            <span className="text-muted">Amount</span>
            <span className="font-bold text-green text-lg font-mono">ETB {order.total.toFixed(2)}</span>
          </div>
          {settings.instructions && (
            <p className="mt-3 text-xs text-muted">{settings.instructions}</p>
          )}
        </div>

        {/* Receipt upload */}
        <div className="card rounded-2xl p-4">
          <p className="font-semibold text-base text-sm mb-1">Upload payment receipt</p>
          <p className="text-xs text-muted mb-3">After transferring, take a screenshot and upload it here.</p>
          <label className="flex flex-col items-center justify-center cursor-pointer rounded-2xl p-6 transition-all tap-scale"
            style={{ border: '2px dashed var(--border)' }}>
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            {preview
              ? <img src={preview} className="max-h-48 rounded-xl object-contain" />
              : <>
                  <span className="text-4xl mb-2">📎</span>
                  <p className="text-sm font-semibold text-muted">Tap to select screenshot</p>
                  <p className="text-xs text-dim">JPG, PNG supported</p>
                </>}
          </label>
        </div>

        {error && <p className="text-sm px-1" style={{ color: 'var(--red)' }}>{error}</p>}

        <button onClick={submit} disabled={submitting || !image}
          className="btn-green btn-glow w-full py-3.5 rounded-xl text-sm tap-scale">
          {submitting ? 'Submitting…' : 'Submit receipt for verification'}
        </button>
      </div>
    </div>
  );
}
