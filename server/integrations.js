/**
 * OAuth token exchange and real API calls for agency integrations.
 */
import { google } from 'googleapis';
import { randomUUID } from 'crypto';

const DEMO_BASE_URLS = {
  instagram: 'https://www.instagram.com/p/',
  facebook: 'https://www.facebook.com/posts/',
  linkedin: 'https://www.linkedin.com/feed/update/',
  x: 'https://x.com/i/status/',
};

export const COMING_SOON_PROVIDERS = new Set(['linkedin', 'x']);

export function getProviderConnectMode(provider, { hasLiveCredentials, isEnabled }) {
  if (!isEnabled(provider)) return 'disabled';
  if (COMING_SOON_PROVIDERS.has(provider) && !hasLiveCredentials(provider)) {
    return 'coming_soon';
  }
  if (hasLiveCredentials(provider)) return 'oauth';
  return 'demo';
}

export function buildIntegrationsConfig({ enabled, hasLiveCredentials }) {
  const configured = {};
  const providers = {};

  for (const provider of ['google', 'linkedin', 'meta', 'x']) {
    const isConfigured = hasLiveCredentials(provider);
    const connectMode = getProviderConnectMode(provider, {
      hasLiveCredentials,
      isEnabled: (p) => enabled.includes(p),
    });
    configured[provider] = isConfigured;
    providers[provider] = {
      configured: isConfigured,
      connectMode,
      enabled: enabled.includes(provider),
    };
  }

  const enabledConfigured = enabled.filter((p) => hasLiveCredentials(p));
  let environment = 'demo';
  if (enabledConfigured.length === enabled.length && enabled.length > 0) {
    environment = 'production';
  } else if (enabledConfigured.length > 0) {
    environment = 'mixed';
  }

  return { enabled, configured, providers, environment };
}

function simulatePublish(platform, integration, reason) {
  const postId = randomUUID().slice(0, 12);
  const mode = integration?.mode || 'demo';
  return {
    status: 'published',
    simulated: true,
    externalPostId: postId,
    externalUrl: `${DEMO_BASE_URLS[platform] || 'https://example.com/'}${postId}`,
    message:
      mode === 'demo'
        ? `Simulación: publicado en ${platform} (sin API real — modo demo)`
        : reason || `Simulación: publicado en ${platform} (API no disponible)`,
  };
}

export async function exchangeGoogleTokens(code, { clientId, clientSecret, redirectUri }) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'Google token exchange failed');
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || null,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : null,
  };
}

async function refreshGoogleAccessToken(integration, { clientId, clientSecret }) {
  if (!integration?.refreshToken) return integration?.accessToken || null;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: integration.refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) return null;
  integration.accessToken = data.access_token;
  if (data.expires_in) {
    integration.expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
  }
  return data.access_token;
}

export async function syncGoogleCalendarEvent(integration, event, config) {
  if (!integration?.connected) {
    return { googleEventId: null, syncStatus: 'local' };
  }

  if (integration.mode === 'demo' || integration.accessToken === 'demo-token') {
    return {
      googleEventId: `demo_gcal_${randomUUID().slice(0, 8)}`,
      syncStatus: 'demo',
      message: 'Evento guardado localmente (modo demo — no se sincroniza con Google Calendar)',
    };
  }

  if (!integration.refreshToken && !integration.accessToken) {
    return { googleEventId: null, syncStatus: 'local' };
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri,
    );
    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
    });

    if (integration.refreshToken) {
      await refreshGoogleAccessToken(integration, {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
      });
      oauth2Client.setCredentials({
        access_token: integration.accessToken,
        refresh_token: integration.refreshToken,
      });
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const result = await calendar.events.insert({
      calendarId: config.calendarId || 'primary',
      requestBody: {
        summary: event.title,
        description: event.description || '',
        start: {
          dateTime: event.startAt,
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.endAt || event.startAt,
          timeZone: 'UTC',
        },
      },
    });

    return {
      googleEventId: result.data.id,
      syncStatus: 'synced',
      message: 'Evento sincronizado con Google Calendar (API real)',
    };
  } catch (err) {
    console.error('Google Calendar sync error:', err.message);
    return {
      googleEventId: null,
      syncStatus: 'failed',
      message: `No se pudo sincronizar con Google Calendar: ${err.message}`,
    };
  }
}

