import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../lib/useAuth';
import AuthGuard from '../components/AuthGuard';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useFormPersist, useFormSubmit, useDebounce } from '../lib/hooks';

export default function RegisterPage() {
  const emailInputRef = useRef<HTMLInputElement>(null);

  const { formData, updateField, resetForm } = useFormPersist('register', {
    email: '',
    username: '',
    password: '',
    password2: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    username: false,
    password: false,
    password2: false,
  });

  const { register, isLoading, error, clearError } = useAuth();
  const { isSubmitting, handleSubmit } = useFormSubmit();
  const navigate = useNavigate();

  const debouncedEmail = useDebounce(formData.email as string, 400);
  const debouncedUsername = useDebounce(formData.username as string, 400);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Validaciones en tiempo real con debounced values
  const email = formData.email as string;
  const username = formData.username as string;
  const password = formData.password as string;
  const password2 = formData.password2 as string;

  // Validaciones para feedback visual (con debounce)
  const isValidEmailDebounced = debouncedEmail.includes('@') && debouncedEmail.includes('.') && debouncedEmail.length > 5;
  const isValidUsernameDebounced = debouncedUsername.length >= 3;

  // Validaciones para submit (sin debounce)
  const isValidEmail = email.includes('@') && email.includes('.') && email.length > 5;
  const isValidUsername = username.length >= 3;

  const hasMinLength = password.length >= 8;
  const hasLettersAndNumbers = /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  const hasSpecialChars = /[/*\-+]/.test(password);
  const isValidPassword = hasMinLength && hasLettersAndNumbers && hasSpecialChars;
  const passwordsMatch = password === password2 && password2.length > 0;

  const isFormValid = isValidEmail && isValidUsername && isValidPassword && passwordsMatch;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Marcar todos los campos como touched
    setTouched({
      email: true,
      username: true,
      password: true,
      password2: true,
    });

    if (!isFormValid) return;

    await handleSubmit(async () => {
      await register({
        email,
        username,
        password,
        password2,
      });
      resetForm();
      navigate('/login');
    });
  };

  const handleInputChange = (field: string, value: string) => {
    updateField(field, value);
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  return (
    <AuthGuard requireAuth={false} redirectTo="/">
      <div className="flex min-h-screen items-center justify-center bg-white py-12">
        <Card className="w-full max-w-md p-8 bg-white border-slate-200 shadow-xl rounded-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Register</h1>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold animate-in fade-in slide-in-from-top-2 duration-300">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    ref={emailInputRef}
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                    placeholder="email@example.com"
                    className={`w-full bg-white border-slate-300 text-slate-900 pr-10 transition-all duration-300 ${
                      touched.email && !isValidEmailDebounced ? 'border-red-500 bg-red-50' : touched.email && isValidEmailDebounced ? 'border-green-500 bg-green-50' : ''
                    }`}
                    required
                    disabled={isLoading || isSubmitting}
                    autoComplete="email"
                  />
                  {touched.email && isValidEmailDebounced && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 animate-in zoom-in duration-200" size={20} />
                  )}
                </div>
                {touched.email && !isValidEmailDebounced && email.length > 0 && (
                  <p className="mt-1 text-sm text-red-500 font-medium animate-in fade-in slide-in-from-left-1 duration-200">Please enter a valid email</p>
                )}
                {touched.email && isValidEmailDebounced && (
                  <p className="mt-1 text-sm text-green-600 font-medium animate-in fade-in slide-in-from-left-1 duration-200">Valid email ✓</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="username">
                  Username
                </label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    name="username"
                    value={username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, username: true }))}
                    placeholder="Username"
                    className={`w-full bg-white border-slate-300 text-slate-900 pr-10 transition-all duration-300 ${
                      touched.username && !isValidUsernameDebounced ? 'border-red-500 bg-red-50' : touched.username && isValidUsernameDebounced ? 'border-green-500 bg-green-50' : ''
                    }`}
                    required
                    disabled={isLoading || isSubmitting}
                    autoComplete="username"
                  />
                  {touched.username && isValidUsernameDebounced && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 animate-in zoom-in duration-200" size={20} />
                  )}
                </div>
                {touched.username && !isValidUsernameDebounced && username.length > 0 && (
                  <p className="mt-1 text-sm text-red-500 font-medium animate-in fade-in slide-in-from-left-1 duration-200">Username must be at least 3 characters</p>
                )}
                {touched.username && isValidUsernameDebounced && (
                  <p className="mt-1 text-sm text-green-600 font-medium animate-in fade-in slide-in-from-left-1 duration-200">Valid username ✓</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                    placeholder="Password"
                    className={`w-full bg-white border-slate-300 text-slate-900 pr-10 transition-all duration-300 ${
                      touched.password && !isValidPassword ? 'border-red-500 bg-red-50' : touched.password && isValidPassword ? 'border-green-500 bg-green-50' : ''
                    }`}
                    required
                    disabled={isLoading || isSubmitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className={`text-sm font-medium transition-colors duration-200 ${hasMinLength ? 'text-green-600' : 'text-slate-400'}`}>
                      {hasMinLength && '✓ '}8-character password
                    </p>
                    <p className={`text-sm font-medium transition-colors duration-200 ${hasLettersAndNumbers ? 'text-green-600' : 'text-slate-400'}`}>
                      {hasLettersAndNumbers && '✓ '}Include letters and numbers
                    </p>
                    <p className={`text-sm font-medium transition-colors duration-200 ${hasSpecialChars ? 'text-green-600' : 'text-slate-400'}`}>
                      {hasSpecialChars && '✓ '}Special characters /*-+
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="password2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="password2"
                    type={showPassword2 ? 'text' : 'password'}
                    name="password2"
                    value={password2}
                    onChange={(e) => handleInputChange('password2', e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, password2: true }))}
                    placeholder="Confirm Password"
                    className={`w-full bg-white border-slate-300 text-slate-900 pr-10 transition-all duration-300 ${
                      touched.password2 && !passwordsMatch && password2.length > 0 ? 'border-red-500 bg-red-50' : touched.password2 && passwordsMatch ? 'border-green-500 bg-green-50' : ''
                    }`}
                    required
                    disabled={isLoading || isSubmitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword2(!showPassword2)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded transition-colors"
                    aria-label={showPassword2 ? 'Hide password' : 'Show password'}
                  >
                    {showPassword2 ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {password2.length > 0 && (
                  <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {!passwordsMatch && (
                      <p className="text-sm text-red-500 font-medium">Passwords do not match</p>
                    )}
                    {passwordsMatch && (
                      <p className="text-sm text-green-600 font-medium">✓ Passwords match</p>
                    )}
                  </div>
                )}
              </div>
              
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base py-3 rounded-lg transition-all relative overflow-hidden group disabled:opacity-50"
                disabled={isLoading || isSubmitting || !isFormValid}
              >
                {isLoading || isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </span>
                ) : 'Register'}
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
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
