import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getStoredAuth } from '../../lib/auth-helpers';

interface ProtectedRouteProps {
  allowedRoles: ('agent' | 'manager' | 'admin')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const auth = getStoredAuth();

  if (!auth) {
    return <Navigate to="/" replace />;
  }

  const userRole = auth.role;
  const isAllowed =
    allowedRoles.includes(userRole) ||
    (auth.isGlobalAdmin && allowedRoles.includes('manager'));

  if (!isAllowed) {
    if (userRole === 'agent') {
      return <Navigate to="/agent" replace />;
    }
    return <Navigate to="/manager" replace />;
  }

  return <Outlet />;
};
