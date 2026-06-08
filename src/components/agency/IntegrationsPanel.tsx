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
    description: 'Publica en X (Twitter).',
  },
];

function getDisconnectedBadge(connectMode: IntegrationConnectMode) {
  switch (connectMode) {
    case 'oauth':
      return {
        label: 'Disponible',
        className: 'text-blue-600 bg-blue-50',
        hint: '',
      };
    case 'demo':
      return {
        label: 'Disponible',
        className: 'text-amber-700 bg-amber-50',
        hint: '',
      };
    case 'unconfigured':
      return {
        label: 'No disponible',
        className: 'text-slate-400 bg-slate-100',
        hint: '',
      };
    case 'coming_soon':
      return {
        label: 'Próximamente',
        className: 'text-violet-700 bg-violet-50',
        hint: '',
      };
    default:
      return {
        label: 'No disponible',
        className: 'text-slate-400 bg-slate-100',
        hint: '',
      };
  }
}

function getConnectedBadge(mode: IntegrationStatus['mode']) {
  if (mode === 'demo') {
    return {
      label: 'Conectado',
      className: 'text-amber-700 bg-amber-50',
      hint: '',
    };
  }
  return {
    label: 'Conectado',
    className: 'text-emerald-700 bg-emerald-50',
    hint: '',
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
  const refresh = useCallback(async () => {
    try {
      const [status, config] = await Promise.all([
        fetchIntegrationsStatus(),
        fetchIntegrationsConfig(),
      ]);
      setIntegrations(status);
      setEnabledProviders(config.enabled);
      setProviderConfig(config.providers);
    } catch {
      onToast('Could not load integration status', 'error');
    }
  }, [setIntegrations, onToast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'agency-integration-connected') {
        refresh();
        onToast(`${PLATFORM_LABELS[event.data.provider as IntegrationProvider] ?? 'Integración'} conectada`, 'success');
      }
    };
    const onFocus = () => refresh();

    window.addEventListener('message', onMessage);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh, onToast]);

  const connect = async (provider: IntegrationProvider) => {
    const connectMode = providerConfig[provider]?.connectMode;
    if (connectMode === 'unconfigured' || connectMode === 'coming_soon') {
      onToast(`${PLATFORM_LABELS[provider]} no está disponible por ahora`, 'warning');
      return;
    }

    setLoading(provider);
    try {
      const { url, mode } = await getIntegrationConnectUrl(provider);
      if (mode === 'demo') {
        window.location.href = url;
      } else {
        const popup = window.open(
          url,
          'agency_oauth',
          'width=520,height=720,scrollbars=yes,resizable=yes',
        );
        if (!popup) {
          onToast('Permite ventanas emergentes del navegador para conectar con OAuth', 'error');
          return;
        }
        onToast(`Completa la autorización de ${PLATFORM_LABELS[provider]} en la ventana emergente`, 'warning');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      const detail = axiosErr.response?.data?.error;
      if (!axiosErr.response) {
        onToast('El servidor API no responde — ejecuta npm run dev:all', 'error');
      } else {
        onToast(detail || `No se pudo conectar ${PLATFORM_LABELS[provider]}`, 'error');
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

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500 px-1">
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
            const isUnconfigured = connectMode === 'unconfigured';

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
                      disabled={isLoading || isComingSoon || isUnconfigured}
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
                      {isComingSoon || isUnconfigured ? 'No disponible' : 'Conectar'}
                    </button>
                  )}
                </div>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}
