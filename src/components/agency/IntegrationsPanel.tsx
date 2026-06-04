import { useCallback, useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle,
  ExternalLink,
  Instagram,
  Linkedin,
  Loader2,
  Twitter,
  Unplug,
} from 'lucide-react';
import {
  disconnectIntegration,
  fetchIntegrationsConfig,
  fetchIntegrationsStatus,
  getIntegrationConnectUrl,
} from '../../lib/agencyApi';
import { PLATFORM_LABELS } from '../../lib/agencyTypes';
import type { IntegrationProvider, IntegrationStatus } from '../../lib/agencyTypes';
import { useAppStore } from '../../lib/store';

const PROVIDERS: {
  id: IntegrationProvider;
  icon: typeof Calendar;
  color: string;
  description: string;
}[] = [
  {
    id: 'google',
    icon: Calendar,
    color: 'text-blue-600 bg-blue-50',
    description: 'Sync campaign posts and events with Google Calendar.',
  },
  {
    id: 'meta',
    icon: Instagram,
    color: 'text-fuchsia-600 bg-fuchsia-50',
    description: 'Publish to Instagram and linked Facebook Page.',
  },
  {
    id: 'linkedin',
    icon: Linkedin,
    color: 'text-sky-700 bg-sky-50',
    description: 'Share campaigns and content on LinkedIn.',
  },
  {
    id: 'x',
    icon: Twitter,
    color: 'text-slate-800 bg-slate-100',
    description: 'Publish on X (Twitter). Requires developer API access.',
  },
];

interface IntegrationsPanelProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'warning') => void;
}

export function IntegrationsPanel({ onToast }: IntegrationsPanelProps) {
  const integrations = useAppStore((s) => s.integrations);
  const setIntegrations = useAppStore((s) => s.setIntegrations);
  const [loading, setLoading] = useState<string | null>(null);
  const [enabledProviders, setEnabledProviders] = useState<string[]>(['google', 'linkedin']);
  const [configured, setConfigured] = useState<Record<string, boolean>>({});

  const refresh = useCallback(async () => {
    try {
      const [status, config] = await Promise.all([
        fetchIntegrationsStatus(),
        fetchIntegrationsConfig(),
      ]);
      setIntegrations(status);
      setEnabledProviders(config.enabled);
      setConfigured(config.configured);
    } catch {
      onToast('Could not load integration status', 'error');
    }
  }, [setIntegrations, onToast]);

  useEffect(() => {
    if (integrations.length === 0) refresh();
  }, [integrations.length, refresh]);

  const connect = async (provider: IntegrationProvider) => {
    setLoading(provider);
    try {
      const { url, mode } = await getIntegrationConnectUrl(provider);
      if (mode === 'demo') {
        window.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
        onToast(`Complete ${PLATFORM_LABELS[provider]} authorization in the new window`, 'warning');
      }
    } catch {
      onToast(`Failed to connect ${PLATFORM_LABELS[provider]}`, 'error');
    } finally {
      setLoading(null);
    }
  };

  const disconnect = async (provider: IntegrationProvider) => {
    setLoading(provider);
    try {
      await disconnectIntegration(provider);
      await refresh();
      onToast(`${PLATFORM_LABELS[provider]} disconnected`, 'success');
    } catch {
      onToast('Failed to disconnect', 'error');
    } finally {
      setLoading(null);
    }
  };

  const getStatus = (provider: IntegrationProvider): IntegrationStatus | undefined =>
    integrations.find((i) => i.provider === provider);

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500 px-1">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">Integrations</h2>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">
          Connect your accounts to publish campaigns and sync the calendar.
        </p>
      </div>

      <div className="space-y-4">
        {PROVIDERS.filter(({ id }) => enabledProviders.includes(id)).map(({ id, icon: Icon, color, description }) => {
          const status = getStatus(id);
          const connected = status?.connected ?? false;
          const isLoading = loading === id;

          return (
            <div
              key={id}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className={`p-3 sm:p-4 rounded-xl shrink-0 ${color}`}>
                <Icon size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900">{PLATFORM_LABELS[id]}</h3>
                  {connected ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                      <CheckCircle size={12} />
                      Connected {status?.mode === 'demo' ? '(demo)' : '(live)'}
                    </span>
                  ) : configured[id] ? (
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      Ready to connect
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                      Not connected
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">{description}</p>
                {status?.accountName && connected && (
                  <p className="text-xs text-slate-400 mt-1">{status.accountName}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                {connected ? (
                  <button
                    type="button"
                    onClick={() => disconnect(id)}
                    disabled={isLoading}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Unplug size={16} />}
                    Disconnect
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => connect(id)}
                    disabled={isLoading}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-fuchsia-600 rounded-xl transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ExternalLink size={16} />
                    )}
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 text-center px-2">
        Only integrations listed in server <code className="text-slate-500">ENABLED_INTEGRATIONS</code> are shown.
        Add keys in <code className="text-slate-500">server/.env</code> for real OAuth; without keys, demo mode is used.
      </p>
    </div>
  );
}
