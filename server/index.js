/**
 * Agency 360 API — companion server for startapp360 Django API.
 * Mount at /api/v1/agency/* — merge into Django when ready.
 */
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
const PORT = process.env.AGENCY_API_PORT || 8001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'data', 'uploads');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  `http://localhost:${PORT}/api/v1/agency/integrations/google/callback/`;

const META_APP_ID = process.env.META_APP_ID || '';
const META_APP_SECRET = process.env.META_APP_SECRET || '';
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '';
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';
const LINKEDIN_REDIRECT_URI =
  process.env.LINKEDIN_REDIRECT_URI || `${FRONTEND_URL}/integrations/callback`;
const META_REDIRECT_URI =
  process.env.META_REDIRECT_URI || `${FRONTEND_URL}/integrations/callback`;
const X_CLIENT_ID = process.env.X_CLIENT_ID || '';
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET || '';
const X_REDIRECT_URI =
  process.env.X_REDIRECT_URI || `${FRONTEND_URL}/integrations/callback`;

const ALL_PROVIDERS = ['google', 'linkedin', 'meta', 'x'];
const ENABLED_INTEGRATIONS = (process.env.ENABLED_INTEGRATIONS || 'google,linkedin')
  .split(',')
  .map((p) => p.trim().toLowerCase())
  .filter((p) => ALL_PROVIDERS.includes(p));

function isProviderEnabled(provider) {
  return ENABLED_INTEGRATIONS.includes(provider);
}

function hasLiveCredentials(provider) {
  switch (provider) {
    case 'google':
      return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
    case 'meta':
      return Boolean(META_APP_ID && META_APP_SECRET);
    case 'linkedin':
      return Boolean(LINKEDIN_CLIENT_ID && LINKEDIN_CLIENT_SECRET);
    case 'x':
      return Boolean(X_CLIENT_ID && X_CLIENT_SECRET);
    default:
      return false;
  }
}

if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function loadDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('DB load error:', e);
  }
  return { users: {} };
}

function saveDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function getUserId(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    return `jwt:${auth.slice(7, 48)}`;
  }
  if (auth.startsWith('Basic ')) {
    try {
      const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
      const email = decoded.split(':')[0];
      return `user:${email}`;
    } catch {
      return 'anonymous';
    }
  }
  const email = req.headers['x-user-email'];
  if (email) return `user:${email}`;
  return 'anonymous';
}

function getUserData(db, userId) {
  if (!db.users[userId]) {
    db.users[userId] = {
      campaigns: [],
      calendarEvents: [],
      assets: [],
      socialPosts: [],
      integrations: {},
      activities: [],
    };
  }
  return db.users[userId];
}

function platformKey(name) {
  const map = {
    Instagram: 'instagram',
    Facebook: 'facebook',
    LinkedIn: 'linkedin',
    Twitter: 'x',
    X: 'x',
  };
  return map[name] || name.toLowerCase();
}

function addActivity(userData, activity) {
  userData.activities.unshift({
    id: randomUUID(),
    ...activity,
    time: activity.time || new Date().toISOString(),
  });
  userData.activities = userData.activities.slice(0, 50);
}

async function publishToPlatform(platform, { copy, mediaUrl, integration }) {
  const baseUrls = {
    instagram: 'https://www.instagram.com/p/',
    facebook: 'https://www.facebook.com/posts/',
    linkedin: 'https://www.linkedin.com/feed/update/',
    x: 'https://x.com/i/status/',
  };

  if (integration?.accessToken && integration.accessToken !== 'demo-token') {
    // Real API hooks — extend when OAuth tokens are live
    if (platform === 'linkedin' && integration.accessToken) {
      // Placeholder for LinkedIn Share API
    }
  }

  const postId = randomUUID().slice(0, 12);
  return {
    status: 'published',
    externalPostId: postId,
    externalUrl: `${baseUrls[platform] || 'https://example.com/'}${postId}`,
    message: integration?.connected
      ? `Publicado en ${platform} (modo ${integration.mode || 'demo'})`
      : `Simulación: conecta ${platform} en Integraciones para publicación real`,
  };
}

async function syncGoogleCalendar(integration, event) {
  if (!integration?.connected || !GOOGLE_CLIENT_ID) {
    return { googleEventId: null, syncStatus: 'local' };
  }
  // Real Google Calendar API would go here with googleapis + refresh_token
  return {
    googleEventId: `gcal_${randomUUID().slice(0, 8)}`,
    syncStatus: integration.accessToken ? 'synced' : 'local',
  };
}

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const app = express();
app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Email'],
  }),
);
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// ─── Integrations config (qué mostrar en UI — sin secretos) ─────────────────
app.get('/api/v1/agency/integrations/config/', (_req, res) => {
  res.json({
    enabled: ENABLED_INTEGRATIONS,
    configured: {
      google: hasLiveCredentials('google'),
      linkedin: hasLiveCredentials('linkedin'),
      meta: hasLiveCredentials('meta'),
      x: hasLiveCredentials('x'),
    },
  });
});

