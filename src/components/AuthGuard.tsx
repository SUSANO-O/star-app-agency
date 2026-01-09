import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        navigate(redirectTo, { replace: true });
      } else if (!requireAuth && isAuthenticated) {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, navigate]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-slate-900 text-xl font-bold">Verificando autenticación...</div>
      </div>
    );
  }

  // Si requiere autenticación y no está autenticado, no mostrar contenido
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-slate-900 text-xl font-bold">Redirigiendo...</div>
      </div>
    );
  }

  // Si no requiere autenticación y está autenticado, no mostrar contenido
  if (!requireAuth && isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-slate-900 text-xl font-bold">Redirigiendo...</div>
      </div>
    );
  }

  // Mostrar el contenido
  return <>{children}</>;
}

