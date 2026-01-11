# Guía de Despliegue en Vercel

Esta guía te ayudará a desplegar correctamente la aplicación Star App Agency en Vercel.

## 🚀 Configuración de Vercel

### 1. Conectar el Repositorio

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en "Add New Project"
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente que es un proyecto Vite

### 2. Configuración del Proyecto

La configuración básica ya está incluida en el archivo `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

### 3. Variables de Entorno

**IMPORTANTE:** Debes configurar las siguientes variables de entorno en Vercel:

1. Ve a tu proyecto en Vercel
2. Navega a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

#### Variables Requeridas:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `VITE_API_BASE_URL` | `https://startapp360.com/api/v1` | URL de la API |
| `VITE_USE_PROXY` | `false` | Desactiva el proxy en producción |
| `VITE_JWT_STORAGE_KEY` | `auth_token` | Clave para token en localStorage |
| `VITE_USERNAME_STORAGE_KEY` | `auth_username` | Clave para username en localStorage |
| `VITE_PASSWORD_STORAGE_KEY` | `auth_password` | Clave para password en localStorage |
| `VITE_APP_NAME` | `Start App - Agency 360` | Nombre de la aplicación |
| `VITE_APP_VERSION` | `1.0.0` | Versión de la aplicación |

#### Variables Opcionales:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `VITE_DEBUG` | `false` | Modo debug (usar `true` solo en development) |

### 4. Configuración CORS

La aplicación hace peticiones directas a `https://startapp360.com/api/v1` en producción.

**IMPORTANTE:** Asegúrate de que el backend tiene configurado CORS para permitir requests desde tu dominio de Vercel.

Si tienes problemas de CORS, contacta al equipo de backend para agregar tu dominio a la lista de orígenes permitidos:

```
https://tu-proyecto.vercel.app
```

### 5. Despliegue

1. Después de configurar las variables de entorno, haz clic en "Deploy"
2. Vercel construirá y desplegará tu aplicación automáticamente
3. Cada push a la rama principal (`main`) desplegará automáticamente

## 🔧 Configuraciones Especiales

### SPA Routing

El archivo `vercel.json` ya incluye la configuración necesaria para que todas las rutas se redirijan a `index.html`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Esto permite que React Router funcione correctamente en producción.

### Headers de Seguridad

El proyecto incluye headers de seguridad recomendados:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- Cache optimizado para assets estáticos

## 🐛 Solución de Problemas

### Problema: "401 Unauthorized" al hacer login

**Causa:** Las credenciales de Basic Auth no están funcionando.

**Solución:**
- Verifica que la API de backend esté accesible desde Vercel
- Confirma que el backend acepta Basic Auth
- Revisa los logs de Vercel para más detalles

### Problema: Rutas no funcionan (404 en refresh)

**Causa:** El archivo `vercel.json` no está configurado correctamente.

**Solución:**
- Asegúrate de que el archivo `vercel.json` existe en la raíz del proyecto
- Verifica que tiene la configuración de `rewrites` correcta

### Problema: "CORS Error"

**Causa:** El backend no permite requests desde el dominio de Vercel.

**Solución:**
- Contacta al equipo de backend para agregar tu dominio a la lista de CORS
- Dominio a agregar: `https://tu-proyecto.vercel.app`

### Problema: Variables de entorno no funcionan

**Causa:** Las variables de entorno no están configuradas en Vercel o no tienen el prefijo `VITE_`.

**Solución:**
- Todas las variables de entorno en Vite DEBEN empezar con `VITE_`
- Redeploy después de agregar variables de entorno
- Verifica que las variables estén en la sección correcta (Production, Preview, Development)

## 📝 Notas Adicionales

### Desarrollo Local vs Producción

| Aspecto | Desarrollo Local | Producción (Vercel) |
|---------|------------------|---------------------|
| API Proxy | Usa Vite proxy (`/api/proxy`) | No usa proxy |
| API URL | Via proxy o directa | Directa a `https://startapp360.com/api/v1` |
| `VITE_USE_PROXY` | `true` (opcional) | `false` (requerido) |
| CORS | Evitado por el proxy | Manejado por backend |

### Verificar el Build Localmente

Antes de desplegar, puedes verificar que el build funciona correctamente:

```bash
# Instalar dependencias
npm install

# Crear build de producción
npm run build

# Previsualizar el build
npm run preview
```

## 📞 Soporte

Si encuentras problemas adicionales:

1. Revisa los logs de Vercel en el dashboard
2. Verifica la configuración de variables de entorno
3. Asegúrate de que el backend está accesible y tiene CORS configurado
4. Revisa la consola del navegador para errores específicos

## ✅ Checklist de Despliegue

Antes de desplegar, asegúrate de:

- [ ] Variables de entorno configuradas en Vercel
- [ ] `VITE_USE_PROXY` está en `false`
- [ ] Backend tiene CORS configurado para tu dominio
- [ ] `vercel.json` está en la raíz del proyecto
- [ ] Build local funciona correctamente (`npm run build`)
- [ ] Todas las dependencias están en `package.json`

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando correctamente en Vercel. Si todo está configurado correctamente, podrás acceder a ella desde tu URL de Vercel.
