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
    console.log(`🔍 AuthGuard: isLoading=${isLoading}, isAuthenticated=${isAuthenticated}, requireAuth=${requireAuth}`);
    
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        console.log(`🚫 Acceso denegado, redirigiendo a ${redirectTo}`);
        navigate(redirectTo, { replace: true });
      } else if (!requireAuth && isAuthenticated) {
        console.log(`✅ Usuario autenticado, redirigiendo a /`);
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, navigate]);

  // Spinner component
  const LoadingSpinner = () => (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
        <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div className="text-slate-900 text-lg font-semibold">Verifying authentication...</div>
        <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '70%' }}></div>
        </div>
      </div>
    </div>
  );

  const RedirectingSpinner = ({ message }: { message: string }) => (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
        <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div className="text-slate-700 text-base font-medium">{message}</div>
      </div>
    </div>
  );

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Si requiere autenticación y no está autenticado, no mostrar contenido
  if (requireAuth && !isAuthenticated) {
    return <RedirectingSpinner message="Redirecting to login..." />;
  }

  // Si no requiere autenticación y está autenticado, no mostrar contenido
  if (!requireAuth && isAuthenticated) {
    return <RedirectingSpinner message="Redirecting to dashboard..." />;
  }

  // Mostrar el contenido
  return <>{children}</>;
}