export async function exchangeMetaTokens(code, config) {
  const redirectUri = `${config.redirectUri}?provider=meta`;
  const version = config.graphApiVersion;

  const tokenRes = await fetch(
    `https://graph.facebook.com/${version}/oauth/access_token?` +
      new URLSearchParams({
        client_id: config.appId,
        redirect_uri: redirectUri,
        client_secret: config.appSecret,
        code,
      }),
  );
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || tokenData.error) {
    throw new Error(tokenData.error?.message || 'Meta token exchange failed');
  }

  let accessToken = tokenData.access_token;

  const longLivedRes = await fetch(
    `https://graph.facebook.com/${version}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: config.appId,
        client_secret: config.appSecret,
        fb_exchange_token: accessToken,
      }),
  );
  const longLivedData = await longLivedRes.json();
  if (longLivedRes.ok && longLivedData.access_token) {
    accessToken = longLivedData.access_token;
  }

  const pagesRes = await fetch(
    `https://graph.facebook.com/${version}/me/accounts?` +
      new URLSearchParams({ access_token: accessToken }),
  );
  const pagesData = await pagesRes.json();
  const page = pagesData.data?.[0];

  let igBusinessId = null;
  if (page?.id && page?.access_token) {
    const igRes = await fetch(
      `https://graph.facebook.com/${version}/${page.id}?` +
        new URLSearchParams({
          fields: 'instagram_business_account',
          access_token: page.access_token,
        }),
    );
    const igData = await igRes.json();
    igBusinessId = igData.instagram_business_account?.id || null;
  }

  return {
    accessToken,
    refreshToken: null,
    accountName: page?.name || 'Meta (IG + FB)',
    pageId: page?.id || null,
    pageAccessToken: page?.access_token || null,
    pageName: page?.name || null,
    igBusinessId,
  };
}

async function publishToFacebook(copy, integration, version) {
  const res = await fetch(`https://graph.facebook.com/${version}/${integration.pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: copy,
      access_token: integration.pageAccessToken,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || 'Facebook publish failed');
  }
  return {
    status: 'published',
    simulated: false,
    externalPostId: data.id,
    externalUrl: `https://www.facebook.com/${data.id}`,
    message: 'Publicado en Facebook (API real)',
  };
}

async function publishToInstagram(copy, integration, version) {
  if (!integration.igBusinessId) {
    return {
      status: 'failed',
      simulated: true,
      error: 'No hay cuenta de Instagram Business vinculada a la Page de Facebook',
      message:
        'Instagram requiere una cuenta Business vinculada y un archivo de imagen o video',
    };
  }
  return {
    status: 'failed',
    simulated: true,
    error: 'Instagram requiere imagen o video para publicar',
    message:
      'Instagram API real requiere un asset de imagen o video — solo texto no está soportado aún',
  };
}

export async function publishToPlatform(platform, { copy, integration }, metaVersion) {
  if (!integration?.connected) {
    return {
      status: 'failed',
      error: `Conecta la integración de ${platform} primero`,
      message: `Simulación: conecta ${platform} en Integraciones para publicación real`,
    };
  }

  if (integration.mode === 'demo' || integration.accessToken === 'demo-token') {
    return simulatePublish(platform, integration);
  }

  if ((platform === 'facebook' || platform === 'instagram') && integration.pageAccessToken) {
    try {
      if (platform === 'facebook' && integration.pageId) {
        return await publishToFacebook(copy, integration, metaVersion);
      }
      if (platform === 'instagram') {
        return await publishToInstagram(copy, integration, metaVersion);
      }
    } catch (err) {
      console.error(`Meta publish error (${platform}):`, err.message);
      return {
        status: 'failed',
        error: err.message,
        message: `Error al publicar en ${platform}: ${err.message}`,
      };
    }
  }

  if (platform === 'linkedin' && integration.accessToken) {
    return simulatePublish(
      platform,
      integration,
      'LinkedIn OAuth pendiente de implementación completa — publicación simulada',
    );
  }

  if (platform === 'x') {
    return simulatePublish(
      platform,
      integration,
      'X (Twitter) próximamente — publicación simulada',
    );
  }

  return simulatePublish(
    platform,
    integration,
    `Publicación simulada en ${platform} (OAuth activo, API no configurada)`,
  );
}

export async function exchangeLinkedInTokens(code, config) {
  const redirectUri = `${config.redirectUri}?provider=linkedin`;
  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'LinkedIn token exchange failed');
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || null,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : null,
    accountName: 'LinkedIn',
  };
}
