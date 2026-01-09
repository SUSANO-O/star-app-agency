import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../lib/useAuth';
import AuthGuard from '../components/AuthGuard';
import { Rocket } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password2: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { register, isAuthenticated, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.username) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.password2) {
      newErrors.password2 = 'Confirma tu contraseña';
    } else if (formData.password !== formData.password2) {
      newErrors.password2 = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!validateForm()) {
      return;
    }

    try {
      await register(formData);
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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
            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">Crear Cuenta</h1>
            <p className="text-slate-500 text-sm font-semibold">Únete a Agency 360</p>
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
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="tu@email.com"
                  className={`w-full bg-slate-50 border-slate-200 text-slate-900 ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                  required
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Nombre de Usuario
                </label>
                <Input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Nombre de usuario"
                  className={`w-full bg-slate-50 border-slate-200 text-slate-900 ${
                    errors.username ? 'border-red-500' : ''
                  }`}
                  required
                  disabled={isLoading}
                />
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">{errors.username}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Contraseña
                </label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Contraseña"
                  className={`w-full bg-slate-50 border-slate-200 text-slate-900 ${
                    errors.password ? 'border-red-500' : ''
                  }`}
                  required
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">{errors.password}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Confirmar Contraseña
                </label>
                <Input
                  type="password"
                  name="password2"
                  value={formData.password2}
                  onChange={handleInputChange}
                  placeholder="Confirma tu contraseña"
                  className={`w-full bg-slate-50 border-slate-200 text-slate-900 ${
                    errors.password2 ? 'border-red-500' : ''
                  }`}
                  required
                  disabled={isLoading}
                />
                {errors.password2 && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">{errors.password2}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-slate-900 hover:bg-fuchsia-600 text-white font-black text-base py-3 rounded-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? 'Creando cuenta...' : 'Registrarse'}
              </Button>
            </div>
          </form>
          
          <div className="mt-8 space-y-4">
            <div className="text-center text-sm text-slate-500 font-semibold">
              <p>¿Ya tienes cuenta?</p>
            </div>
            <Link to="/login">
              <Button 
                variant="outline" 
                className="w-full border-fuchsia-500 text-fuchsia-600 hover:bg-fuchsia-50 font-bold"
              >
                Iniciar sesión
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </AuthGuard>
  );
}

