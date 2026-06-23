import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BackButton({ to, label = 'Back' }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => to ? navigate(to) : navigate(-1)}
      className="flex items-center gap-1.5 text-sm font-medium transition-all active:scale-95"
      style={{ color: 'var(--text2)' }}
    >
      <span style={{ fontSize: 18, lineHeight: 1 }}>‹</span>
      {label}
    </button>
  );
}
