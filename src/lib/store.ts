import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface Campaign {
  id: string;
  name: string;
  objective: 'Tráfico' | 'Leads' | 'Ventas' | 'Brand';
  channels: string[];
  createdAt: string;
  status: 'active' | 'paused' | 'completed';
}

export interface Asset {
  id: string;
  name: string;
  ratio: '1:1' | '9:16' | '16:9';
  createdAt: string;
  thumbnail?: string;
}

export interface CalendarEvent {
  id: string;
  day: number;
  title: string;
  description?: string;
  type: 'campaign' | 'asset' | 'meeting' | 'other';
  color: string;
}

export interface Stats {
  reach: number;
  engagement: number;
  conversions: number;
  investment: number;
  reachTrend: string;
  engagementTrend: string;
  conversionsTrend: string;
  investmentTrend: string;
}

export interface ActivityItem {
  id: string;
  type: 'Campaña' | 'Asset' | 'Usuario' | 'Evento';
  title: string;
  time: string;
  color: string;
}

interface AppState {
  // Data
  campaigns: Campaign[];
  assets: Asset[];
  calendarEvents: CalendarEvent[];
  activities: ActivityItem[];
  stats: Stats;

  // Campaign Actions
  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt'>) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;

  // Asset Actions
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => void;
  deleteAsset: (id: string) => void;

  // Calendar Actions
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;

  // Activity Actions
  addActivity: (activity: Omit<ActivityItem, 'id'>) => void;

  // Stats Actions
  updateStats: () => void;

  // Clear all data
  clearAllData: () => void;
}

const initialStats: Stats = {
  reach: 120000,
  engagement: 4.8,
  conversions: 1240,
  investment: 8200,
  reachTrend: '+12.5%',
  engagementTrend: '+2.1%',
  conversionsTrend: '+18.2%',
  investmentTrend: '-4.3%',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      campaigns: [],
      assets: [],
      calendarEvents: [],
      activities: [],
      stats: initialStats,

      // Campaign Actions
      addCampaign: (campaign) => {
        const newCampaign: Campaign = {
          ...campaign,
          id: `campaign-${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: 'active',
        };

        set((state) => ({
          campaigns: [...state.campaigns, newCampaign],
        }));

        // Add activity
        get().addActivity({
          type: 'Campaña',
          title: `Nueva campaña: ${campaign.name}`,
          time: 'Ahora',
          color: 'bg-fuchsia-500',
        });

        // Update stats
        get().updateStats();
      },

      updateCampaign: (id, updates) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
        get().updateStats();
      },

      deleteCampaign: (id) => {
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c.id !== id),
        }));
        get().updateStats();
      },

      // Asset Actions
      addAsset: (asset) => {
        const newAsset: Asset = {
          ...asset,
          id: `asset-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          assets: [...state.assets, newAsset],
        }));

        // Add activity
        get().addActivity({
          type: 'Asset',
          title: `Nuevo asset: ${asset.name}`,
          time: 'Ahora',
          color: 'bg-cyan-500',
        });

        // Update stats
        get().updateStats();
      },

      deleteAsset: (id) => {
        set((state) => ({
          assets: state.assets.filter((a) => a.id !== id),
        }));
      },

      // Calendar Actions
      addCalendarEvent: (event) => {
        const newEvent: CalendarEvent = {
          ...event,
          id: `event-${Date.now()}`,
        };

        set((state) => ({
          calendarEvents: [...state.calendarEvents, newEvent],
        }));

        // Add activity
        get().addActivity({
          type: 'Evento',
          title: event.title,
          time: 'Ahora',
          color: 'bg-orange-500',
        });
      },

      updateCalendarEvent: (id, updates) => {
        set((state) => ({
          calendarEvents: state.calendarEvents.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }));
      },

      deleteCalendarEvent: (id) => {
        set((state) => ({
          calendarEvents: state.calendarEvents.filter((e) => e.id !== id),
        }));
      },

      // Activity Actions
      addActivity: (activity) => {
        const newActivity: ActivityItem = {
          ...activity,
          id: `activity-${Date.now()}`,
        };

        set((state) => ({
          activities: [newActivity, ...state.activities].slice(0, 10), // Keep only last 10
        }));
      },

      // Stats Actions
      updateStats: () => {
        const { campaigns, assets } = get();
        const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
        const totalAssets = assets.length;

        // Calculate dynamic stats based on campaigns and assets
        const baseReach = 120000;
        const reachBoost = activeCampaigns * 15000 + totalAssets * 5000;
        const newReach = baseReach + reachBoost;

        const baseEngagement = 4.8;
        const engagementBoost = activeCampaigns * 0.3 + totalAssets * 0.1;
        const newEngagement = Math.min(baseEngagement + engagementBoost, 15);

        const baseConversions = 1240;
        const conversionsBoost = activeCampaigns * 200 + totalAssets * 50;
        const newConversions = baseConversions + conversionsBoost;

        const baseInvestment = 8200;
        const investmentIncrease = activeCampaigns * 500;
        const newInvestment = baseInvestment + investmentIncrease;

        set({
          stats: {
            reach: newReach,
            engagement: parseFloat(newEngagement.toFixed(1)),
            conversions: newConversions,
            investment: newInvestment,
            reachTrend: '+12.5%',
            engagementTrend: '+2.1%',
            conversionsTrend: '+18.2%',
            investmentTrend: activeCampaigns > 3 ? '+8.5%' : '-4.3%',
          },
        });
      },

      // Clear all data
      clearAllData: () => {
        set({
          campaigns: [],
          assets: [],
          calendarEvents: [],
          activities: [],
          stats: initialStats,
        });
      },
    }),
    {
      name: 'star-app-storage', // localStorage key
      version: 1,
    }
  )
);
