import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

const NAV = {
  customer: [
    { to: '/customer',        icon: '🏠', label: 'Home' },
    { to: '/customer/search', icon: '🔍', label: 'Shop' },
    { to: '/customer/cart',   icon: '🛒', label: 'Cart', cart: true },
    { to: '/chat',            icon: '💬', label: 'Chat', chat: true },
    { to: '/customer/account',icon: '👤', label: 'Account' },
  ],
  seller: [
    { to: '/seller',          icon: '🏠', label: 'Home' },
    { to: '/seller/products', icon: '📦', label: 'Products' },
    { to: '/seller/orders',   icon: '📋', label: 'Orders' },
    { to: '/chat',            icon: '💬', label: 'Chat', chat: true },
    { to: '/seller/account',  icon: '👤', label: 'Account' },
  ],
  driver: [
    { to: '/driver',          icon: '🏠', label: 'Home' },
    { to: '/driver/active',   icon: '🛵', label: 'Active' },
    { to: '/driver/earnings', icon: '💰', label: 'Earnings' },
    { to: '/chat',            icon: '💬', label: 'Chat', chat: true },
    { to: '/driver/account',  icon: '👤', label: 'Account' },
  ],
  admin: [
    { to: '/admin',           icon: '🏠', label: 'Dashboard' },
    { to: '/admin/approvals', icon: '✅', label: 'Approvals' },
    { to: '/admin/orders',    icon: '📋', label: 'Orders' },
    { to: '/chat',            icon: '💬', label: 'Chat', chat: true },
    { to: '/admin/payments',  icon: '💳', label: 'Payments' },
  ],
};

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    api.getUnreadCount().then(r => setUnread(r.unread || 0)).catch(() => {});
    const t = setInterval(() => api.getUnreadCount().then(r => setUnread(r.unread || 0)).catch(() => {}), 10000);
    return () => clearInterval(t);
  }, [user]);

  if (!user) return null;
  // Hide bottom nav inside chat room
  if (location.pathname.match(/^\/chat\/\d+/)) return null;

  const links = NAV[user.role] || [];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 card rounded-none border-x-0 border-b-0 flex items-center" style={{ height: 56, borderTop: '1px solid var(--border)' }}>
      {links.map(link => {
        const active = location.pathname === link.to || (link.to !== '/customer' && link.to !== '/seller' && link.to !== '/driver' && link.to !== '/admin' && location.pathname.startsWith(link.to));
        return (
          <NavLink key={link.to} to={link.to}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 relative"
            style={{ color: active ? 'var(--primary)' : 'var(--text3)' }}>
            <div className="relative">
              <span className="text-xl leading-none">{link.icon}</span>
              {link.chat && unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-none">{link.label}</span>
            {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-green" />}
          </NavLink>
        );
      })}
    </nav>
  );
}
