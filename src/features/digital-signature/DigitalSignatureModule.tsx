import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Lock,
  PenTool,
  RotateCcw,
  ShieldCheck,
  PenLine,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/useAuth';
import { useAppStore } from '../../lib/store';
import { ContractEditorFields } from './ContractEditorFields';
import { LegalDocumentPreview } from './LegalDocumentPreview';
import { useSignaturePad } from './useSignaturePad';
import type { DigitalSignatureModuleProps } from './types';
import './digital-signature.css';

export function DigitalSignatureModule({
  mode,
  campaignId,
  campaignName,
  onSealed,
  onClose,
  className,
}: DigitalSignatureModuleProps) {
  const { user } = useAuth();
  const getOrCreateCampaignContract = useAppStore((s) => s.getOrCreateCampaignContract);
  const updateCampaignContract = useAppStore((s) => s.updateCampaignContract);
  const sealCampaignContract = useAppStore((s) => s.sealCampaignContract);
  const resetCampaignContract = useAppStore((s) => s.resetCampaignContract);
  const contract = useAppStore((s) => s.campaignContracts[campaignId]);

  useEffect(() => {
    getOrCreateCampaignContract(campaignId, campaignName);
  }, [campaignId, campaignName, getOrCreateCampaignContract]);

  const isSealed = contract?.status === 'sealed';
  const pad = useSignaturePad(isSealed);
  const [showSeal, setShowSeal] = useState(isSealed);
  const [sealBtnDone, setSealBtnDone] = useState(isSealed);
  const [shakePad, setShakePad] = useState(false);
  const [validationHint, setValidationHint] = useState<string | null>(null);

  const readOnly = isSealed;

  useEffect(() => {
    if (contract?.status === 'sealed') {
      setShowSeal(true);
      setSealBtnDone(true);
      pad.setShowPlaceholder(true);
    }
  }, [contract?.status, pad]);

  useEffect(() => {
    if (contract && !contract.signerName && user?.username) {
      updateCampaignContract(campaignId, { signerName: user.username });
    }
  }, [campaignId, contract, user?.username, updateCampaignContract]);

  const handleContractChange = useCallback(
    (updates: Parameters<typeof updateCampaignContract>[1]) => {
      if (readOnly) return;
      updateCampaignContract(campaignId, updates);
    },
    [campaignId, readOnly, updateCampaignContract],
  );

  const previewSignature = contract?.signatureDataUrl;
  const sealDateLabel = useMemo(() => {
    if (!contract?.sealedAt) return undefined;
    return new Date(contract.sealedAt).toLocaleDateString('es-ES');
  }, [contract?.sealedAt]);

  if (!contract) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-3xl bg-white p-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-fuchsia-200 border-t-fuchsia-600" />
      </div>
    );
  }

  const handleSeal = () => {
    setValidationHint(null);

    if (!contract.signerName.trim() || !contract.entityName.trim()) {
      setValidationHint('Complete representante legal y entidad cliente antes de sellar.');
      return;
    }

    if (!pad.hasSignature) {
      setShakePad(true);
      setValidationHint('Dibuje su firma en el área indicada.');
      pad.containerRef.current?.classList.add('ring-2', 'ring-rose-400');
      window.setTimeout(() => {
        setShakePad(false);
        pad.containerRef.current?.classList.remove('ring-2', 'ring-rose-400');
      }, 800);
      return;
    }

    const dataUrl = pad.exportPng();
    sealCampaignContract(campaignId, {
      signatureDataUrl: dataUrl,
      signerName: contract.signerName.trim(),
      entityName: contract.entityName.trim(),
    });

    setShowSeal(true);
    setSealBtnDone(true);
    pad.lockAfterCapture();
    onSealed?.();
  };

  const handleResetContract = () => {
    resetCampaignContract(campaignId, campaignName);
    pad.clear();
    setShowSeal(false);
    setSealBtnDone(false);
  };

  return (
    <div
      className={cn(
        'flex w-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white ds-premium-shadow lg:flex-row lg:max-h-[min(90vh,920px)]',
        className,
      )}
    >
      {/* Panel control — scroll independiente; editor siempre visible */}
      <div className="relative z-10 flex min-h-0 flex-col border-b border-slate-100 bg-slate-50/80 lg:w-[45%] lg:border-b-0 lg:border-r lg:max-h-[min(90vh,920px)]">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 md:p-8">
        <div className="mb-5 flex shrink-0 items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center justify-center rounded-xl bg-fuchsia-100 p-3 text-fuchsia-600">
              <PenTool className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 md:text-2xl">
              {mode === 'demo' ? 'Demo — Contrato editable' : 'Contrato de campaña'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Personalice el documento, dibuje la firma y selle el acuerdo vinculado a{' '}
              <span className="font-semibold text-fuchsia-600">{campaignName}</span>.
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <section
          className="mb-6 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          aria-label="Editor del contrato"
        >
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
              Editor del contrato
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Los cambios se reflejan al instante en la vista previa →
            </p>
          </div>
          <div className="max-h-[min(50vh,480px)] overflow-y-auto p-4 md:max-h-[min(45vh,520px)]">
            <ContractEditorFields
              contract={contract}
              onChange={handleContractChange}
              readOnly={readOnly}
            />
          </div>
        </section>

        {/* Área de firma — altura fija para no aplastar el editor */}
        <div className="mb-4 shrink-0">
          <div className="mb-3 flex items-center justify-between">
            <label className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-600">
              <PenLine className="mr-2 h-4 w-4 text-slate-400" />
              Área de firma
            </label>
            <button
              type="button"
              onClick={() => pad.clear()}
              disabled={readOnly}
              className="flex items-center text-xs font-semibold text-slate-400 hover:text-rose-500 disabled:opacity-40"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Reiniciar
            </button>
          </div>
          <div
            ref={pad.containerRef}
            className={cn(
              'relative h-44 overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-white shadow-inner transition-all focus-within:border-fuchsia-400',
              shakePad && 'border-rose-400',
            )}
          >
            <div
              className={cn(
                'pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-300 transition-opacity',
                pad.showPlaceholder ? 'opacity-100' : 'opacity-0',
              )}
            >
              {pad.padLocked || readOnly ? (
                <>
                  <Lock className="mb-2 h-8 w-8 opacity-40" />
                  <span className="text-sm font-medium">Firma capturada</span>
                </>
              ) : (
                <>
                  <PenLine className="mb-2 h-10 w-10 opacity-50" />
                  <span className="text-sm font-medium">Dibuje su firma aquí</span>
                </>
              )}
            </div>
            <canvas
              ref={pad.canvasRef}
              className={cn(
                'absolute inset-0 h-full w-full touch-none',
                readOnly || pad.padLocked ? 'cursor-not-allowed' : 'cursor-crosshair',
              )}
              onMouseDown={pad.startDrawing}
              onMouseMove={pad.draw}
              onMouseUp={pad.stopDrawing}
              onMouseLeave={pad.stopDrawing}
              onTouchStart={pad.startDrawing}
              onTouchMove={pad.draw}
              onTouchEnd={pad.stopDrawing}
            />
            <div className="pointer-events-none absolute bottom-4 left-8 right-8 border-b-2 border-slate-100" />
          </div>
        </div>

        <div className="mt-2 shrink-0 space-y-3 pb-2">
          {!readOnly ? (
            <>
              {validationHint && (
                <p className="text-center text-xs font-semibold text-rose-500">
                  {validationHint}
                </p>
              )}
              <button
                type="button"
                onClick={handleSeal}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold shadow-lg transition-all',
                  sealBtnDone
                    ? 'cursor-default bg-emerald-600 text-white'
                    : 'bg-slate-900 text-white hover:bg-fuchsia-600 hover:shadow-xl',
                )}
              >
                {sealBtnDone ? (
                  <>
                    <Check className="h-5 w-5" />
                    Documento sellado
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5 text-slate-400" />
                    Sellar y firmar documento
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleResetContract}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white py-4 text-sm font-bold text-slate-700 transition-all hover:border-fuchsia-300 hover:bg-fuchsia-50"
            >
              <RotateCcw className="h-5 w-5" />
              Editar de nuevo (borrador)
            </button>
          )}

          <p className="flex items-center justify-center gap-1 text-center text-[10px] text-slate-400">
            <Lock className="h-3 w-3" />
            Vista previa en tiempo real — almacenamiento local de demostración
          </p>
        </div>
        </div>
      </div>

      {/* Preview */}
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-slate-100 to-fuchsia-50/30 p-4 md:p-8 lg:overflow-y-auto">
        <LegalDocumentPreview
          contract={contract}
          signatureDataUrl={previewSignature}
          showSeal={showSeal}
          sealDate={sealDateLabel}
        />
      </div>
    </div>
  );
}
