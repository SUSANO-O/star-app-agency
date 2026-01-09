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
  private token: string | null = null;

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

    // Interceptor para agregar token a todas las peticiones
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
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
          this.clearToken();
          // Redirigir al login si el token expiró
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );

    // Cargar token del localStorage si existe
    this.loadToken();
  }

  // Métodos para manejar el token
  private loadToken(): void {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(config.auth.tokenKey);
    }
  }

  public setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(config.auth.tokenKey, token);
    }
  }

  public clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(config.auth.tokenKey);
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public isAuthenticated(): boolean {
    return !!this.token;
  }

  // ENDPOINTS DE AUTENTICACIÓN

  /**
   * Login de usuario
   */
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/token/', credentials);
      this.setToken(response.data.access);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error en el login');
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
    this.clearToken();
  }
}

// Instancia única del servicio
export const apiService = new ApiService();

export default apiService;

