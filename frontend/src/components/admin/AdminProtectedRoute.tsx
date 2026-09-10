import { useEffect, useState, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { checkAdminAuth } from '../../services/adminApi';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    checkAdminAuth().then((res) => {
      if (mounted) {
        setIsAuthenticated(res.authenticated);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className="empty-state-icon">🔒</span>
        <p className="empty-state-text">Verifying admin session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
