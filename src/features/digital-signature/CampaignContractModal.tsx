import { useEffect } from 'react';
import { DigitalSignatureModule } from './DigitalSignatureModule';

interface CampaignContractModalProps {
  campaignId: string;
  campaignName: string;
  onClose: () => void;
  onSealed?: () => void;
}

export function CampaignContractModal({
  campaignId,
  campaignName,
  onClose,
  onSealed,
}: CampaignContractModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`Contract: ${campaignName}`}
    >
      <div
        className="relative flex h-full max-h-[95vh] w-full max-w-7xl flex-col animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <DigitalSignatureModule
          mode="campaign"
          campaignId={campaignId}
          campaignName={campaignName}
          onClose={onClose}
          onSealed={onSealed}
          className="h-full max-h-[95vh]"
        />
      </div>
      <button
        type="button"
        className="sr-only"
        onClick={onClose}
        aria-label="Close modal"
      />
    </div>
  );
}
