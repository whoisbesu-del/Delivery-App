import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_BY_ROLE = {
  customer: [
    { to:'/customer', label:'Shop' },
    { to:'/customer/orders', label:'My Orders' },
  ],
  seller: [
    { to:'/seller', label:'Dashboard' },
    { to:'/seller/products', label:'Products' },
    { to:'/seller/orders', label:'Orders' },
  ],
  driver: [
    { to:'/driver', label:'Available' },
    { to:'/driver/active', label:'Active' },
    { to:'/driver/earnings', label:'Earnings' },
  ],
  admin: [
    { to:'/admin', label:'Dashboard' },
    { to:'/admin/approvals', label:'Approvals' },
    { to:'/admin/orders', label:'Orders' },
    { to:'/admin/payments', label:'Payments' },
  ],
};

const ROLE_PILL = {
  customer:'bg-amber/10 text-amber border-amber/20',
  seller:  'bg-teal/10 text-teal border-teal/20',
  driver:  'bg-blue-400/10 text-blue-400 border-blue-400/20',
  admin:   'bg-purple-400/10 text-purple-400 border-purple-400/20',
};

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const links = NAV_BY_ROLE[user.role] || [];

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber/20 bg-amber/10">
            <span className="font-display text-sm font-bold text-amber">S</span>
          </div>
          <span className="font-display text-[15px] font-bold text-ink">South <span className="text-amber">Shopping</span></span>
        </div>
        <nav className="hidden items-center gap-1 sm:flex">
          {links.map(link => (
            <NavLink key={link.to} to={link.to} end
              className={({isActive})=>`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${isActive?'bg-amber/10 text-amber border border-amber/20':'text-inkmuted hover:bg-elevated hover:text-ink'}`}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className={`hidden rounded-full border px-2.5 py-1 text-xs font-mono uppercase tracking-wide sm:inline ${ROLE_PILL[user.role]||''}`}>{user.role}</span>
          <button onClick={()=>{logout();navigate('/login');}}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-inkmuted transition-all hover:border-amber/30 hover:text-ink active:scale-95">
            Log out
          </button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-line px-4 py-1.5 scrollbar-none sm:hidden">
        {links.map(link => (
          <NavLink key={link.to} to={link.to} end
            className={({isActive})=>`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${isActive?'bg-amber/10 text-amber':'text-inkmuted'}`}>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
