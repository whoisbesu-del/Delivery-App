import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ROLES = [
  { key: 'customer', label: 'Order things', hint: 'Browse stores and place orders' },
  { key: 'driver', label: 'Deliver things', hint: 'Pick up orders and earn per delivery' },
  { key: 'admin', label: 'Manage a store', hint: 'Run the catalog and oversee orders' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'customer' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await register(form);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center font-display text-2xl font-semibold text-ink">Create your account</h1>
        <p className="mb-6 text-center text-sm text-slate-500">Pick how you'll use Relay.</p>

        <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-6 shadow-sm">
          <div className="mb-4 grid grid-cols-1 gap-2">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.key}
                onClick={() => update('role', r.key)}
                className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                  form.role === r.key ? 'border-amber bg-ambersoft' : 'border-line hover:bg-paper'
                }`}
              >
                <span className="block text-sm font-medium text-ink">{r.label}</span>
                <span className="block text-xs text-slate-500">{r.hint}</span>
              </button>
            ))}
          </div>

          <label className="mb-1 block text-sm font-medium text-inkmuted">Full name</label>
          <input
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="mb-3 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-amber"
          />
          <label className="mb-1 block text-sm font-medium text-inkmuted">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className="mb-3 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-amber"
          />
          <label className="mb-1 block text-sm font-medium text-inkmuted">Phone (optional)</label>
          <input
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            className="mb-3 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-amber"
          />
          <label className="mb-1 block text-sm font-medium text-inkmuted">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            className="mb-4 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-amber"
          />
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-ink py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-amber">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
