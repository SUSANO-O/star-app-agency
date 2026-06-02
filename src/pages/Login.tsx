import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import AuthGuard from '../components/AuthGuard';
import { AppLogo } from '../components/AppLogo';
import { useFormPersist, useFormSubmit, useDebounce } from '../lib/hooks';

export default function LoginPage() {
  const emailInputRef = useRef<HTMLInputElement>(null);

  const { formData, updateField, resetForm } = useFormPersist('login', {
    email: '',
    remember: false,
  });

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuth();
  const { isSubmitting, handleSubmit } = useFormSubmit();

  const email = formData.email as string;
  const debouncedEmail = useDebounce(email, 300);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Validación de email (usar el valor actual para submit, debounced para feedback)
  const emailIsValidDebounced = debouncedEmail.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(debouncedEmail);
  const emailIsValidCurrent = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailShowError = debouncedEmail.length > 0 && !emailIsValidDebounced;
  const emailShowSuccess = emailIsValidDebounced;

  // Validación de password
  const passwordValidations = {
    length: password.length >= 8,
    lettersAndNumbers: /[a-zA-Z]/.test(password) && /[0-9]/.test(password),
    specialChars: /[/*\-+]/.test(password),
  };

  // Para submit, usar validaciones simples sin debounce
  const isFormValid = emailIsValidCurrent && password.length > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    await handleSubmit(async () => {
      console.log('🚀 Enviando credenciales de login...');
      await login({ email, password });
      console.log('✅ Login completado exitosamente');
      if (!(formData.remember as boolean)) {
        resetForm();
      }
    });
  };

  return (
    <AuthGuard requireAuth={false} redirectTo="/">
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-5 font-['Inter','Segoe_UI',Tahoma,Geneva,Verdana,sans-serif]">
        <div className="w-full max-w-[28rem]">
          <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-10 text-center">
            <div className="flex justify-center mb-6">
              <AppLogo size="lg" />
            </div>
            <h1 className="text-2xl font-semibold text-[#333] mb-8">Sign In</h1>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="relative w-full">
                <input
                  ref={emailInputRef}
                  placeholder="email@example.com"
                  className={`w-full px-4 py-3.5 border rounded-lg text-base bg-[#f8f9fa] text-[#333] placeholder-[#6c757d] focus:outline-none focus:border-[#2176ff] focus:bg-white focus:shadow-[0_0_0_3px_rgba(33,118,255,0.1)] transition-all duration-300 box-border ${
                    emailShowError ? 'border-red-400 bg-red-50' : emailShowSuccess ? 'border-green-400 bg-green-50' : 'border-[#e1e5e9]'
                  }`}
                  type="email"
                  value={email}
                  onChange={(e) => updateField('email', e.target.value)}
                  disabled={isLoading || isSubmitting}
                  required
                  autoComplete="email"
                />
                <p className={`text-sm mt-1 text-left min-h-[1.2rem] whitespace-pre-line transition-all duration-300 ${
                  emailShowSuccess ? 'text-[#28a745] animate-in fade-in slide-in-from-left-1' : emailShowError ? 'text-red-500 animate-in fade-in slide-in-from-left-1' : 'text-transparent'
                }`}>
                  {emailShowSuccess ? 'Valid email ✓' : emailShowError ? 'Invalid email format' : ''}
                </p>
              </div>

              {/* Password Input */}
              <div className="relative w-full">
                <div className="relative">
                  <input
                    placeholder="Password"
                    className="w-full px-4 py-3.5 pr-12 border border-[#e1e5e9] rounded-lg text-base bg-[#f8f9fa] text-[#333] placeholder-[#6c757d] focus:outline-none focus:border-[#2176ff] focus:bg-white focus:shadow-[0_0_0_3px_rgba(33,118,255,0.1)] transition-all duration-300 box-border"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || isSubmitting}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6c757d] hover:text-[#2176ff] transition-colors duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2176ff] focus:ring-offset-1 rounded"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {password && (
                  <div className="mt-1 text-sm">
                    <div className="text-left">
                      <div className={passwordValidations.length ? 'text-[#28a745]' : 'text-[#6c757d]'}>
                        8-character password
                      </div>
                      <div className={passwordValidations.lettersAndNumbers ? 'text-[#28a745]' : 'text-[#6c757d]'}>
                        Include letters and numbers
                      </div>
                      <div className={passwordValidations.specialChars ? 'text-[#28a745]' : 'text-[#6c757d]'}>
                        Special characters /*-+
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.remember as boolean}
                    onChange={(e) => updateField('remember', e.target.checked)}
                    className="w-4 h-4 rounded border-[#e1e5e9] text-[#2176ff] focus:ring-2 focus:ring-[#2176ff] focus:ring-offset-2 cursor-pointer"
                  />
                  <span className="text-[#6c757d] group-hover:text-[#333] transition-colors">Remember me</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isSubmitting || !isFormValid}
                className="w-full bg-[#2176ff] hover:bg-[#1a5bb8] text-white font-semibold py-3.5 px-4 text-base border-none rounded-lg cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(33,118,255,0.3)] active:translate-y-0 disabled:bg-[#6c757d] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none mt-4 relative overflow-hidden group"
              >
                {isLoading || isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-[0.9rem] text-[#6c757d]">
              <Link
                to="/register"
                className="text-[#2176ff] cursor-pointer font-medium hover:text-[#1a5bb8] hover:underline transition-colors duration-300"
              >
                Register
              </Link>
              <span className="mx-2 text-[#6c757d]">|</span>
              <Link
                to="/forgot-password"
                className="text-[#2176ff] cursor-pointer font-medium hover:text-[#1a5bb8] hover:underline transition-colors duration-300"
              >
                Change Password
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

