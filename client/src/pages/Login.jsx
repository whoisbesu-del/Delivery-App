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
      const u = await login(email, password);
      navigate(`/${u.role}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-4">
      <div className="pointer-events-none absolute inset-0 bg-green-glow" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-amber/5 blur-3xl" />

      <div className="relative w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber/20 bg-amber/10 shadow-green-md">
            <span className="font-display text-2xl font-bold text-amber">S</span>
          </div>
          <h1 className="font-display text-3xl font-bold">
            <span className="text-ink">South</span>
            <span className="text-amber"> Shopping</span>
          </h1>
          <p className="mt-1 text-sm text-inkmuted">Your marketplace, delivered.</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inkmuted">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm text-ink outline-none transition-all focus:border-amber/50 focus:shadow-green-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inkmuted">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm text-ink outline-none transition-all focus:border-amber/50 focus:shadow-green-sm" />
            </div>
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
            )}
            <button type="submit" disabled={busy}
              className="w-full rounded-xl bg-amber py-3 text-sm font-bold text-paper shadow-green-sm transition-all hover:shadow-green-md active:scale-[0.98] disabled:opacity-50">
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-inkmuted">
          No account?{' '}
          <Link to="/register" className="font-semibold text-amber hover:opacity-80">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
