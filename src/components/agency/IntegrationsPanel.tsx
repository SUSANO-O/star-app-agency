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
    description: 'Sincroniza publicaciones y eventos de campaña con Google Calendar.',
  },
  {
    id: 'meta',
    icon: Instagram,
    color: 'text-fuchsia-600 bg-fuchsia-50',
    description: 'Publica en Instagram y Facebook Page vinculada.',
  },
  {
    id: 'linkedin',
    icon: Linkedin,
    color: 'text-sky-700 bg-sky-50',
    description: 'Comparte campañas y contenido en LinkedIn.',
  },
  {
    id: 'x',
    icon: Twitter,
    color: 'text-slate-800 bg-slate-100',
    description: 'Publica en X (Twitter). Requiere API de desarrollador.',
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
      onToast('No se pudo cargar el estado de integraciones', 'error');
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
        onToast(`Completa la autorización de ${PLATFORM_LABELS[provider]} en la nueva ventana`, 'warning');
      }
    } catch {
      onToast(`Error al conectar ${PLATFORM_LABELS[provider]}`, 'error');
    } finally {
      setLoading(null);
    }
  };

  const disconnect = async (provider: IntegrationProvider) => {
    setLoading(provider);
    try {
      await disconnectIntegration(provider);
      await refresh();
      onToast(`${PLATFORM_LABELS[provider]} desconectado`, 'success');
    } catch {
      onToast('Error al desconectar', 'error');
    } finally {
      setLoading(null);
    }
  };

  const getStatus = (provider: IntegrationProvider): IntegrationStatus | undefined =>
    integrations.find((i) => i.provider === provider);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Integraciones</h2>
        <p className="text-slate-500 mt-2">
          Conecta tus cuentas para publicar campañas y sincronizar el calendario.
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
              className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className={`p-4 rounded-xl shrink-0 ${color}`}>
                <Icon size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900">{PLATFORM_LABELS[id]}</h3>
                  {connected ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                      <CheckCircle size={12} />
                      Conectado {status?.mode === 'demo' ? '(demo)' : '(live)'}
                    </span>
                  ) : configured[id] ? (
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      Listo para conectar
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                      No conectado
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">{description}</p>
                {status?.accountName && connected && (
                  <p className="text-xs text-slate-400 mt-1">{status.accountName}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                {connected ? (
                  <button
                    type="button"
                    onClick={() => disconnect(id)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Unplug size={16} />}
                    Desconectar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => connect(id)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-fuchsia-600 rounded-xl transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ExternalLink size={16} />
                    )}
                    Conectar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 text-center">
        Solo se muestran las integraciones definidas en <code className="text-slate-500">ENABLED_INTEGRATIONS</code> del servidor.
        Rellena las claves en <code className="text-slate-500">server/.env</code> para OAuth real; sin claves, funciona en modo demo.
      </p>
    </div>
  );
}
