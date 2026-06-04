import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import logoAgency from '../../img/logo_agency.png';
import type { CampaignContractData } from '../../lib/contractTypes';

interface LegalDocumentPreviewProps {
  contract: CampaignContractData;
  signatureDataUrl?: string;
  showSeal: boolean;
  sealDate?: string;
}

export function LegalDocumentPreview({
  contract,
  signatureDataUrl,
  showSeal,
  sealDate,
}: LegalDocumentPreviewProps) {
  const issuedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isSealed = contract.status === 'sealed' && !!signatureDataUrl;

  return (
    <div className="ds-paper-texture flex h-full min-h-[400px] sm:min-h-[560px] w-full max-w-2xl flex-col overflow-hidden rounded-lg">
      <div className="relative z-10 flex h-full flex-col pl-8 pr-4 pb-8 pt-8 sm:pl-16 md:pl-24 md:pr-12 md:pb-10 md:pt-12">
        <header className="mb-6 sm:mb-8 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-4 sm:pb-6">
          <div className="min-w-0 flex-1 sm:pr-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-fuchsia-600">
              {contract.campaignName}
            </p>
            <h1 className="font-doc-title text-lg sm:text-xl font-bold leading-tight text-slate-900 md:text-2xl">
              {contract.documentTitle || 'Document'}
            </h1>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Ref. {contract.documentNumber}
            </p>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <img
              src={logoAgency}
              alt="Agency"
              className="sm:ml-auto mb-2 h-10 w-10 sm:h-12 sm:w-12 rounded-xl object-contain shadow-sm ring-1 ring-slate-100"
            />
            <p className="text-[10px] font-mono text-slate-500">
              Issued: <span className="font-bold text-slate-800">{issuedDate}</span>
            </p>
          </div>
        </header>

        <div className="ds-no-scrollbar font-doc-title flex-1 space-y-5 overflow-y-auto pr-2 text-sm leading-loose text-slate-700">
          <p>{contract.introParagraph}</p>

          <div className="border-l-2 border-fuchsia-300 bg-fuchsia-50/50 p-4 text-xs">
            <p className="mb-2">
              <span className="font-bold uppercase text-slate-500">{contract.partyALabel}:</span>{' '}
              <span className="text-sm font-bold text-slate-900">
                {contract.signerName || '—'}
              </span>
            </p>
            <p>
              <span className="font-bold uppercase text-slate-500">{contract.partyBLabel}:</span>{' '}
              <span className="text-sm font-bold text-slate-900">
                {contract.entityName || '—'}
              </span>
            </p>
          </div>

          {contract.clauses.map((clause, index) => (
            <p key={clause.id}>
              <strong>
                {clause.title || `Clause ${index + 1}`}.
              </strong>{' '}
              {clause.body}
            </p>
          ))}
        </div>

        <footer className="relative mt-6 grid shrink-0 grid-cols-1 sm:grid-cols-2 gap-6 pt-6 sm:pt-8 md:gap-8">
          <div>
            <p className="mb-4 sm:mb-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Party A signature
            </p>
            <div className="relative flex h-16 items-end justify-center border-b border-slate-400 pb-1">
              {signatureDataUrl && (
                <img
                  src={signatureDataUrl}
                  alt="Signature"
                  className="h-16 w-full object-contain contrast-125 drop-shadow-sm"
                />
              )}
            </div>
            <p className="mt-2 truncate text-sm font-bold text-slate-900">
              {contract.signerName || '—'}
            </p>
            <div className="mt-1 flex items-center gap-1">
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  isSealed ? 'bg-emerald-500' : 'bg-rose-500',
                )}
              />
              <p className="text-[9px] font-mono uppercase text-slate-500">
                {isSealed ? 'Digitally signed' : 'Signature pending'}
              </p>
            </div>
          </div>

          <div className={cn(!contract.partyBPreApproved && 'opacity-70')}>
            <p className="mb-4 sm:mb-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Party B signature
            </p>
            <div
              className={cn(
                'relative flex h-16 items-end justify-center border-b border-slate-400 pb-1',
                contract.partyBPreApproved && 'opacity-90',
              )}
            >
              <span className="font-signature -rotate-3 text-2xl text-slate-800 md:text-3xl">
                {contract.partyBSignatureText || '—'}
              </span>
            </div>
            <p className="mt-2 truncate text-sm font-bold text-slate-900">
              {contract.entityName || '—'}
            </p>
            <div className="mt-1 flex items-center gap-1">
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  contract.partyBPreApproved ? 'bg-emerald-500' : 'bg-amber-500',
                )}
              />
              <p className="text-[9px] font-mono uppercase text-slate-500">
                {contract.partyBPreApproved ? 'Pre-approved' : 'Pending'}
              </p>
            </div>
          </div>

          <div
            className={cn(
              'pointer-events-none absolute right-2 sm:right-0 top-0 origin-center -translate-y-1/2 transform',
              showSeal ? 'ds-stamp-animation opacity-100' : 'opacity-0',
            )}
          >
            <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full border-[3px] border-fuchsia-600 bg-white/90 backdrop-blur-sm md:h-32 md:w-32">
              <div className="absolute inset-2 rounded-full border border-dashed border-fuchsia-500/50" />
              <div className="text-center">
                <CheckCircle2 className="mx-auto mb-1 h-6 w-6 sm:h-7 sm:w-7 text-fuchsia-600" />
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-800">
                  Verified
                </h2>
                <p className="mt-0.5 text-[6px] font-mono text-fuchsia-600">
                  {sealDate || issuedDate}
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
