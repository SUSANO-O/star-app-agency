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

  constructor() {
    // Usar proxy en producción para evitar CORS (igual que logoAI)
    // En desarrollo, el proxy de Vite redirige /api/proxy/* a la API real
    const baseURL = config.api.useProxy
      ? config.api.proxyUrl
      : API_BASE_URL;

    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar Basic Auth a todas las peticiones
    this.api.interceptors.request.use(
      (config) => {
        if (this.username && this.password) {
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

  // Métodos para manejar las credenciales
  private loadCredentials(): void {
    if (typeof window !== 'undefined') {
      this.username = localStorage.getItem(config.auth.usernameKey);
      this.password = localStorage.getItem(config.auth.passwordKey);
    }
  }

  public setCredentials(username: string, password: string): void {
    console.log('🔐 apiService: Guardando credenciales en localStorage');
    this.username = username;
    this.password = password;
    if (typeof window !== 'undefined') {
      localStorage.setItem(config.auth.usernameKey, username);
      localStorage.setItem(config.auth.passwordKey, password);
    }
  }

  public clearCredentials(): void {
    this.username = null;
    this.password = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(config.auth.usernameKey);
      localStorage.removeItem(config.auth.passwordKey);
      localStorage.removeItem(config.auth.tokenKey);
    }
  }

  public getCredentials(): { username: string | null; password: string | null } {
    return { username: this.username, password: this.password };
  }

  public isAuthenticated(): boolean {
    return !!(this.username && this.password);
  }

  public getUserFromCredentials(): User | null {
    if (this.username) {
      return {
        id: '1',
        email: this.username,
        username: this.username,
      };
    }
    return null;
  }

  // ENDPOINTS DE AUTENTICACIÓN

  /**
   * Login de usuario con Basic Auth
   */
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('🔐 apiService: Intentando login con Basic Auth...');

    // Guardar credenciales
    this.setCredentials(credentials.email, credentials.password);

    // Validar credenciales haciendo una petición de prueba
    try {
      console.log('🔐 apiService: Validando credenciales...');
      await this.api.get('?path=user/');
      console.log('✅ apiService: Login exitoso, credenciales válidas');

      // Retornar respuesta compatible con la interfaz
      const mockResponse: AuthResponse = {
        access: 'basic-auth-session',
        refresh: 'basic-auth-session',
        user: this.getUserFromCredentials() || {
          id: '1',
          email: credentials.email,
          username: credentials.email,
        },
      };

      return mockResponse;
    } catch (authError) {
      console.error('❌ apiService: Credenciales inválidas:', authError);
      this.clearCredentials();
      throw this.handleError(authError, 'Credenciales inválidas');
    }
  }

  /**
   * Registro de usuario
   */
  public async register(data: RegisterData): Promise<User> {
    try {
      const response: AxiosResponse<User> = await this.api.post('/register/', data);
      return response.data;
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
      throw this.handleError(error, 'Error al obtener perfil');
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
        message = 'Datos inválidos';
      } else if (axiosError.response?.status === 401) {
        message = 'Credenciales inválidas';
      } else if (axiosError.response?.status === 403) {
        message = 'Acceso prohibido';
      } else if (axiosError.response?.status === 404) {
        message = 'Recurso no encontrado';
      } else if (axiosError.response?.status === 500) {
        message = 'Error del servidor';
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

