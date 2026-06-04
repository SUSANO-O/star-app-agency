import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import AuthGuard from '../components/AuthGuard';
import { AppLogo } from '../components/AppLogo';
import {
  DigitalSignatureModule,
  DEMO_CAMPAIGN_ID,
  DEMO_CAMPAIGN_NAME,
} from '../features/digital-signature';
import { useAppStore } from '../lib/store';
export default function ContractDemoPage() {
  const updateCampaignContract = useAppStore((s) => s.updateCampaignContract);
  const getOrCreate = useAppStore((s) => s.getOrCreateCampaignContract);

  useEffect(() => {
    const existing = useAppStore.getState().campaignContracts[DEMO_CAMPAIGN_ID];
    if (existing) return;

    getOrCreate(DEMO_CAMPAIGN_ID, DEMO_CAMPAIGN_NAME);
    updateCampaignContract(DEMO_CAMPAIGN_ID, {
      signerName: 'Maria Garcia (Demo)',
      entityName: 'Demo Client LLC',
      documentTitle: 'Confidentiality Agreement — Demo mode',
      documentNumber: 'DEMO-4920-B',
    });
  }, [getOrCreate, updateCampaignContract]);

  return (
    <AuthGuard requireAuth>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-fuchsia-50/40">
        <header className="border-b border-slate-100 bg-white/90 px-4 py-4 sm:px-6 sm:py-5 backdrop-blur-md md:px-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <AppLogo size="sm" showText />
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200 sm:flex">
                <FlaskConical className="h-3.5 w-3.5" />
                Demo mode
              </span>
              <Link
                to="/"
                className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 sm:px-4 text-xs sm:text-sm font-bold text-slate-700 transition-colors hover:bg-fuchsia-50 hover:text-fuchsia-700"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to dashboard</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8 md:px-8 md:py-10">
          <div className="mb-6 sm:mb-8 text-center md:text-left">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              Digital signature — <span className="text-fuchsia-600">free trial</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm sm:text-base text-slate-500 mx-auto md:mx-0">
              Edit title, clauses, parties, and signature without affecting real campaigns. Changes
              are saved only under the demo identifier in your browser.
            </p>
          </div>

          <DigitalSignatureModule
            mode="demo"
            campaignId={DEMO_CAMPAIGN_ID}
            campaignName={DEMO_CAMPAIGN_NAME}
          />
        </main>
      </div>
    </AuthGuard>
  );
}
