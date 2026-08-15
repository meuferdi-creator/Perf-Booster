import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getStoredAuth, getAuthToken, setStoredAuth, clearStoredAuth } from '../../lib/auth-helpers';
import { StoredAuth } from '../../types';

interface ProtectedRouteProps {
  allowedRoles: ('agent' | 'manager' | 'admin')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const initialAuth = getStoredAuth();
  const token = getAuthToken();
  const [isVerifying, setIsVerifying] = useState(Boolean(token));
  const [isValidSession, setIsValidSession] = useState(true);
  const [serverAuth, setServerAuth] = useState<StoredAuth | null>(initialAuth);

  useEffect(() => {
    let isMounted = true;
    if (!initialAuth || !token) {
      clearStoredAuth();
      setIsValidSession(false);
      setIsVerifying(false);
      return;
    }

    fetch('/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Invalid session');
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          if (data && data.valid && data.user) {
            const authoritativeUser: StoredAuth = {
              ...data.user,
              token,
            };
            setServerAuth(authoritativeUser);
            setStoredAuth(authoritativeUser);
            setIsValidSession(true);
          } else {
            clearStoredAuth();
            setIsValidSession(false);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          // Fail-Secure: server unreachable or invalid session -> disconnect
          clearStoredAuth();
          setIsValidSession(false);
        }
      })
      .finally(() => {
        if (isMounted) setIsVerifying(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Vérification de la session en cours...</p>
        </div>
      </div>
    );
  }

  const currentAuth = serverAuth || initialAuth;

  if (!currentAuth || !isValidSession) {
    return <Navigate to="/" replace />;
  }

  const userRole = currentAuth.role;
  const isAllowed =
    allowedRoles.includes(userRole) ||
    (currentAuth.isGlobalAdmin && allowedRoles.includes('manager'));

  if (!isAllowed) {
    if (userRole === 'agent') {
      return <Navigate to="/agent" replace />;
    }
    return <Navigate to="/manager" replace />;
  }

  return <Outlet />;
};
