import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_BY_ROLE = {
  customer: [
    { to: '/customer', label: 'Browse' },
    { to: '/customer/orders', label: 'Orders' },
  ],
  driver: [
    { to: '/driver', label: 'Available' },
    { to: '/driver/active', label: 'Active' },
    { to: '/driver/earnings', label: 'Earnings' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/stores', label: 'Stores' },
    { to: "/admin/orders", label: "Orders" },
    { to: "/admin/payments", label: "Payments" },
  ],
};

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const links = NAV_BY_ROLE[user.role] || [];

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-1.5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 18 L9 13 L13 16 L20 8" stroke="#FF6B35" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0.5 4.5" />
            <circle cx="4" cy="18" r="2" fill="#14213D" />
            <circle cx="20" cy="8" r="2" fill="#2D9D78" />
          </svg>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">Relay</span>
        </div>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-ambersoft text-amber' : 'text-inkmuted hover:bg-paper'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">{user.name}</span>
          <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-mono uppercase tracking-wide text-inkmuted">
            {user.role}
          </span>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-inkmuted transition-colors hover:bg-paper"
          >
            Log out
          </button>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-line px-4 py-1.5 sm:hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) =>
              `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-ambersoft text-amber' : 'text-inkmuted'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
