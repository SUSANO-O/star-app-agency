import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../config/env';

// Interfaces para TypeScript
export interface User {
  id: string;
  email: string;
  username: string;
  password?: string;
  password2?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  password2: string;
}

export interface AuthResponse {
  access: string;
  refresh?: string;
  user: User;
}

// Configuración base de la API
const API_BASE_URL = config.api.baseUrl;

// Clase principal de la API
class ApiService {
  private api: AxiosInstance;
  private username: string | null = null;
  private password: string | null = null;
  private authToken: string | null = null;

  constructor() {
    const baseURL = config.api.useProxy
      ? config.api.proxyUrl
      : API_BASE_URL;

    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor: Bearer (JWT) o Basic Auth
    this.api.interceptors.request.use(
      (config) => {
        this.loadCredentials();
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        } else if (this.username && this.password) {
          const token = btoa(`${this.username}:${this.password}`);
          config.headers.Authorization = `Basic ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para manejar errores de respuesta
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearCredentials();
          // Redirigir al login si las credenciales son inválidas
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );

    // Cargar credenciales del localStorage si existen
    this.loadCredentials();
  }

  private loadCredentials(): void {
    if (typeof window !== 'undefined') {
      this.username = localStorage.getItem(config.auth.usernameKey);
      this.password = localStorage.getItem(config.auth.passwordKey);
      this.authToken = localStorage.getItem(config.auth.tokenKey);
    }
  }

  public setToken(access: string, email: string, user?: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(config.auth.tokenKey, access);
      localStorage.setItem(config.auth.usernameKey, email);
      localStorage.removeItem(config.auth.passwordKey);
      if (user) localStorage.setItem('userData', JSON.stringify(user));
    }
    this.authToken = access;
    this.username = email;
    this.password = null;
  }

  public setCredentials(username: string, password: string): void {
    this.username = username;
    this.password = password;
    this.authToken = null;
    if (typeof window !== 'undefined') {
      localStorage.setItem(config.auth.usernameKey, username);
      localStorage.setItem(config.auth.passwordKey, password);
      localStorage.removeItem(config.auth.tokenKey);
    }
  }

  public clearCredentials(): void {
    this.username = null;
    this.password = null;
    this.authToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(config.auth.usernameKey);
      localStorage.removeItem(config.auth.passwordKey);
      localStorage.removeItem(config.auth.tokenKey);
      localStorage.removeItem('userData');
    }
  }

  public getCredentials(): { username: string | null; password: string | null } {
    return { username: this.username, password: this.password };
  }

  public isAuthenticated(): boolean {
    this.loadCredentials();
    return !!(this.authToken || (this.username && this.password));
  }

  public getUserFromCredentials(): User | null {
    this.loadCredentials();
    const userData = typeof window !== 'undefined' ? localStorage.getItem('userData') : null;
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        return { id: parsed.id || '1', email: parsed.email, username: parsed.username || parsed.email };
      } catch {}
    }
    if (this.username) {
      return { id: '1', email: this.username, username: this.username };
    }
    return null;
  }

  // ENDPOINTS DE AUTENTICACIÓN

  /**
   * Login de usuario - usa microservicio login-360 cuando está configurado
   */
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const login360Url = import.meta.env?.VITE_LOGIN_360_URL || 'http://localhost:3006';
    try {
      console.log('🔐 apiService: Intentando login vía login-360...');
      const res = await fetch(`${login360Url}/api/v1/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();

      if (data.success && data.access) {
        if (data.authType === 'jwt' || data.access.startsWith('eyJ')) {
          this.setToken(data.access, credentials.email, data.user);
        } else {
          this.setCredentials(credentials.email, credentials.password);
        }
        console.log('✅ apiService: Login exitoso vía login-360');
        return {
          access: data.access,
          refresh: data.refresh || 'basic-auth-session',
          user: data.user || this.getUserFromCredentials() || {
            id: '1',
            email: credentials.email,
            username: credentials.email,
          },
        };
      }

      this.clearCredentials();
      throw this.handleError({ message: data.error }, 'Invalid credentials');
    } catch (authError) {
      console.error('❌ apiService: Error en login:', authError);
      this.clearCredentials();
      throw this.handleError(authError, 'Invalid credentials');
    }
  }

  /**
   * Registro de usuario - usa microservicio login-360 cuando está configurado
   */
  public async register(data: RegisterData): Promise<User> {
    const login360Url = import.meta.env?.VITE_LOGIN_360_URL || 'http://localhost:3006';
    try {
      const res = await fetch(`${login360Url}/api/v1/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        return { id: '1', email: data.email, username: data.username };
      }
      throw new Error(result.error || 'Registration failed');
    } catch (error) {
      throw this.handleError(error, 'Error en el registro');
    }
  }

  /**
   * Obtener perfil del usuario
   */
  public async getProfile(): Promise<User> {
    try {
      const response: AxiosResponse<User> = await this.api.get('/profile/');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to load profile');
    }
  }

  // Método para manejar errores de manera consistente
  private handleError(error: unknown, defaultMessage: string): Error {
    let message = defaultMessage;
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string; detail?: string }; status?: number } };
      
      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      } else if (axiosError.response?.data?.detail) {
        message = axiosError.response.data.detail;
      } else if (axiosError.response?.status === 400) {
        message = 'Invalid data';
      } else if (axiosError.response?.status === 401) {
        message = 'Invalid credentials';
      } else if (axiosError.response?.status === 403) {
        message = 'Access denied';
      } else if (axiosError.response?.status === 404) {
        message = 'Resource not found';
      } else if (axiosError.response?.status === 500) {
        message = 'Server error';
      }
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = (error as { message: string }).message;
    }

    const customError = new Error(message);
    (customError as Error & { status?: number; response?: unknown }).status = 
      error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { status?: number } }).response?.status 
        : undefined;
    (customError as Error & { status?: number; response?: unknown }).response = 
      error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: unknown }).response 
        : undefined;
    
    return customError;
  }

  // Método para logout
  public logout(): void {
    this.clearCredentials();
  }
}

// Instancia única del servicio
export const apiService = new ApiService();

export default apiService;

