import { useState } from 'react';
import { Calendar, Loader2, Send, X } from 'lucide-react';
import { CHANNEL_TO_PLATFORM } from '../../lib/agencyTypes';
import type { Campaign } from '../../lib/agencyTypes';

interface PublishCampaignModalProps {
  campaign: Campaign;
  onClose: () => void;
  onPublish: (payload: {
    copy: string;
    scheduledAt?: string;
    platforms?: string[];
  }) => Promise<void>;
}

export function PublishCampaignModal({ campaign, onClose, onPublish }: PublishCampaignModalProps) {
  const [copy, setCopy] = useState(
    campaign.copy || `🚀 ${campaign.name}\n\nObjetivo: ${campaign.objective}\n\n#Agency360 #Marketing`,
  );
  const [schedule, setSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [publishing, setPublishing] = useState(false);

  const platforms = campaign.channels.map((c) => CHANNEL_TO_PLATFORM[c] || c.toLowerCase());

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await onPublish({
        copy,
        platforms,
        scheduledAt: schedule && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });
      onClose();
    } finally {
      setPublishing(false);
    }
  };

  const minDatetime = new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900">Publicar campaña</h3>
            <p className="text-sm text-slate-500 mt-1">{campaign.name}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Canales
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

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Texto de la publicación
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
              Programar publicación
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

        <div className="flex gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing || !copy.trim() || (schedule && !scheduledAt)}
            className="flex-1 py-3 font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-700 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {publishing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            {schedule ? 'Programar' : 'Publicar ahora'}
          </button>
        </div>
      </div>
    </div>
  );
}
