import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ROLES = [
  { key:'customer', icon:'🛍️', label:'Shop & order',   hint:'Browse stores and buy products' },
  { key:'seller',   icon:'🏪', label:'Open a store',   hint:'List your products and sell online' },
  { key:'driver',   icon:'🛵', label:'Deliver & earn', hint:'Accept deliveries and earn per order' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', role:'customer' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const up = (k,v) => setForm(f=>({...f,[k]:v}));

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      await register(form);
      navigate('/verify-email');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-base px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-sm slide-up">
        <div className="text-center mb-6">
          <h1 className="font-bold text-base text-2xl" style={{ fontFamily:'Space Grotesk' }}>
            Join <span className="text-green">South Shopping</span>
          </h1>
          <p className="text-muted text-sm mt-1">Pick your role to get started.</p>
        </div>

        <div className="card rounded-2xl p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              {ROLES.map(r => (
                <button type="button" key={r.key} onClick={()=>up('role',r.key)}
                  className="flex items-center gap-3 rounded-xl p-3 text-left tap-scale transition-all"
                  style={{ border:`2px solid ${form.role===r.key ? 'var(--primary)' : 'var(--border)'}`,
                    background: form.role===r.key ? 'var(--primary-t)' : 'var(--bg3)' }}>
                  <span className="text-2xl">{r.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: form.role===r.key ? 'var(--primary)' : 'var(--text)' }}>{r.label}</p>
                    <p className="text-xs text-muted">{r.hint}</p>
                  </div>
                  {form.role===r.key && <span className="text-green font-bold">✓</span>}
                </button>
              ))}
            </div>

            {[
              {label:'Full name',field:'name',type:'text',ph:'Your name',req:true},
              {label:'Email address',field:'email',type:'email',ph:'you@example.com',req:true},
              {label:'Phone (optional)',field:'phone',type:'tel',ph:'+251 9xx xxx xxx',req:false},
              {label:'Password (min 6 chars)',field:'password',type:'password',ph:'••••••••',req:true},
            ].map(f=>(
              <div key={f.field}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">{f.label}</label>
                <input type={f.type} required={f.req} value={form[f.field]} onChange={e=>up(f.field,e.target.value)} placeholder={f.ph}
                  className="w-full rounded-xl px-4 py-3 text-sm" />
              </div>
            ))}

            {error && (
              <div className="rounded-xl px-4 py-2.5 text-sm animate-in"
                style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'var(--red)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-green btn-glow w-full py-3.5 rounded-xl text-sm tap-scale">
              {busy ? 'Creating account…' : 'Create account & verify email'}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          Already have an account? <Link to="/login" className="font-semibold text-green">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
