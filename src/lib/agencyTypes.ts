export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
export type SocialPlatform = 'instagram' | 'facebook' | 'linkedin' | 'x';
export type IntegrationProvider = 'google' | 'meta' | 'linkedin' | 'x';

export interface PublishResult {
  status: string;
  externalPostId?: string;
  externalUrl?: string;
  error?: string;
  scheduledAt?: string;
  message?: string;
}

export interface Campaign {
  id: string;
  name: string;
  objective: 'Tráfico' | 'Leads' | 'Ventas' | 'Brand';
  channels: string[];
  createdAt: string;
  status: CampaignStatus;
  copy?: string;
  scheduledAt?: string;
  publishedAt?: string;
  publishResults?: Record<string, PublishResult>;
}

export interface Asset {
  id: string;
  name: string;
  ratio: '1:1' | '9:16' | '16:9';
  createdAt: string;
  thumbnail?: string;
  url?: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  type: 'campaign' | 'asset' | 'meeting' | 'publish' | 'other';
  color: string;
  campaignId?: string;
  googleEventId?: string;
  syncStatus?: 'local' | 'synced' | 'failed';
  /** @deprecated legacy local-only field */
  day?: number;
}

export interface SocialPost {
  id: string;
  campaignId: string;
  platform: SocialPlatform | string;
  content: string;
  status: 'pending' | 'published' | 'failed' | 'scheduled';
  externalPostId?: string;
  externalUrl?: string;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface IntegrationStatus {
  provider: IntegrationProvider;
  connected: boolean;
  mode: 'disconnected' | 'demo' | 'live' | 'oauth';
  accountName: string | null;
}

export interface AgencyStats {
  reach: number;
  engagement: number;
  conversions: number;
  investment: number;
  reachTrend: string;
  engagementTrend: string;
  conversionsTrend: string;
  investmentTrend: string;
  publishedPosts?: number;
  scheduledPosts?: number;
  activeCampaigns?: number;
}

export interface AgencyActivity {
  id: string;
  type: string;
  title: string;
  time: string;
  color: string;
}

export const CHANNEL_TO_PLATFORM: Record<string, SocialPlatform> = {
  Instagram: 'instagram',
  Facebook: 'facebook',
  LinkedIn: 'linkedin',
  Twitter: 'x',
  X: 'x',
};

export const PLATFORM_LABELS: Record<string, string> = {
  google: 'Google Calendar',
  meta: 'Meta (Instagram + Facebook)',
  linkedin: 'LinkedIn',
  x: 'X (Twitter)',
  instagram: 'Instagram',
  facebook: 'Facebook',
};
