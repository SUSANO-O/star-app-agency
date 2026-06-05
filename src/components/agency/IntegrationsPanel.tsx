import { useCallback, useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  FlaskConical,
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
import type {
  IntegrationConnectMode,
  IntegrationProvider,
  IntegrationProviderConfig,
  IntegrationsConfig,
  IntegrationStatus,
} from '../../lib/agencyTypes';
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

const ENV_BANNER: Record<IntegrationsConfig['environment'], { label: string; className: string }> =
  {
    demo: {
      label: 'Demo environment — integrations without OAuth keys use simulated connections.',
      className: 'bg-amber-50 border-amber-200 text-amber-800',
    },
    mixed: {
      label: 'Mixed environment — some integrations use real OAuth, others are demo or coming soon.',
      className: 'bg-blue-50 border-blue-200 text-blue-800',
    },
    production: {
      label: 'Production environment — OAuth keys configured for all enabled integrations.',
      className: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    },
  };

function getDisconnectedBadge(connectMode: IntegrationConnectMode) {
  switch (connectMode) {
    case 'oauth':
      return {
        label: 'OAuth ready',
        className: 'text-blue-600 bg-blue-50',
        hint: 'Real authorization window will open (Google/Meta account).',
      };
    case 'demo':
      return {
        label: 'Demo mode',
        className: 'text-amber-700 bg-amber-50',
        hint: 'No OAuth keys on server — connection is simulated for testing.',
      };
    case 'coming_soon':
      return {
        label: 'Coming soon',
        className: 'text-violet-700 bg-violet-50',
        hint: 'This integration is not available yet.',
      };
    default:
      return {
        label: 'Unavailable',
        className: 'text-slate-400 bg-slate-100',
        hint: '',
      };
  }
}

function getConnectedBadge(mode: IntegrationStatus['mode']) {
  if (mode === 'demo') {
    return {
      label: 'Connected · simulation',
      className: 'text-amber-700 bg-amber-50',
      hint: 'Posts and calendar sync are not sent to the real API.',
    };
  }
  return {
    label: 'Connected · OAuth',
    className: 'text-emerald-700 bg-emerald-50',
    hint: 'Real authorization completed. API calls use live tokens.',
  };
}

interface IntegrationsPanelProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'warning') => void;
}

export function IntegrationsPanel({ onToast }: IntegrationsPanelProps) {
  const integrations = useAppStore((s) => s.integrations);
  const setIntegrations = useAppStore((s) => s.setIntegrations);
  const [loading, setLoading] = useState<string | null>(null);
  const [enabledProviders, setEnabledProviders] = useState<string[]>(['google', 'linkedin']);
  const [providerConfig, setProviderConfig] = useState<Record<string, IntegrationProviderConfig>>(
    {},
  );
  const [environment, setEnvironment] = useState<IntegrationsConfig['environment']>('mixed');

  const refresh = useCallback(async () => {
    try {
      const [status, config] = await Promise.all([
        fetchIntegrationsStatus(),
        fetchIntegrationsConfig(),
      ]);
      setIntegrations(status);
      setEnabledProviders(config.enabled);
      setProviderConfig(config.providers);
      setEnvironment(config.environment);
    } catch {
      onToast('Could not load integration status', 'error');
    }
  }, [setIntegrations, onToast]);

  useEffect(() => {
    if (integrations.length === 0) refresh();
  }, [integrations.length, refresh]);

  const connect = async (provider: IntegrationProvider) => {
    const connectMode = providerConfig[provider]?.connectMode;
    if (connectMode === 'coming_soon') {
      onToast(`${PLATFORM_LABELS[provider]} is coming soon`, 'warning');
      return;
    }

    setLoading(provider);
    try {
      const { url, mode } = await getIntegrationConnectUrl(provider);
      if (mode === 'demo') {
        onToast(
          `Connecting ${PLATFORM_LABELS[provider]} in demo mode (simulated — no real API)`,
          'warning',
        );
        window.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
        onToast(
          `Complete ${PLATFORM_LABELS[provider]} OAuth in the new window (real authorization)`,
          'warning',
        );
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { mode?: string } } };
      if (axiosErr.response?.data?.mode === 'coming_soon') {
        onToast(`${PLATFORM_LABELS[provider]} is coming soon`, 'warning');
      } else {
        onToast(`Failed to connect ${PLATFORM_LABELS[provider]}`, 'error');
      }
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

  const envBanner = ENV_BANNER[environment];

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500 px-1">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">
          Integrations
        </h2>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">
          Connect your accounts to publish campaigns and sync the calendar.
        </p>
      </div>

      <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${envBanner.className}`}>
        {envBanner.label}
      </div>

      <div className="space-y-4">
        {PROVIDERS.filter(({ id }) => enabledProviders.includes(id)).map(
          ({ id, icon: Icon, color, description }) => {
            const status = getStatus(id);
            const connected = status?.connected ?? false;
            const isLoading = loading === id;
            const connectMode = providerConfig[id]?.connectMode ?? 'demo';
            const badge = connected
              ? getConnectedBadge(status?.mode ?? 'disconnected')
              : getDisconnectedBadge(connectMode);
            const isComingSoon = connectMode === 'coming_soon';

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
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${badge.className}`}
                    >
                      {connected ? (
                        status?.mode === 'demo' ? (
                          <FlaskConical size={12} />
                        ) : (
                          <CheckCircle size={12} />
                        )
                      ) : isComingSoon ? (
                        <Clock size={12} />
                      ) : connectMode === 'oauth' ? (
                        <ExternalLink size={12} />
                      ) : (
                        <FlaskConical size={12} />
                      )}
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{description}</p>
                  <p className="text-xs text-slate-400 mt-1">{badge.hint}</p>
                  {status?.accountName && connected && (
                    <p className="text-xs text-slate-500 mt-1 font-medium">{status.accountName}</p>
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
                      {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Unplug size={16} />
                      )}
                      Disconnect
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => connect(id)}
                      disabled={isLoading || isComingSoon}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-fuchsia-600 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : isComingSoon ? (
                        <Clock size={16} />
                      ) : connectMode === 'demo' ? (
                        <FlaskConical size={16} />
                      ) : (
                        <ExternalLink size={16} />
                      )}
                      {isComingSoon
                        ? 'Coming soon'
                        : connectMode === 'demo'
                          ? 'Connect (demo)'
                          : 'Connect (OAuth)'}
                    </button>
                  )}
                </div>
              </div>
            );
          },
        )}
      </div>

      <p className="text-xs text-slate-400 text-center px-2 leading-relaxed">
        <strong className="text-slate-500">Demo</strong> = simulated connection without OAuth keys.{' '}
        <strong className="text-slate-500">OAuth</strong> = real authorization with keys in{' '}
        <code className="text-slate-500">server/.env</code>.{' '}
        <strong className="text-slate-500">Coming soon</strong> = LinkedIn and X until API keys are
        added. Contract demo at <code className="text-slate-500">/demo/contrato</code> is separate.
      </p>
    </div>
  );
}
