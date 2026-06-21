import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO = [
  { role: 'Customer', email: 'customer@south.app', color: 'hover:border-amber/40 hover:bg-amber/5 hover:text-amber' },
  { role: 'Seller',   email: 'seller@south.app',   color: 'hover:border-teal/40 hover:bg-teal/5 hover:text-teal' },
  { role: 'Driver',   email: 'driver@south.app',   color: 'hover:border-blue-400/40 hover:bg-blue-400/5 hover:text-blue-400' },
  { role: 'Admin',    email: 'admin@south.app',     color: 'hover:border-purple-400/40 hover:bg-purple-400/5 hover:text-purple-400' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try { const u = await login(email, password); navigate(`/${u.role}`); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-4">
      <div className="pointer-events-none absolute inset-0 bg-green-glow" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-amber/5 blur-3xl" />
      <div className="relative w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber/20 bg-amber/10 shadow-green-md">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <text x="50%" y="60%" dominantBaseline="middle" textAnchor="middle" fontSize="26" fontWeight="800" fill="#22C55E" fontFamily="Space Grotesk, sans-serif">S</text>
            </svg>
          </div>
          <h1 className="font-display text-3xl font-bold"><span className="text-ink">South</span><span className="text-amber"> Shopping</span></h1>
          <p className="mt-1 text-sm text-inkmuted">Your marketplace, delivered.</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inkmuted">Email</label>
              <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm text-ink outline-none transition-all focus:border-amber/50 focus:shadow-green-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inkmuted">Password</label>
              <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
                className="w-full rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm text-ink outline-none transition-all focus:border-amber/50 focus:shadow-green-sm" />
            </div>
            {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}
            <button type="submit" disabled={busy}
              className="w-full rounded-xl bg-amber py-3 text-sm font-bold text-paper shadow-green-sm transition-all hover:shadow-green-md active:scale-[0.98] disabled:opacity-50">
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-sm text-inkmuted">No account? <Link to="/register" className="font-semibold text-amber hover:opacity-80">Sign up</Link></p>
        <div className="mt-4 rounded-2xl border border-dashed border-line/60 p-4">
          <p className="mb-3 text-center text-xs font-mono uppercase tracking-widest text-inkmuted/60">Demo accounts · password123</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO.map(acc => (
              <button key={acc.email} onClick={() => { setEmail(acc.email); setPassword('password123'); }}
                className={`rounded-xl border border-line py-2 text-xs font-semibold text-inkmuted transition-all ${acc.color}`}>
                {acc.role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
