import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';
import type {
  AgencyActivity,
  AgencyStats,
  Asset,
  CalendarEvent,
  Campaign,
  IntegrationProvider,
  IntegrationsConfig,
  IntegrationStatus,
  SocialPost,
} from './agencyTypes';

const agencyBaseUrl =
  import.meta.env.VITE_AGENCY_API_URL || '/api/agency';

function createAgencyClient(): AxiosInstance {
  const client = axios.create({
    baseURL: agencyBaseUrl,
    headers: { 'Content-Type': 'application/json' },
    timeout: config.api.timeout,
  });

  client.interceptors.request.use((reqConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(config.auth.tokenKey);
      const username = localStorage.getItem(config.auth.usernameKey);
      const password = localStorage.getItem(config.auth.passwordKey);

      if (token) {
        reqConfig.headers.Authorization = `Bearer ${token}`;
      } else if (username && password) {
        reqConfig.headers.Authorization = `Basic ${btoa(`${username}:${password}`)}`;
      }
      if (username) {
        reqConfig.headers['X-User-Email'] = username;
      }
    }
    return reqConfig;
  });

  return client;
}

const agencyClient = createAgencyClient();

export async function checkAgencyHealth(): Promise<boolean> {
  try {
    await agencyClient.get('/health/');
    return true;
  } catch {
    return false;
  }
}

// Campaigns
export async function fetchCampaigns(): Promise<Campaign[]> {
  const { data } = await agencyClient.get<Campaign[]>('/campaigns/');
  return data;
}

export async function createCampaign(
  payload: Omit<Campaign, 'id' | 'createdAt'>,
): Promise<Campaign> {
  const { data } = await agencyClient.post<Campaign>('/campaigns/', payload);
  return data;
}

export async function updateCampaignApi(
  id: string,
  updates: Partial<Campaign>,
): Promise<Campaign> {
  const { data } = await agencyClient.patch<Campaign>(`/campaigns/${id}/`, updates);
  return data;
}

export async function deleteCampaignApi(id: string): Promise<void> {
  await agencyClient.delete(`/campaigns/${id}/`);
}

export async function publishCampaignApi(
  id: string,
  body: { copy?: string; scheduledAt?: string; platforms?: string[] },
): Promise<{
  campaign: Campaign;
  posts: SocialPost[];
  results: Record<string, unknown>;
}> {
  const { data } = await agencyClient.post(`/campaigns/${id}/publish/`, body);
  return data;
}

// Calendar
export async function fetchCalendarEvents(from?: string, to?: string): Promise<CalendarEvent[]> {
  const { data } = await agencyClient.get<CalendarEvent[]>('/calendar/events/', {
    params: { from, to },
  });
  return data;
}

export async function createCalendarEventApi(
  event: Omit<CalendarEvent, 'id'>,
): Promise<CalendarEvent> {
  const { data } = await agencyClient.post<CalendarEvent>('/calendar/events/', event);
  return data;
}

export async function deleteCalendarEventApi(id: string): Promise<void> {
  await agencyClient.delete(`/calendar/events/${id}/`);
}

// Assets
export async function fetchAssets(): Promise<Asset[]> {
  const { data } = await agencyClient.get<Asset[]>('/assets/');
  return data;
}

export async function uploadAssetApi(
  file: File | null,
  name: string,
  ratio: string,
): Promise<Asset> {
  const form = new FormData();
  form.append('name', name);
  form.append('ratio', ratio);
  if (file) form.append('file', file);

  const { data } = await agencyClient.post<Asset>('/assets/upload/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteAssetApi(id: string): Promise<void> {
  await agencyClient.delete(`/assets/${id}/`);
}

// Integrations
export async function fetchIntegrationsConfig(): Promise<IntegrationsConfig> {
  const { data } = await agencyClient.get<IntegrationsConfig>('/integrations/config/');
  return data;
}

export async function fetchIntegrationsStatus(): Promise<IntegrationStatus[]> {
  const { data } = await agencyClient.get<{ integrations: IntegrationStatus[] }>(
    '/integrations/status/',
  );
  return data.integrations;
}

export async function getIntegrationConnectUrl(
  provider: IntegrationProvider,
): Promise<{ url: string; mode: string }> {
  const { data } = await agencyClient.get<{ url: string; mode: string }>(
    `/integrations/${provider}/connect/`,
  );
  return data;
}

export async function completeIntegrationCallback(
  provider: IntegrationProvider,
  code: string,
): Promise<{ success: boolean; mode: string; accountName?: string; error?: string }> {
  const { data } = await agencyClient.post(`/integrations/${provider}/callback/`, { code });
  return data;
}

export async function disconnectIntegration(provider: IntegrationProvider): Promise<void> {
  await agencyClient.delete(`/integrations/${provider}/disconnect/`);
}

// Posts & stats
export async function fetchSocialPosts(campaignId?: string): Promise<SocialPost[]> {
  const { data } = await agencyClient.get<SocialPost[]>('/posts/', {
    params: campaignId ? { campaign: campaignId } : undefined,
  });
  return data;
}

export async function fetchAgencyStats(): Promise<AgencyStats> {
  const { data } = await agencyClient.get<AgencyStats>('/stats/');
  return data;
}

export async function fetchAgencyActivities(): Promise<AgencyActivity[]> {
  const { data } = await agencyClient.get<AgencyActivity[]>('/activities/');
  return data;
}

export async function processScheduledPosts(): Promise<{ processed: number }> {
  const { data } = await agencyClient.post<{ processed: number }>('/posts/process-scheduled/');
  return data;
}

export { agencyBaseUrl };
