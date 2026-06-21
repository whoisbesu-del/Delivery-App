import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ROLES = [
  { key: 'customer', icon: '🛍️', label: 'Shop & order',   hint: 'Browse stores and buy products' },
  { key: 'seller',   icon: '🏪', label: 'Open a store',   hint: 'List your products and sell online' },
  { key: 'driver',   icon: '🛵', label: 'Deliver & earn', hint: 'Accept deliveries and earn per order' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'customer' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const up = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const u = await register(form);
      navigate(`/${u.role}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-green-glow" />

      <div className="relative w-full max-w-sm animate-fade-in">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold">
            Join <span className="text-amber">South Shopping</span>
          </h1>
          <p className="mt-1 text-sm text-inkmuted">Pick your role to get started.</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              {ROLES.map(r => (
                <button type="button" key={r.key} onClick={() => up('role', r.key)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${form.role === r.key ? 'border-amber/40 bg-amber/10 shadow-green-sm' : 'border-line hover:bg-elevated'}`}>
                  <span className="text-xl">{r.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${form.role === r.key ? 'text-amber' : 'text-ink'}`}>{r.label}</p>
                    <p className="text-xs text-inkmuted">{r.hint}</p>
                  </div>
                  {form.role === r.key && <span className="ml-auto text-amber">✓</span>}
                </button>
              ))}
            </div>

            {[
              { label: 'Full name', field: 'name', type: 'text', ph: 'Your name', req: true },
              { label: 'Email', field: 'email', type: 'email', ph: 'you@example.com', req: true },
              { label: 'Phone (optional)', field: 'phone', type: 'tel', ph: '+251 9xx xxx xxx', req: false },
              { label: 'Password', field: 'password', type: 'password', ph: 'Min 6 characters', req: true },
            ].map(f => (
              <div key={f.field}>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inkmuted">{f.label}</label>
                <input type={f.type} required={f.req} value={form[f.field]} onChange={e => up(f.field, e.target.value)} placeholder={f.ph}
                  className="w-full rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm text-ink outline-none transition-all focus:border-amber/50 focus:shadow-green-sm" />
              </div>
            ))}

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
            )}

            <button type="submit" disabled={busy}
              className="w-full rounded-xl bg-amber py-3 text-sm font-bold text-paper shadow-green-sm transition-all hover:shadow-green-md active:scale-[0.98] disabled:opacity-50">
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-inkmuted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-amber hover:opacity-80">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
