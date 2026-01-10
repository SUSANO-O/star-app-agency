// Configuración de variables de entorno
export const config = {
  // API Configuration - Star360 API
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://startapp360.com/api/v1',
    proxyUrl: import.meta.env.VITE_API_PROXY_URL || '/api/proxy',
    timeout: 10000, // 10 segundos
    // En logoAI: useProxy solo es true en producción (usa rutas Next.js)
    // En Vite: en desarrollo, usar proxy solo si VITE_USE_PROXY=true (para evitar CORS)
    // En producción, usar API directa (asumiendo CORS configurado) o configurar proxy en servidor
    useProxy: import.meta.env.VITE_USE_PROXY === 'true',
  },
  
  // Authentication
  auth: {
    tokenKey: import.meta.env.VITE_JWT_STORAGE_KEY || 'auth_token',
    usernameKey: import.meta.env.VITE_USERNAME_STORAGE_KEY || 'auth_username',
    passwordKey: import.meta.env.VITE_PASSWORD_STORAGE_KEY || 'auth_password',
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

