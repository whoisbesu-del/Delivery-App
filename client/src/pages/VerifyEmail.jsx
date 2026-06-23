import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function VerifyEmail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputs = useRef([]);

  useEffect(() => {
    if (!user) navigate('/login');
    else if (user.emailVerified) navigate(`/${user.role}`);
    inputs.current[0]?.focus();
  }, []);

  function handleChange(i, val) {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  }

  function handlePaste(e) {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(''));
      inputs.current[5]?.focus();
    }
  }

  async function verify() {
    const code = otp.join('');
    if (code.length < 6) { setError('Enter the full 6-digit code.'); return; }
    setBusy(true); setError('');
    try {
      const token = localStorage.getItem('south_token');
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otp: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed.');
      setVerified(true);
      setTimeout(() => navigate(`/${user.role}`), 1500);
    } catch (err) { setError(err.message); setOtp(['','','','','','']); inputs.current[0]?.focus(); }
    finally { setBusy(false); }
  }

  async function resend() {
    setBusy(true);
    try {
      const token = localStorage.getItem('south_token');
      await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/resend-otp', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setResent(true); setTimeout(() => setResent(false), 3000);
    } catch {}
    finally { setBusy(false); }
  }

  if (verified) return (
    <div className="flex min-h-screen items-center justify-center bg-base">
      <div className="text-center check-pop">
        <div className="w-20 h-20 rounded-full bg-green-t flex items-center justify-center text-5xl mx-auto mb-4">✓</div>
        <p className="font-bold text-base text-xl" style={{ fontFamily: 'Space Grotesk' }}>Email verified!</p>
        <p className="text-muted text-sm mt-1">Taking you to your account…</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <div className="w-full max-w-sm slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-green-t flex items-center justify-center text-3xl mx-auto mb-4">📧</div>
          <h1 className="font-bold text-base text-2xl" style={{ fontFamily: 'Space Grotesk' }}>Check your email</h1>
          <p className="text-muted text-sm mt-2">
            We sent a 6-digit code to<br />
            <span className="font-semibold text-green">{user?.email}</span>
          </p>
        </div>

        <div className="card p-6">
          <div className="flex gap-2 justify-center mb-5" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-12 h-14 rounded-xl text-center text-2xl font-bold transition-all"
                style={{
                  background: 'var(--bg3)',
                  border: `2px solid ${digit ? 'var(--primary)' : 'var(--border)'}`,
                  color: 'var(--text)',
                }}
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-xl border text-center px-3 py-2 text-sm animate-in"
              style={{ borderColor: 'var(--red)', background: 'rgba(239,68,68,0.08)', color: 'var(--red)' }}>
              {error}
            </div>
          )}

          <button onClick={verify} disabled={busy || otp.join('').length < 6}
            className="btn-green btn-glow w-full py-3 rounded-xl text-sm">
            {busy ? 'Verifying…' : 'Verify email'}
          </button>

          <div className="mt-4 text-center">
            {resent ? (
              <p className="text-sm text-green check-pop">✓ New code sent!</p>
            ) : (
              <button onClick={resend} disabled={busy} className="text-sm text-muted hover:text-base transition-colors">
                Didn't receive it? <span className="text-green font-semibold">Resend code</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
