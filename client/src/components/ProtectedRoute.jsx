import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ role, children }) {
  const { user, loading, requiresVerification } = useAuth();

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-base">
      <div className="w-8 h-8 rounded-full border-2 border-green spin" style={{ borderTopColor:'transparent' }} />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (requiresVerification) return <Navigate to="/verify-email" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return children;
}
