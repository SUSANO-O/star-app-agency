import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createDefaultContract, normalizeContract } from './contractDefaults';
import type { CampaignContractData } from './contractTypes';
import type {
  AgencyActivity,
  AgencyStats,
  Asset,
  CalendarEvent,
  Campaign,
  IntegrationStatus,
  SocialPost,
} from './agencyTypes';

export type { Campaign, Asset, CalendarEvent } from './agencyTypes';

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  time: string;
  color: string;
}

export type { CampaignContractData } from './contractTypes';

interface HydratePayload {
  campaigns: Campaign[];
  calendarEvents: CalendarEvent[];
  assets: Asset[];
  stats: AgencyStats;
  activities: AgencyActivity[];
}

interface AppState {
  campaigns: Campaign[];
  assets: Asset[];
  calendarEvents: CalendarEvent[];
  activities: ActivityItem[];
  stats: AgencyStats;
  campaignContracts: Record<string, CampaignContractData>;
  integrations: IntegrationStatus[];
  socialPosts: SocialPost[];

  hydrateFromApi: (data: HydratePayload) => void;
  setIntegrations: (integrations: IntegrationStatus[]) => void;
  setSocialPosts: (posts: SocialPost[]) => void;
  mergeSocialPosts: (posts: SocialPost[]) => void;

  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt'>) => void;
  addCampaignFromApi: (campaign: Campaign) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;

  addAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => void;
  addAssetFromApi: (asset: Asset) => void;
  deleteAsset: (id: string) => void;

  addCalendarEventFromApi: (event: CalendarEvent) => void;
  addCalendarEventLegacy: (event: Omit<CalendarEvent, 'id' | 'startAt'> & { day?: number; startAt?: string }) => void;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;

  addActivity: (activity: Omit<ActivityItem, 'id'>) => void;
  updateStats: () => void;

  getOrCreateCampaignContract: (campaignId: string, campaignName: string) => CampaignContractData;
  updateCampaignContract: (campaignId: string, updates: Partial<CampaignContractData>) => void;
  sealCampaignContract: (
    campaignId: string,
    payload: { signatureDataUrl: string; signerName: string; entityName: string },
  ) => void;
  resetCampaignContract: (campaignId: string, campaignName: string) => void;
  clearAllData: () => void;
}

const initialStats: AgencyStats = {
  reach: 120000,
  engagement: 4.8,
  conversions: 1240,
  investment: 8200,
  reachTrend: '+12.5%',
  engagementTrend: '+2.1%',
  conversionsTrend: '+18.2%',
  investmentTrend: '-4.3%',
};