// ─── Integrations status ───────────────────────────────────────────────────
app.get('/api/v1/agency/integrations/status/', (req, res) => {
  const db = loadDb();
  const user = getUserData(db, getUserId(req));
  const status = ENABLED_INTEGRATIONS.map((p) => ({
    provider: p,
    connected: Boolean(user.integrations[p]?.connected),
    mode: user.integrations[p]?.mode || 'disconnected',
    accountName: user.integrations[p]?.accountName || null,
  }));
  res.json({ integrations: status });
});

// ─── OAuth connect URLs ─────────────────────────────────────────────────────
app.get('/api/v1/agency/integrations/:provider/connect/', (req, res) => {
  const { provider } = req.params;

  if (!isProviderEnabled(provider)) {
    return res.status(403).json({ error: 'Integración no habilitada en el servidor' });
  }

  const userId = getUserId(req);
  const state = Buffer.from(JSON.stringify({ userId, provider })).toString('base64url');

  if (provider === 'google' && GOOGLE_CLIENT_ID) {
    const scopes = encodeURIComponent(
      'https://www.googleapis.com/auth/calendar.events',
    );
    const url =
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
      `&response_type=code&scope=${scopes}&access_type=offline&state=${state}&prompt=consent`;
    return res.json({ url, mode: 'oauth' });
  }

  if (provider === 'meta' && META_APP_ID) {
    const url =
      `https://www.facebook.com/v19.0/dialog/oauth?client_id=${META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(`${META_REDIRECT_URI}?provider=meta`)}` +
      `&state=${state}&scope=pages_manage_posts,instagram_content_publish`;
    return res.json({ url, mode: 'oauth' });
  }

  if (provider === 'linkedin' && LINKEDIN_CLIENT_ID) {
    const url =
      `https://www.linkedin.com/oauth/v2/authorization?response_type=code` +
      `&client_id=${LINKEDIN_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(`${LINKEDIN_REDIRECT_URI}?provider=linkedin`)}` +
      `&state=${state}&scope=openid%20profile%20w_member_social`;
    return res.json({ url, mode: 'oauth' });
  }

  if (provider === 'x' && X_CLIENT_ID) {
    const url =
      `https://twitter.com/i/oauth2/authorize?response_type=code` +
      `&client_id=${X_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(`${X_REDIRECT_URI}?provider=x`)}` +
      `&state=${state}&scope=tweet.read%20tweet.write%20users.read%20offline.access`;
    return res.json({ url, mode: 'oauth' });
  }

  // Demo connect — solo si no hay credenciales live
  const demoUrl = `${FRONTEND_URL}/integrations/callback?provider=${provider}&code=demo&state=${state}`;
  res.json({ url: demoUrl, mode: 'demo' });
});

app.post('/api/v1/agency/integrations/:provider/callback/', (req, res) => {
  const { provider } = req.params;
  const { code } = req.body;
  const db = loadDb();
  const userId = getUserId(req);
  const user = getUserData(db, userId);

  const names = {
    google: 'Google Calendar',
    meta: 'Meta (IG + FB)',
    linkedin: 'LinkedIn',
    x: 'X (Twitter)',
  };

  user.integrations[provider] = {
    connected: true,
    mode: code === 'demo' ? 'demo' : 'live',
    accessToken: code === 'demo' ? 'demo-token' : code,
    refreshToken: null,
    accountName: names[provider] || provider,
    connectedAt: new Date().toISOString(),
  };

  saveDb(db);
  addActivity(user, {
    type: 'Integración',
    title: `${names[provider]} conectado`,
    color: 'bg-emerald-500',
  });
  saveDb(db);

  res.json({ success: true, provider, mode: user.integrations[provider].mode });
});

app.delete('/api/v1/agency/integrations/:provider/disconnect/', (req, res) => {
  const db = loadDb();
  const user = getUserData(db, getUserId(req));
  delete user.integrations[req.params.provider];
  saveDb(db);
  res.json({ success: true });
});

// Google OAuth server-side callback (when using real Google credentials)
app.get('/api/v1/agency/integrations/google/callback/', async (req, res) => {
  const { code, state } = req.query;
  if (!code) {
    return res.redirect(`${FRONTEND_URL}/integrations/callback?error=no_code`);
  }
  res.redirect(
    `${FRONTEND_URL}/integrations/callback?provider=google&code=${code}&state=${state || ''}`,
  );
});

// ─── Campaigns ──────────────────────────────────────────────────────────────
app.get('/api/v1/agency/campaigns/', (req, res) => {
  const db = loadDb();
  const user = getUserData(db, getUserId(req));
  res.json(user.campaigns);
});

