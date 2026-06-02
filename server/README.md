# Agency API — Configuración mínima

## Archivos `.env`

| Archivo | Qué contiene |
|---------|----------------|
| `.env` (raíz) | URLs del frontend, login, proxy |
| `server/.env` | OAuth y qué integraciones mostrar |

## Arrancar

```bash
npm run dev:all
```

## Keys mínimas (enfoque práctico)

### Siempre (local)

```env
AGENCY_API_PORT=8001
FRONTEND_URL=http://localhost:5173
ENABLED_INTEGRATIONS=google,linkedin
```

### Google Calendar — **recomendado primero**

Solo 2 claves. El usuario autoriza **un permiso**: crear eventos en su calendario.

| Variable | Dónde obtenerla |
|----------|-----------------|
| `GOOGLE_CLIENT_ID` | Google Cloud → APIs → Calendar API → Credenciales OAuth |
| `GOOGLE_CLIENT_SECRET` | Misma pantalla |

Redirect URI en Google Console:

```
http://localhost:8001/api/v1/agency/integrations/google/callback/
```

Scope mínimo: `https://www.googleapis.com/auth/calendar.events`

### LinkedIn — **opcional** (1 red social)

2 claves. El usuario autoriza publicar en **su perfil** (no páginas de empresa).

| Variable | Dónde obtenerla |
|----------|-----------------|
| `LINKEDIN_CLIENT_ID` | linkedin.com/developers → tu app |
| `LINKEDIN_CLIENT_SECRET` | Misma app |

Redirect URI:

```
http://localhost:5173/integrations/callback
```

Producto: **Share on LinkedIn** · Scope: `w_member_social`

### No activar al inicio (más permisos / más fricción)

| Integración | Por qué dejarla fuera de `ENABLED_INTEGRATIONS` |
|-------------|--------------------------------------------------|
| **Meta** (IG+FB) | App Review, Page + IG Business, 3+ permisos |
| **X** | API de pago, scopes de escritura |

Cuando las necesites, añade `meta` o `x` a `ENABLED_INTEGRATIONS` y rellena sus claves.

## Resumen rápido

| Objetivo | Keys obligatorias | Permisos que ve el usuario |
|----------|-------------------|----------------------------|
| App local + demo | ninguna OAuth | Conectar en 1 clic (demo) |
| Calendario real | `GOOGLE_*` (2) | "Gestionar eventos de calendario" |
| + Publicar en LinkedIn | `LINKEDIN_*` (2) | "Publicar en tu nombre" |
| + IG/FB | `META_*` (2) + review | Varios permisos de Page/IG |
| + X | `X_*` (2) + plan API | Leer/escribir tweets |

## Producción

Actualiza redirect URIs a tu dominio real y en Vercel/Django:

```env
FRONTEND_URL=https://tu-app.vercel.app
GOOGLE_REDIRECT_URI=https://startapp360.com/api/v1/agency/integrations/google/callback/
LINKEDIN_REDIRECT_URI=https://tu-app.vercel.app/integrations/callback
```

## Nota importante

Con las claves configuradas, el OAuth **abre el flujo real**, pero para que los eventos aparezcan en Google Calendar hace falta completar el intercambio de tokens y la llamada a Calendar API en el backend (pendiente de implementación).
