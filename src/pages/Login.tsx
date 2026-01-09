import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../lib/useAuth';
import AuthGuard from '../components/AuthGuard';
import { Rocket } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      await login({ email, password });
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <AuthGuard requireAuth={false} redirectTo="/">
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <Card className="w-full max-w-md p-8 bg-white border-slate-200 shadow-xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-tr from-[#FF007A] via-[#FF5C00] to-[#FFD600] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Rocket className="text-white" size={32} />
              </div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">Iniciar Sesión</h1>
            <p className="text-slate-500 text-sm font-semibold">Accede a tu cuenta de Agency 360</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full bg-slate-50 border-slate-200 text-slate-900"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Contraseña
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  className="w-full bg-slate-50 border-slate-200 text-slate-900"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-slate-900 hover:bg-fuchsia-600 text-white font-black text-base py-3 rounded-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </div>
          </form>
          
          <div className="mt-8 space-y-4">
            <div className="text-center text-sm text-slate-500 font-semibold">
              <p>¿No tienes cuenta?</p>
            </div>
            <Link to="/register">
              <Button 
                variant="outline" 
                className="w-full border-fuchsia-500 text-fuchsia-600 hover:bg-fuchsia-50 font-bold"
              >
                Crear cuenta nueva
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </AuthGuard>
  );
}

