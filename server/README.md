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
ENABLED_INTEGRATIONS=google,meta,linkedin,x
```

### Google Calendar — **recomendado primero**

Solo 2 claves. El usuario autoriza **un permiso**: crear eventos en su calendario.

| Variable | Dónde obtenerla |
|----------|-----------------|
| `GOOGLE_CLIENT_ID` | Google Cloud → APIs → Calendar API → Credenciales OAuth |
| `GOOGLE_CLIENT_SECRET` | Misma pantalla |
| `GOOGLE_CALENDAR_ID` | Opcional, default `primary` |

Redirect URI en Google Console (debe coincidir **exacto** con `GOOGLE_REDIRECT_URI`):

```
http://localhost:5173/integrations/callback
```

En **Google Cloud** → APIs y servicios → Credenciales → tu cliente OAuth → **URIs de redirección autorizados** → agregar la línea de arriba → Guardar.

Scope mínimo: `https://www.googleapis.com/auth/calendar.events`

### Meta (Instagram + Facebook) — **OAuth real**

| Variable | Dónde obtenerla |
|----------|-----------------|
| `META_APP_ID` | developers.facebook.com → tu app |
| `META_APP_SECRET` | Misma app |
| `META_GRAPH_API_VERSION` | Opcional, default `21.0` |

Redirect URI en Meta Developer:

```
http://localhost:5173/integrations/callback
```

Permisos: `pages_manage_posts`, `instagram_content_publish`, `pages_show_list`

### LinkedIn / X — **próximamente** (sin keys)

Aparecen en la UI con badge "Coming soon" y botón deshabilitado.
Cuando tengas keys, rellena `LINKEDIN_*` o `X_*` y el modo pasa a OAuth real.

## Resumen rápido

| Objetivo | Keys obligatorias | Permisos que ve el usuario |
|----------|-------------------|----------------------------|
| App local + demo | ninguna OAuth en google | Conectar en 1 clic (demo) |
| Calendario real | `GOOGLE_*` (2) + Calendar API | Eventos en Google Calendar |
| Publicar en Facebook | `META_*` (2) + Page | Post real vía Graph API |
| Instagram | `META_*` + IG Business | Requiere imagen/video (texto solo no soportado) |
| LinkedIn / X sin keys | — | "Coming soon" en UI |
| + LinkedIn / X con keys | `LINKEDIN_*` / `X_*` | OAuth real |

## Producción

Actualiza redirect URIs a tu dominio real y en Vercel/Django:

```env
FRONTEND_URL=https://tu-app.vercel.app
GOOGLE_REDIRECT_URI=https://tu-app.vercel.app/integrations/callback
LINKEDIN_REDIRECT_URI=https://tu-app.vercel.app/integrations/callback
```

## Modos de integración

| Modo | Cuándo | Qué hace |
|------|--------|----------|
| **demo** | Proveedor habilitado sin keys OAuth (solo google) | Conexión simulada, sin API real |
| **oauth** | Keys configuradas en `server/.env` | Autorización real + tokens + API |
| **coming soon** | LinkedIn/X sin keys | Visible en UI, botón deshabilitado |

El contrato demo (`/demo/contrato`) es independiente de las integraciones.

## Nota importante

Con `GOOGLE_*` y `META_*` configurados, el backend intercambia tokens OAuth y llama a Google Calendar API y Meta Graph API (Facebook feed). Instagram requiere asset de imagen o video.
