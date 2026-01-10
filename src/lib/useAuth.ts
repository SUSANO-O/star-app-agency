import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, User, LoginCredentials, RegisterData } from './api';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const navigate = useNavigate();

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const credentials = apiService.getCredentials();

        if (credentials.username && credentials.password) {
          // Si hay credenciales, obtener el usuario
          const userFromCredentials = apiService.getUserFromCredentials();
          setState({
            user: userFromCredentials,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Error al verificar autenticación',
        });
      }
    };

    checkAuth();
  }, []);

  // Login - LÓGICA SIMPLE Y CORRECTA
  const login = useCallback(async (credentials: LoginCredentials) => {
    console.log('🔐 useAuth: Iniciando proceso de login...', credentials);
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('🔐 useAuth: Llamando a apiService.login...');
      const response = await apiService.login(credentials);
      console.log('✅ useAuth: Login exitoso, respuesta:', response);

      // IMPORTANTE: Actualizar el estado ANTES de la redirección
      console.log('🔄 useAuth: Actualizando estado...');
      setState({
        user: response.user || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      console.log('✅ useAuth: Estado actualizado correctamente');

      // Redirigir a la página principal después del login exitoso
      navigate('/');

      return response;
    } catch (error: unknown) {
      console.error('❌ useAuth: Error en login:', error);
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : 'Error en el login';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, [navigate]);

  // Registro
  const register = useCallback(async (data: RegisterData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const user = await apiService.register(data);
      setState(prev => ({ ...prev, isLoading: false, error: null }));
      return user;
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? (error as { message: string }).message 
        : 'Error en el registro';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    apiService.logout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    navigate('/login');
  }, [navigate]);

  // Limpiar error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Actualizar usuario
  const updateUser = useCallback((userData: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null,
    }));
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    clearError,
    updateUser,
  };
};

