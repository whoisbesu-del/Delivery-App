import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Setup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const up = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError(''); setBusy(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, phone: form.phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Setup failed.');
      localStorage.setItem('south_token', data.token);
      window.location.href = '/admin';
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
          <p className="mt-1 text-center text-sm text-inkmuted">Welcome! Create your admin account to get started.</p>
        </div>

        <div className="rounded-2xl border border-amber/20 bg-surface p-6 shadow-green-sm">
          <div className="mb-5 rounded-xl border border-amber/20 bg-amber/5 px-4 py-3">
            <p className="text-xs font-semibold text-amber">⚡ First-time setup</p>
            <p className="mt-0.5 text-xs text-inkmuted">This screen appears only once. After you create the admin account, it's gone forever.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full name', field: 'name', type: 'text', ph: 'Your name', req: true },
              { label: 'Email address', field: 'email', type: 'email', ph: 'admin@yourbusiness.com', req: true },
              { label: 'Phone (optional)', field: 'phone', type: 'tel', ph: '+251 9xx xxx xxx', req: false },
              { label: 'Password', field: 'password', type: 'password', ph: 'Min 6 characters', req: true },
              { label: 'Confirm password', field: 'confirm', type: 'password', ph: 'Repeat password', req: true },
            ].map(f => (
              <div key={f.field}>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-inkmuted">{f.label}</label>
                <input
                  type={f.type}
                  required={f.req}
                  value={form[f.field]}
                  onChange={e => up(f.field, e.target.value)}
                  placeholder={f.ph}
                  className="w-full rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm text-ink outline-none transition-all focus:border-amber/50 focus:shadow-green-sm"
                />
              </div>
            ))}

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-amber py-3 text-sm font-bold text-paper shadow-green-sm transition-all hover:shadow-green-md active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? 'Creating admin account…' : 'Create admin account →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
