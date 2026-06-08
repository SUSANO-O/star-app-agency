/**
 * OAuth token exchange and real API calls for agency integrations.
 * Demo/simulation ONLY for LinkedIn and X.
 */
import { google } from 'googleapis';
import { randomUUID } from 'crypto';

const DEMO_BASE_URLS = {
  instagram: 'https://www.instagram.com/p/',
  facebook: 'https://www.facebook.com/posts/',
  linkedin: 'https://www.linkedin.com/feed/update/',
  x: 'https://x.com/i/status/',
};

/** Only these providers may use demo/simulated connect & publish */
export const DEMO_ONLY_PROVIDERS = new Set(['linkedin', 'x']);

export function getProviderConnectMode(provider, { hasLiveCredentials, isEnabled }) {
  if (!isEnabled(provider)) return 'disabled';

  if (DEMO_ONLY_PROVIDERS.has(provider)) {
    return hasLiveCredentials(provider) ? 'oauth' : 'demo';
  }

  // Google & Meta: OAuth real only — no demo
  return hasLiveCredentials(provider) ? 'oauth' : 'unconfigured';
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
      demoAllowed: DEMO_ONLY_PROVIDERS.has(provider),
    };
  }

  const liveProviders = ['google', 'meta'].filter(
    (p) => enabled.includes(p) && hasLiveCredentials(p),
  );
  const demoProviders = ['linkedin', 'x'].filter((p) => enabled.includes(p));

  let environment = 'mixed';
  if (liveProviders.length >= 1 && demoProviders.every((p) => !hasLiveCredentials(p))) {
    environment = 'production';
  }

  return {
    enabled,
    configured,
    providers,
    environment,
    cloudinary: Boolean(
      process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_UPLOAD_PRESET,
    ),
    huggingface: Boolean(process.env.HUGGINGFACE_API_TOKEN || process.env.HF_API_TOKEN),
  };
}

function simulatePublish(platform, integration, reason) {
  const postId = randomUUID().slice(0, 12);
  return {
    status: 'published',
    simulated: true,
    externalPostId: postId,
    externalUrl: `${DEMO_BASE_URLS[platform] || 'https://example.com/'}${postId}`,
    message: reason || `Simulación: publicado en ${platform} (demo — LinkedIn/X pendiente de API completa)`,
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
    return {
      googleEventId: null,
      syncStatus: 'local',
      message: 'Conecta Google Calendar en Integraciones',
    };
  }

  if (integration.mode === 'demo' || integration.accessToken === 'demo-token') {
    return {
      googleEventId: null,
      syncStatus: 'failed',
      message: 'Google Calendar requiere conexión OAuth real — reconecta en Integraciones',
    };
  }

  if (!integration.refreshToken && !integration.accessToken) {
    return { googleEventId: null, syncStatus: 'failed', message: 'Token de Google no disponible' };
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
        start: { dateTime: event.startAt, timeZone: 'UTC' },
        end: { dateTime: event.endAt || event.startAt, timeZone: 'UTC' },
      },
    });

    return {
      googleEventId: result.data.id,
      syncStatus: 'synced',
      message: 'Sincronizado con Google Calendar',
    };
  } catch (err) {
    console.error('Google Calendar sync error:', err.message);
    return {
      googleEventId: null,
      syncStatus: 'failed',
      message: `Error Google Calendar: ${err.message}`,
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

async function publishToFacebook(copy, integration, version, mediaUrl) {
  const token = integration.pageAccessToken;
  const pageId = integration.pageId;

  if (mediaUrl) {
    const res = await fetch(`https://graph.facebook.com/${version}/${pageId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: mediaUrl,
        caption: copy,
        access_token: token,
      }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error?.message || 'Facebook photo publish failed');
    }
    return {
      status: 'published',
      simulated: false,
      externalPostId: data.id || data.post_id,
      externalUrl: `https://www.facebook.com/${data.id || pageId}`,
      message: 'Publicado en Facebook con imagen (API real)',
    };
  }

  const res = await fetch(`https://graph.facebook.com/${version}/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: copy, access_token: token }),
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

async function publishToInstagram(copy, integration, version, mediaUrl, mediaType) {
  if (!integration.igBusinessId) {
    return {
      status: 'failed',
      error: 'No hay cuenta Instagram Business vinculada a tu Facebook Page',
      message: 'Vincula IG Business a tu Page en Meta Business Suite',
    };
  }

  if (!mediaUrl) {
    return {
      status: 'failed',
      error: 'Instagram requiere imagen o video',
      message: 'Sube un asset en Asset Studio (Cloudinary) antes de publicar en Instagram',
    };
  }

  const isVideo = mediaType === 'video';
  const containerBody = {
    caption: copy,
    access_token: integration.pageAccessToken,
    ...(isVideo ? { media_type: 'REELS', video_url: mediaUrl } : { image_url: mediaUrl }),
  };

  const createRes = await fetch(
    `https://graph.facebook.com/${version}/${integration.igBusinessId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containerBody),
    },
  );
  const createData = await createRes.json();
  if (!createRes.ok || createData.error) {
    throw new Error(createData.error?.message || 'Instagram media container failed');
  }

  const publishRes = await fetch(
    `https://graph.facebook.com/${version}/${integration.igBusinessId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: createData.id,
        access_token: integration.pageAccessToken,
      }),
    },
  );
  const publishData = await publishRes.json();
  if (!publishRes.ok || publishData.error) {
    throw new Error(publishData.error?.message || 'Instagram publish failed');
  }

  return {
    status: 'published',
    simulated: false,
    externalPostId: publishData.id,
    externalUrl: `https://www.instagram.com/p/${publishData.id}`,
    message: 'Publicado en Instagram (API real)',
  };
}

export async function publishToPlatform(
  platform,
  { copy, integration, mediaUrl, mediaType },
  metaVersion,
) {
  if (!integration?.connected) {
    return {
      status: 'failed',
      error: `Conecta ${platform === 'facebook' || platform === 'instagram' ? 'Meta' : platform} en Integraciones`,
    };
  }

  // LinkedIn & X — always simulated until full API
  if (platform === 'linkedin' || platform === 'x') {
    return simulatePublish(
      platform,
      integration,
      `${platform === 'linkedin' ? 'LinkedIn' : 'X'}: publicación simulada (próximamente API real)`,
    );
  }

  if (integration.mode === 'demo' || integration.accessToken === 'demo-token') {
    return {
      status: 'failed',
      error: `${platform} requiere OAuth real — no se permite modo demo`,
    };
  }

  if ((platform === 'facebook' || platform === 'instagram') && integration.pageAccessToken) {
    try {
      if (platform === 'facebook' && integration.pageId) {
        return await publishToFacebook(copy, integration, metaVersion, mediaUrl);
      }
      if (platform === 'instagram') {
        return await publishToInstagram(copy, integration, metaVersion, mediaUrl, mediaType);
      }
    } catch (err) {
      console.error(`Meta publish error (${platform}):`, err.message);
      return { status: 'failed', error: err.message, message: err.message };
    }
  }

  return {
    status: 'failed',
    error: `No se pudo publicar en ${platform}`,
  };
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