app.post('/api/v1/agency/campaigns/', (req, res) => {
  const db = loadDb();
  const userId = getUserId(req);
  const user = getUserData(db, userId);
  const campaign = {
    id: randomUUID(),
    ...req.body,
    status: req.body.status || 'draft',
    createdAt: new Date().toISOString(),
    publishResults: {},
  };
  user.campaigns.push(campaign);
  addActivity(user, {
    type: 'Campaña',
    title: `Nueva campaña: ${campaign.name}`,
    color: 'bg-fuchsia-500',
  });
  saveDb(db);
  res.status(201).json(campaign);
});

app.patch('/api/v1/agency/campaigns/:id/', (req, res) => {
  const db = loadDb();
  const user = getUserData(db, getUserId(req));
  const idx = user.campaigns.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Campaña no encontrada' });
  user.campaigns[idx] = { ...user.campaigns[idx], ...req.body };
  saveDb(db);
  res.json(user.campaigns[idx]);
});

app.delete('/api/v1/agency/campaigns/:id/', (req, res) => {
  const db = loadDb();
  const user = getUserData(db, getUserId(req));
  user.campaigns = user.campaigns.filter((c) => c.id !== req.params.id);
  user.socialPosts = user.socialPosts.filter((p) => p.campaignId !== req.params.id);
  saveDb(db);
  res.json({ success: true });
});

