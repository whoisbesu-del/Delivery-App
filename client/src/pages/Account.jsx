import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Account() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  function handleLogout() { logout(); navigate('/login'); }

  const ROLE_LINKS = {
    customer: [
      { label: 'My Orders', icon: '📦', to: '/customer/orders' },
      { label: 'Browse Stores', icon: '🏪', to: '/customer' },
    ],
    seller: [
      { label: 'My Store', icon: '🏪', to: '/seller/store' },
      { label: 'Products', icon: '📦', to: '/seller/products' },
      { label: 'Orders', icon: '📋', to: '/seller/orders' },
    ],
    driver: [
      { label: 'Earnings', icon: '💰', to: '/driver/earnings' },
      { label: 'Active Delivery', icon: '🛵', to: '/driver/active' },
    ],
    admin: [
      { label: 'Dashboard', icon: '📊', to: '/admin' },
      { label: 'Approvals', icon: '✅', to: '/admin/approvals' },
      { label: 'All Orders', icon: '📋', to: '/admin/orders' },
      { label: 'Payment Settings', icon: '💳', to: '/admin/payments' },
    ],
  };

  const links = ROLE_LINKS[user?.role] || [];

  return (
    <div className="bg-base min-h-screen pb-nav">
      {/* Header */}
      <div className="card rounded-none border-x-0 border-t-0 px-4 py-3">
        <p className="font-bold text-base text-lg" style={{ fontFamily: 'Space Grotesk' }}>Account</p>
      </div>

      {/* Profile card */}
      <div className="m-3 card rounded-2xl p-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-t flex items-center justify-center text-3xl">
          {({ customer:'🛍️', seller:'🏪', driver:'🛵', admin:'⚙️' })[user?.role] || '👤'}
        </div>
        <div>
          <p className="font-bold text-base text-lg">{user?.name}</p>
          <p className="text-muted text-sm">{user?.email}</p>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize text-green bg-green-t">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Quick links */}
      <div className="mx-3 card rounded-2xl overflow-hidden">
        {links.map((link, i) => (
          <button key={link.to} onClick={() => navigate(link.to)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:bg-muted active:bg-muted"
            style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
            <span className="text-xl w-8 text-center">{link.icon}</span>
            <span className="flex-1 font-medium text-base text-sm">{link.label}</span>
            <span className="text-dim">›</span>
          </button>
        ))}
      </div>

      {/* Settings */}
      <div className="mx-3 mt-3 card rounded-2xl overflow-hidden">
        <button onClick={toggle}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:bg-muted active:bg-muted">
          <span className="text-xl w-8 text-center">{dark ? '☀️' : '🌙'}</span>
          <span className="flex-1 font-medium text-base text-sm">{dark ? 'Light Mode' : 'Dark Mode'}</span>
          <div className="w-10 h-6 rounded-full relative transition-all" style={{ background: dark ? 'var(--primary)' : 'var(--border)' }}>
            <div className="w-4 h-4 rounded-full bg-white absolute top-1 transition-all" style={{ left: dark ? '22px' : '2px' }} />
          </div>
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:bg-muted active:bg-muted"
          style={{ borderTop: '1px solid var(--border)' }}>
          <span className="text-xl w-8 text-center">🚪</span>
          <span className="flex-1 font-medium text-sm" style={{ color: 'var(--red)' }}>Log out</span>
        </button>
      </div>
    </div>
  );
}
