// Configuración de variables de entorno
export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://artemisacrea.ddns.net/api/v1',
    timeout: 10000, // 10 segundos
  },
  
  // Authentication
  auth: {
    tokenKey: import.meta.env.VITE_JWT_STORAGE_KEY || 'auth_token',
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
  },
  
  // App Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Start App - Agency 360',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    description: 'Aplicación de dashboard para gestión de campañas',
  },
  
  // Development
  isDevelopment: import.meta.env.DEV,
  debug: import.meta.env.VITE_DEBUG === 'true',
} as const;

// Tipos para TypeScript
export type Config = typeof config;
export type ApiConfig = typeof config.api;
export type AuthConfig = typeof config.auth;
export type AppConfig = typeof config.app;

