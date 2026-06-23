import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const data = await login(email, password);
      if (data.requiresVerification) navigate('/verify-email');
      else navigate(`/${data.user.role}`);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <div className="w-full max-w-sm slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-green-t flex items-center justify-center text-4xl mx-auto mb-3 tap-scale">
            <span className="font-bold text-green text-2xl" style={{ fontFamily:'Space Grotesk' }}>S</span>
          </div>
          <h1 className="font-bold text-base text-2xl" style={{ fontFamily:'Space Grotesk' }}>
            South <span className="text-green">Shopping</span>
          </h1>
          <p className="text-muted text-sm mt-1">Your marketplace, delivered.</p>
        </div>

        <div className="card rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Password</label>
              <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 text-sm" />
            </div>
            {error && (
              <div className="rounded-xl px-4 py-2.5 text-sm animate-in"
                style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'var(--red)' }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={busy} className="btn-green btn-glow w-full py-3.5 rounded-xl text-sm tap-scale">
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-muted">
          No account? <Link to="/register" className="font-semibold text-green">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
