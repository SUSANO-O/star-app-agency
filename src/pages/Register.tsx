import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../lib/useAuth';
import AuthGuard from '../components/AuthGuard';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password2: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  
  const { register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  // Validaciones en tiempo real
  const isValidEmail = formData.email.includes('@') && formData.email.includes('.') && formData.email.length > 5;
  const hasMinLength = formData.password.length >= 8;
  const hasLettersAndNumbers = /[a-zA-Z]/.test(formData.password) && /[0-9]/.test(formData.password);
  const hasSpecialChars = /[/*\-+]/.test(formData.password);
  const isValidPassword = hasMinLength && hasLettersAndNumbers && hasSpecialChars;
  const passwordsMatch = formData.password === formData.password2 && formData.password2.length > 0;
  const isValidUsername = formData.username.length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Validación final antes de enviar
    if (!isValidEmail) {
      return;
    }
    if (!isValidUsername) {
      return;
    }
    if (!isValidPassword) {
      return;
    }
    if (!passwordsMatch) {
      return;
    }

    try {
      await register(formData);
      // Redirigir al login después del registro exitoso
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <AuthGuard requireAuth={false} redirectTo="/">
      <div className="flex min-h-screen items-center justify-center bg-white py-12">
        <Card className="w-full max-w-md p-8 bg-white border-slate-200 shadow-xl rounded-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Register</h1>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                  className={`w-full bg-white border-slate-300 text-slate-900 ${
                    formData.email && !isValidEmail ? 'border-red-500' : formData.email && isValidEmail ? 'border-green-500' : ''
                  }`}
                  required
                  disabled={isLoading}
                />
                {formData.email && !isValidEmail && (
                  <p className="mt-1 text-sm text-red-500 font-medium">Please enter a valid email</p>
                )}
                {formData.email && isValidEmail && (
                  <p className="mt-1 text-sm text-green-600 font-medium">Valid email</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Username
                </label>
                <Input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Username"
                  className={`w-full bg-white border-slate-300 text-slate-900 ${
                    formData.username && !isValidUsername ? 'border-red-500' : formData.username && isValidUsername ? 'border-green-500' : ''
                  }`}
                  required
                  disabled={isLoading}
                />
                {formData.username && !isValidUsername && (
                  <p className="mt-1 text-sm text-red-500 font-medium">Username must be at least 3 characters</p>
                )}
                {formData.username && isValidUsername && (
                  <p className="mt-1 text-sm text-green-600 font-medium">Valid username</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Password"
                    className={`w-full bg-white border-slate-300 text-slate-900 pr-10 ${
                      formData.password && !isValidPassword ? 'border-red-500' : formData.password && isValidPassword ? 'border-green-500' : ''
                    }`}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <p className={`text-sm ${hasMinLength ? 'text-green-600' : 'text-red-500'} font-medium`}>
                      8-character password
                    </p>
                    <p className={`text-sm ${hasLettersAndNumbers ? 'text-green-600' : 'text-red-500'} font-medium`}>
                      Include letters and numbers
                    </p>
                    <p className={`text-sm ${hasSpecialChars ? 'text-green-600' : 'text-red-500'} font-medium`}>
                      Special characters /*-+
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword2 ? 'text' : 'password'}
                    name="password2"
                    value={formData.password2}
                    onChange={handleInputChange}
                    placeholder="Confirm Password"
                    className={`w-full bg-white border-slate-300 text-slate-900 pr-10 ${
                      formData.password2 && !passwordsMatch ? 'border-red-500' : formData.password2 && passwordsMatch ? 'border-green-500' : ''
                    }`}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword2(!showPassword2)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword2 ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {formData.password2 && (
                  <div className="mt-2 space-y-1">
                    <p className={`text-sm ${hasMinLength ? 'text-green-600' : 'text-red-500'} font-medium`}>
                      8-character password
                    </p>
                    <p className={`text-sm ${hasLettersAndNumbers ? 'text-green-600' : 'text-red-500'} font-medium`}>
                      Include letters and numbers
                    </p>
                    <p className={`text-sm ${hasSpecialChars ? 'text-green-600' : 'text-red-500'} font-medium`}>
                      Special characters /*-+
                    </p>
                    {!passwordsMatch && formData.password2.length > 0 && (
                      <p className="text-sm text-red-500 font-medium">Passwords do not match</p>
                    )}
                    {passwordsMatch && (
                      <p className="text-sm text-green-600 font-medium">Passwords match</p>
                    )}
                  </div>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base py-3 rounded-lg transition-all"
                disabled={isLoading || !isValidEmail || !isValidUsername || !isValidPassword || !passwordsMatch}
              >
                {isLoading ? 'Registering...' : 'Register'}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 flex justify-center gap-4 text-sm">
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Register
            </Link>
            <span className="text-slate-300">|</span>
            <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
              Change Password
            </Link>
          </div>
        </Card>
      </div>
    </AuthGuard>
  );
}