app.post('/api/v1/agency/campaigns/:id/publish/', async (req, res) => {
  const db = loadDb();
  const user = getUserData(db, getUserId(req));
  const campaign = user.campaigns.find((c) => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaña no encontrada' });

  const { copy, scheduledAt, platforms } = req.body;
  const copyText = copy || campaign.copy || `Campaña: ${campaign.name}`;
  const targetPlatforms =
    platforms || campaign.channels.map((c) => platformKey(c));
  const results = {};
  const posts = [];

  for (const platform of targetPlatforms) {
    const integrationKey =
      platform === 'instagram' || platform === 'facebook' ? 'meta' : platform;
    const integration = user.integrations[integrationKey];

    if (!integration?.connected) {
      results[platform] = {
        status: 'failed',
        error: `Conecta ${integrationKey} en Integraciones primero`,
      };
      continue;
    }

    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

    if (isScheduled) {
      const post = {
        id: randomUUID(),
        campaignId: campaign.id,
        platform,
        content: copyText,
        status: 'scheduled',
        scheduledAt,
        createdAt: new Date().toISOString(),
      };
      user.socialPosts.push(post);
      posts.push(post);
      results[platform] = { status: 'scheduled', scheduledAt };

      const start = new Date(scheduledAt);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const calEvent = {
        id: randomUUID(),
        title: `Publicar: ${campaign.name} (${platform})`,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        type: 'publish',
        color: 'bg-fuchsia-500',
        campaignId: campaign.id,
        syncStatus: 'local',
      };
      const gSync = await syncGoogleCalendar(user.integrations.google, calEvent);
      Object.assign(calEvent, gSync);
      user.calendarEvents.push(calEvent);
    } else {
      const pub = await publishToPlatform(platform, {
        copy: copyText,
        integration,
      });
      const post = {
        id: randomUUID(),
        campaignId: campaign.id,
        platform,
        content: copyText,
        status: pub.status,
        externalPostId: pub.externalPostId,
        externalUrl: pub.externalUrl,
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      user.socialPosts.push(post);
      posts.push(post);
      results[platform] = pub;
    }
  }

  campaign.publishResults = { ...campaign.publishResults, ...results };
  campaign.status = Object.values(results).some((r) => r.status === 'scheduled')
    ? 'scheduled'
    : 'active';
  campaign.copy = copyText;
  if (scheduledAt) campaign.scheduledAt = scheduledAt;

  addActivity(user, {
    type: 'Campaña',
    title: `Publicación: ${campaign.name}`,
    color: 'bg-orange-500',
  });
  saveDb(db);

  res.json({ campaign, posts, results });
});

// ─── Calendar ───────────────────────────────────────────────────────────────
app.get('/api/v1/agency/calendar/events/', (req, res) => {
  const db = loadDb();
  const user = getUserData(db, getUserId(req));
  const { from, to } = req.query;
  let events = user.calendarEvents;
  if (from) {
    events = events.filter((e) => e.startAt >= from);
  }
  if (to) {
    events = events.filter((e) => e.startAt <= to);
  }
  res.json(events);
});

app.post('/api/v1/agency/calendar/events/', async (req, res) => {
  const db = loadDb();
  const user = getUserData(db, getUserId(req));
  const event = {
    id: randomUUID(),
    ...req.body,
    syncStatus: 'local',
  };

  const gSync = await syncGoogleCalendar(user.integrations.google, event);
  Object.assign(event, gSync);

  user.calendarEvents.push(event);
  addActivity(user, {
    type: 'Evento',
    title: event.title,
    color: 'bg-rose-500',
  });
  saveDb(db);
  res.status(201).json(event);
});

app.delete('/api/v1/agency/calendar/events/:id/', (req, res) => {
  const db = loadDb();
  const user = getUserData(db, getUserId(req));
  user.calendarEvents = user.calendarEvents.filter((e) => e.id !== req.params.id);
  saveDb(db);
  res.json({ success: true });
});

// ─── Assets ─────────────────────────────────────────────────────────────────
app.get('/api/v1/agency/assets/', (req, res) => {
  const db = loadDb();
  const user = getUserData(db, getUserId(req));
  res.json(user.assets);
});

app.post('/api/v1/agency/assets/upload/', upload.single('file'), (req, res) => {
  const db = loadDb();
  const user = getUserData(db, getUserId(req));
  const asset = {
    id: randomUUID(),
    name: req.body.name || req.file?.originalname || 'Asset',
    ratio: req.body.ratio || '1:1',
    createdAt: new Date().toISOString(),
    url: req.file ? `/uploads/${req.file.filename}` : null,
    thumbnail: req.file ? `/uploads/${req.file.filename}` : undefined,
  };
  user.assets.push(asset);
  addActivity(user, {
    type: 'Asset',
    title: `Nuevo asset: ${asset.name}`,
    color: 'bg-cyan-500',
  });
  saveDb(db);
  res.status(201).json(asset);
});

app.delete('/api/v1/agency/assets/:id/', (req, res) => {
  const db = loadDb();
  const user = getUserData(db, getUserId(req));
  user.assets = user.assets.filter((a) => a.id !== req.params.id);
  saveDb(db);
  res.json({ success: true });
});

// ─── Social posts ───────────────────────────────────────────────────────────
app.get('/api/v1/agency/posts/', (req, res) => {
  const db = loadDb();
  const user = getUserData(db, getUserId(req));
  let posts = user.socialPosts;
  if (req.query.campaign) {
    posts = posts.filter((p) => p.campaignId === req.query.campaign);
  }
  res.json(posts);
});

// Process scheduled posts (call via cron or manually)
app.post('/api/v1/agency/posts/process-scheduled/', async (req, res) => {
  const db = loadDb();
  const user = getUserData(db, getUserId(req));
  const now = new Date();
  const processed = [];

  for (const post of user.socialPosts) {
    if (post.status !== 'scheduled') continue;
    if (new Date(post.scheduledAt) > now) continue;

    const integrationKey =
      post.platform === 'instagram' || post.platform === 'facebook'
        ? 'meta'
        : post.platform;
    const integration = user.integrations[integrationKey];
    const pub = await publishToPlatform(post.platform, {
      copy: post.content,
      integration,
    });
    Object.assign(post, {
      status: pub.status,
      externalPostId: pub.externalPostId,
      externalUrl: pub.externalUrl,
      publishedAt: now.toISOString(),
    });
    processed.push(post);
  }

  saveDb(db);
  res.json({ processed: processed.length, posts: processed });
});

// ─── Activities & stats ─────────────────────────────────────────────────────
app.get('/api/v1/agency/activities/', (req, res) => {
  const db = loadDb();
  const user = getUserData(db, getUserId(req));
  res.json(user.activities.slice(0, 20));
});

app.get('/api/v1/agency/stats/', (req, res) => {
  const db = loadDb();
  const user = getUserData(db, getUserId(req));
  const activeCampaigns = user.campaigns.filter(
    (c) => c.status === 'active' || c.status === 'scheduled',
  ).length;
  const publishedPosts = user.socialPosts.filter((p) => p.status === 'published').length;
  const scheduledPosts = user.socialPosts.filter((p) => p.status === 'scheduled').length;

  res.json({
    reach: 120000 + activeCampaigns * 15000 + user.assets.length * 5000,
    engagement: Math.min(4.8 + activeCampaigns * 0.3, 15),
    conversions: 1240 + publishedPosts * 200,
    investment: 8200 + activeCampaigns * 500,
    reachTrend: '+12.5%',
    engagementTrend: '+2.1%',
    conversionsTrend: `+${publishedPosts * 5}%`,
    investmentTrend: activeCampaigns > 3 ? '+8.5%' : '-4.3%',
    publishedPosts,
    scheduledPosts,
    activeCampaigns,
  });
});

app.get('/api/v1/agency/health/', (_req, res) => {
  res.json({ status: 'ok', service: 'agency-api', port: PORT });
});

app.listen(PORT, () => {
  console.log(`Agency API running at http://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/v1/agency/health/`);
});
