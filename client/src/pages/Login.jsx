import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO_ACCOUNTS = [
  { role: 'Customer', email: 'customer@relay.app' },
  { role: 'Driver', email: 'driver@relay.app' },
  { role: 'Admin', email: 'admin@relay.app' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(demoEmail) {
    setEmail(demoEmail);
    setPassword('password123');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mb-3">
            <path d="M4 18 L9 13 L13 16 L20 8" stroke="#FF6B35" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0.5 4.5" />
            <circle cx="4" cy="18" r="2" fill="#14213D" />
            <circle cx="20" cy="8" r="2" fill="#2D9D78" />
          </svg>
          <h1 className="font-display text-2xl font-semibold text-ink">Relay</h1>
          <p className="mt-1 text-sm text-slate-500">Delivery, on track.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 shadow-sm">
          <label className="mb-1 block text-sm font-medium text-inkmuted">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-amber"
            placeholder="you@example.com"
          />
          <label className="mb-1 block text-sm font-medium text-inkmuted">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-amber"
            placeholder="••••••••"
          />
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-ink py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          No account?{' '}
          <Link to="/register" className="font-medium text-amber">
            Sign up
          </Link>
        </p>

        <div className="mt-6 rounded-xl border border-dashed border-line p-4">
          <p className="mb-2 text-xs font-mono uppercase tracking-wide text-slate-500">Demo accounts · password123</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                onClick={() => fillDemo(acc.email)}
                className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-medium text-inkmuted hover:bg-ambersoft hover:text-amber"
              >
                {acc.role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
