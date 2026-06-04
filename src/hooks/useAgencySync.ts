import { useCallback, useEffect, useState } from 'react';
import {
  checkAgencyHealth,
  createCalendarEventApi,
  createCampaign,
  deleteAssetApi,
  deleteCalendarEventApi,
  deleteCampaignApi,
  fetchAgencyActivities,
  fetchAgencyStats,
  fetchAssets,
  fetchCalendarEvents,
  fetchCampaigns,
  fetchIntegrationsStatus,
  fetchSocialPosts,
  processScheduledPosts,
  publishCampaignApi,
  updateCampaignApi,
  uploadAssetApi,
} from '../lib/agencyApi';
import { useAppStore } from '../lib/store';
import type { Campaign, CalendarEvent } from '../lib/agencyTypes';

export function useAgencySync() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const hydrateFromApi = useAppStore((s) => s.hydrateFromApi);
  const setIntegrations = useAppStore((s) => s.setIntegrations);
  const setSocialPosts = useAppStore((s) => s.setSocialPosts);

  const syncAll = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const online = await checkAgencyHealth();
      setApiOnline(online);
      if (!online) {
        setSyncError('Agency API unavailable. Run: npm run dev:all');
        return false;
      }

      await processScheduledPosts();

      const [campaigns, events, assets, stats, activities, integrations, posts] =
        await Promise.all([
          fetchCampaigns(),
          fetchCalendarEvents(),
          fetchAssets(),
          fetchAgencyStats(),
          fetchAgencyActivities(),
          fetchIntegrationsStatus(),
          fetchSocialPosts(),
        ]);

      hydrateFromApi({ campaigns, calendarEvents: events, assets, stats, activities });
      setIntegrations(integrations);
      setSocialPosts(posts);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync error';
      setSyncError(msg);
      setApiOnline(false);
      return false;
    } finally {
      setSyncing(false);
    }
  }, [hydrateFromApi, setIntegrations, setSocialPosts]);

  useEffect(() => {
    syncAll();
  }, [syncAll]);

  return { apiOnline, syncing, syncError, syncAll };
}

export function useAgencyActions() {
  const store = useAppStore();

  const createCampaignRemote = async (
    payload: Omit<Campaign, 'id' | 'createdAt'>,
  ) => {
    try {
      const campaign = await createCampaign(payload);
      store.addCampaignFromApi(campaign);
      return campaign;
    } catch {
      store.addCampaign(payload);
      return null;
    }
  };

  const updateCampaignRemote = async (id: string, updates: Partial<Campaign>) => {
    try {
      const updated = await updateCampaignApi(id, updates);
      store.updateCampaign(id, updated);
      return updated;
    } catch {
      store.updateCampaign(id, updates);
      return null;
    }
  };

  const deleteCampaignRemote = async (id: string) => {
    try {
      await deleteCampaignApi(id);
    } catch {
      /* fallback local */
    }
    store.deleteCampaign(id);
  };

  const publishCampaignRemote = async (
    id: string,
    body: { copy?: string; scheduledAt?: string; platforms?: string[] },
  ) => {
    const result = await publishCampaignApi(id, body);
    store.updateCampaign(id, result.campaign);
    store.mergeSocialPosts(result.posts);
    return result;
  };

  const addCalendarEventRemote = async (event: Omit<CalendarEvent, 'id'>) => {
    try {
      const created = await createCalendarEventApi(event);
      store.addCalendarEventFromApi(created);
      return created;
    } catch {
      store.addCalendarEventLegacy(event);
      return null;
    }
  };

  const deleteCalendarEventRemote = async (id: string) => {
    try {
      await deleteCalendarEventApi(id);
    } catch {
      /* local */
    }
    store.deleteCalendarEvent(id);
  };

  const uploadAssetRemote = async (file: File | null, name: string, ratio: string) => {
    try {
      const asset = await uploadAssetApi(file, name, ratio);
      store.addAssetFromApi(asset);
      return asset;
    } catch {
      store.addAsset({ name, ratio: ratio as '1:1' | '9:16' | '16:9' });
      return null;
    }
  };

  const deleteAssetRemote = async (id: string) => {
    try {
      await deleteAssetApi(id);
    } catch {
      /* local */
    }
    store.deleteAsset(id);
  };

  return {
    createCampaignRemote,
    updateCampaignRemote,
    deleteCampaignRemote,
    publishCampaignRemote,
    addCalendarEventRemote,
    deleteCalendarEventRemote,
    uploadAssetRemote,
    deleteAssetRemote,
  };
}
