import { useMemo, useState } from 'react';
import { AlertTriangle, Calendar, FlaskConical, Loader2, Send, X } from 'lucide-react';
import {
  CHANNEL_INTEGRATION_KEY,
  CHANNEL_TO_PLATFORM,
} from '../../lib/agencyTypes';
import type { Campaign, IntegrationProvider } from '../../lib/agencyTypes';
import { useAppStore } from '../../lib/store';

const DEMO_ONLY_PROVIDERS = new Set<IntegrationProvider>(['linkedin', 'x']);

interface PublishCampaignModalProps {
  campaign: Campaign;
  onClose: () => void;
  onPublish: (payload: {
    copy: string;
    scheduledAt?: string;
    platforms?: string[];
    assetId?: string;
  }) => Promise<void>;
}

function integrationKeyForChannel(channel: string): IntegrationProvider | 'meta' {
  return (CHANNEL_INTEGRATION_KEY[channel] ||
    CHANNEL_TO_PLATFORM[channel] ||
    channel.toLowerCase()) as IntegrationProvider | 'meta';
}

export function PublishCampaignModal({ campaign, onClose, onPublish }: PublishCampaignModalProps) {
  const integrations = useAppStore((s) => s.integrations);
  const assets = useAppStore((s) => s.assets);
  const [copy, setCopy] = useState(
    campaign.copy || `🚀 ${campaign.name}\n\nObjective: ${campaign.objective}\n\n#Agency360 #Marketing`,
  );
  const [schedule, setSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [assetId, setAssetId] = useState('');
  const [publishing, setPublishing] = useState(false);

  const platforms = campaign.channels.map((c) => CHANNEL_TO_PLATFORM[c] || c.toLowerCase());
  const needsImage = platforms.includes('instagram');
  const assetsWithMedia = assets.filter((a) => a.publicUrl || a.url);

  const publishContext = useMemo(() => {
    const keys = [...new Set(campaign.channels.map(integrationKeyForChannel))];
    const related = integrations.filter((i) => keys.includes(i.provider as IntegrationProvider));
    const demoRelated = related.filter(
      (i) => i.connected && i.mode === 'demo' && DEMO_ONLY_PROVIDERS.has(i.provider),
    );
    const hasDemo = demoRelated.length > 0;
    const missing = keys.filter(
      (k) => !related.some((i) => i.provider === k && i.connected),
    );
    const googleStatus = integrations.find((i) => i.provider === 'google');

    return { hasDemo, missing, googleStatus };
  }, [campaign.channels, integrations]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await onPublish({
        copy,
        platforms,
        assetId: assetId || undefined,
        scheduledAt: schedule && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });
      onClose();
    } finally {
      setPublishing(false);
    }
  };

  const minDatetime = new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        <div className="flex justify-between items-start mb-6 gap-4">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-black text-slate-900">Publish campaign</h3>
            <p className="text-sm text-slate-500 mt-1 truncate">{campaign.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 shrink-0"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {publishContext.missing.length > 0 && (
            <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <p>
                Not connected: {publishContext.missing.join(', ')}. Connect them in Integrations
                first or those channels will fail.
              </p>
            </div>
          )}

          {publishContext.hasDemo && (
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <FlaskConical size={18} className="shrink-0 mt-0.5" />
              <p>LinkedIn y X publicarán en modo de prueba.</p>
            </div>
          )}

          {needsImage && !assetId && (
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <p>Instagram requiere un asset con imagen (súbelo en Asset Studio).</p>
            </div>
          )}

          {schedule && !publishContext.googleStatus?.connected && (
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <Calendar size={18} className="shrink-0 mt-0.5" />
              <p>Conecta tu calendario para programar publicaciones.</p>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Channels
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {campaign.channels.map((ch) => (
                <span
                  key={ch}
                  className="px-3 py-1 bg-fuchsia-50 text-fuchsia-700 text-xs font-bold rounded-full"
                >
                  {ch}
                </span>
              ))}
            </div>
          </div>

          {assetsWithMedia.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Creative asset {needsImage ? '(required for Instagram)' : '(optional)'}
              </label>
              <select
                value={assetId}
                onChange={(e) => {
                  setAssetId(e.target.value);
                  const asset = assetsWithMedia.find((a) => a.id === e.target.value);
                  if (asset?.copy && !campaign.copy) {
                    setCopy(asset.copy);
                  }
                }}
                className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none"
              >
                <option value="">— Sin asset —</option>
                {assetsWithMedia.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.ratio})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Post copy
            </label>
            <textarea
              value={copy}
              onChange={(e) => setCopy(e.target.value)}
              rows={5}
              className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none resize-none"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={schedule}
              onChange={(e) => setSchedule(e.target.checked)}
              className="w-4 h-4 rounded text-fuchsia-600"
            />
            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Calendar size={16} />
              Schedule post
            </span>
          </label>

          {schedule && (
            <input
              type="datetime-local"
              min={minDatetime}
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none"
            />
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={
              publishing ||
              !copy.trim() ||
              (schedule && !scheduledAt) ||
              (needsImage && !assetId)
            }
            className="flex-1 py-3 font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-700 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {publishing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            {schedule ? 'Programar' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  );
}