function formatActivityTime(isoOrLabel: string): string {
  if (!isoOrLabel.includes('T')) return isoOrLabel;
  const d = new Date(isoOrLabel);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} h ago`;
  return d.toLocaleDateString('en-US');
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      campaigns: [],
      assets: [],
      calendarEvents: [],
      activities: [],
      stats: initialStats,
      campaignContracts: {},
      integrations: [],
      socialPosts: [],

      hydrateFromApi: (data) => {
        set({
          campaigns: data.campaigns,
          calendarEvents: data.calendarEvents,
          assets: data.assets,
          stats: data.stats,
          activities: data.activities.map((a) => ({
            ...a,
            time: formatActivityTime(a.time),
          })),
        });
      },

      setIntegrations: (integrations) => set({ integrations }),
      setSocialPosts: (socialPosts) => set({ socialPosts }),

      mergeSocialPosts: (posts) => {
        set((state) => {
          const map = new Map(state.socialPosts.map((p) => [p.id, p]));
          posts.forEach((p) => map.set(p.id, p));
          return { socialPosts: Array.from(map.values()) };
        });
      },

      addCampaign: (campaign) => {
        const newCampaign: Campaign = {
          ...campaign,
          id: `campaign-${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: campaign.status || 'active',
        };
        set((state) => ({ campaigns: [...state.campaigns, newCampaign] }));
        get().getOrCreateCampaignContract(newCampaign.id, campaign.name);
        get().addActivity({
          type: 'Campaign',
          title: `New campaign: ${campaign.name}`,
          time: 'Just now',
          color: 'bg-fuchsia-500',
        });
        get().updateStats();
      },

      addCampaignFromApi: (campaign) => {
        set((state) => {
          const exists = state.campaigns.some((c) => c.id === campaign.id);
          if (exists) {
            return {
              campaigns: state.campaigns.map((c) => (c.id === campaign.id ? campaign : c)),
            };
          }
          return { campaigns: [...state.campaigns, campaign] };
        });
        get().getOrCreateCampaignContract(campaign.id, campaign.name);
      },

      updateCampaign: (id, updates) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
        get().updateStats();
      },

      deleteCampaign: (id) => {
        set((state) => {
          const { [id]: _removed, ...restContracts } = state.campaignContracts;
          return {
            campaigns: state.campaigns.filter((c) => c.id !== id),
            campaignContracts: restContracts,
            socialPosts: state.socialPosts.filter((p) => p.campaignId !== id),
          };
        });
        get().updateStats();
      },

      addAsset: (asset) => {
        const newAsset: Asset = {
          ...asset,
          id: `asset-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ assets: [...state.assets, newAsset] }));
        get().addActivity({
          type: 'Asset',
          title: `New asset: ${asset.name}`,
          time: 'Just now',
          color: 'bg-cyan-500',
        });
        get().updateStats();
      },

      addAssetFromApi: (asset) => {
        set((state) => {
          const exists = state.assets.some((a) => a.id === asset.id);
          if (exists) {
            return { assets: state.assets.map((a) => (a.id === asset.id ? asset : a)) };
          }
          return { assets: [...state.assets, asset] };
        });
      },

      deleteAsset: (id) => {
        set((state) => ({ assets: state.assets.filter((a) => a.id !== id) }));
      },

      addCalendarEventFromApi: (event) => {
        set((state) => ({ calendarEvents: [...state.calendarEvents, event] }));
        get().addActivity({
          type: 'Event',
          title: event.title,
          time: 'Just now',
          color: 'bg-orange-500',
        });
      },

      addCalendarEventLegacy: (event) => {
        const startAt =
          event.startAt ||
          (event.day
            ? new Date(new Date().getFullYear(), new Date().getMonth(), event.day).toISOString()
            : new Date().toISOString());
        const newEvent: CalendarEvent = {
          id: `event-${Date.now()}`,
          title: event.title,
          description: event.description,
          type: event.type || 'other',
          color: event.color,
          startAt,
          endAt: event.endAt,
          campaignId: event.campaignId,
        };
        set((state) => ({ calendarEvents: [...state.calendarEvents, newEvent] }));
        get().addActivity({
          type: 'Event',
          title: event.title,
          time: 'Just now',
          color: 'bg-orange-500',
        });
      },

      updateCalendarEvent: (id, updates) => {
        set((state) => ({
          calendarEvents: state.calendarEvents.map((e) =>
            e.id === id ? { ...e, ...updates } : e,
          ),
        }));
      },

      deleteCalendarEvent: (id) => {
        set((state) => ({
          calendarEvents: state.calendarEvents.filter((e) => e.id !== id),
        }));
      },

      addActivity: (activity) => {
        const newActivity: ActivityItem = {
          ...activity,
          id: `activity-${Date.now()}`,
        };
        set((state) => ({
          activities: [newActivity, ...state.activities].slice(0, 10),
        }));
      },

      updateStats: () => {
        const { campaigns, assets } = get();
        const activeCampaigns = campaigns.filter(
          (c) => c.status === 'active' || c.status === 'scheduled',
        ).length;
        const totalAssets = assets.length;
        const baseReach = 120000;
        const reachBoost = activeCampaigns * 15000 + totalAssets * 5000;
        const baseEngagement = 4.8;
        const engagementBoost = activeCampaigns * 0.3 + totalAssets * 0.1;
        const baseConversions = 1240;
        const conversionsBoost = activeCampaigns * 200 + totalAssets * 50;
        const baseInvestment = 8200;
        const investmentIncrease = activeCampaigns * 500;

        set({
          stats: {
            reach: baseReach + reachBoost,
            engagement: parseFloat(Math.min(baseEngagement + engagementBoost, 15).toFixed(1)),
            conversions: baseConversions + conversionsBoost,
            investment: baseInvestment + investmentIncrease,
            reachTrend: '+12.5%',
            engagementTrend: '+2.1%',
            conversionsTrend: '+18.2%',
            investmentTrend: activeCampaigns > 3 ? '+8.5%' : '-4.3%',
          },
        });
      },

      getOrCreateCampaignContract: (campaignId, campaignName) => {
        const existing = get().campaignContracts[campaignId];
        if (existing) {
          const needsFix =
            !Array.isArray(existing.clauses) ||
            existing.clauses.length === 0 ||
            !existing.documentTitle;
          if (needsFix) {
            const normalized = normalizeContract(existing);
            set((state) => ({
              campaignContracts: { ...state.campaignContracts, [campaignId]: normalized },
            }));
            return normalized;
          }
          return existing;
        }
        const created = createDefaultContract(campaignId, campaignName);
        set((state) => ({
          campaignContracts: { ...state.campaignContracts, [campaignId]: created },
        }));
        return created;
      },

      updateCampaignContract: (campaignId, updates) => {
        const current =
          get().campaignContracts[campaignId] ??
          createDefaultContract(campaignId, updates.campaignName ?? 'Campaign');
        set((state) => ({
          campaignContracts: {
            ...state.campaignContracts,
            [campaignId]: { ...current, ...updates, campaignId },
          },
        }));
      },

      sealCampaignContract: (campaignId, payload) => {
        const current =
          get().campaignContracts[campaignId] ??
          createDefaultContract(campaignId, 'Campaign');
        const sealed: CampaignContractData = {
          ...current,
          ...payload,
          status: 'sealed',
          sealedAt: new Date().toISOString(),
        };
        set((state) => ({
          campaignContracts: { ...state.campaignContracts, [campaignId]: sealed },
        }));
        get().addActivity({
          type: 'Campaign',
          title: `Contract sealed: ${current.campaignName}`,
          time: 'Just now',
          color: 'bg-emerald-500',
        });
      },

      resetCampaignContract: (campaignId, campaignName) => {
        const fresh = createDefaultContract(campaignId, campaignName);
        set((state) => ({
          campaignContracts: { ...state.campaignContracts, [campaignId]: fresh },
        }));
      },

      clearAllData: () => {
        set({
          campaigns: [],
          assets: [],
          calendarEvents: [],
          activities: [],
          stats: initialStats,
          campaignContracts: {},
          socialPosts: [],
        });
      },
    }),
    {
      name: 'star-app-storage',
      version: 3,
      migrate: (persisted, version) => {
        const state = persisted as AppState;
        if (version < 2) {
          return { ...state, campaignContracts: state.campaignContracts ?? {} };
        }
        if (version < 3) {
          const events = (state.calendarEvents ?? []).map((e: CalendarEvent & { day?: number }) => {
            if (e.startAt) return e;
            if (e.day) {
              return {
                ...e,
                startAt: new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  e.day,
                ).toISOString(),
              };
            }
            return { ...e, startAt: new Date().toISOString() };
          });
          return {
            ...state,
            calendarEvents: events,
            integrations: state.integrations ?? [],
            socialPosts: state.socialPosts ?? [],
          };
        }
        return state;
      },
    },
  ),
);
