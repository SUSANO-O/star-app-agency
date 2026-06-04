import { useState, useCallback, memo, lazy, Suspense, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Rocket,
  Image as ImageIcon,
  Calendar as CalendarIcon,
  Settings,
  Search,
  Bell,
  BarChart3,
  Users,
  Target,
  TrendingUp,
  CheckCircle,
  X,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Zap,
  LogOut,
  AlertTriangle,
  FileSignature,
  FlaskConical,
  Menu,
} from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import AuthGuard from '../components/AuthGuard';
import { AppLogo } from '../components/AppLogo';
import { useAppStore } from '../lib/store';
import { useAgencySync, useAgencyActions } from '../hooks/useAgencySync';
import { IntegrationsPanel } from '../components/agency/IntegrationsPanel';
import { CalendarView } from '../components/agency/CalendarView';
import { PublishCampaignModal } from '../components/agency/PublishCampaignModal';
import type { Campaign } from '../lib/agencyTypes';

const CampaignContractModal = lazy(
  () => import('../features/digital-signature/CampaignContractModal').then((m) => ({
    default: m.CampaignContractModal,
  })),
);

interface Notification {
  message: string;
  type: 'success' | 'error' | 'warning';
}

interface ConfirmDialog {
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

const OBJECTIVE_OPTIONS = ['Traffic', 'Leads', 'Sales', 'Brand'] as const;
type CampaignObjective = (typeof OBJECTIVE_OPTIONS)[number];

function displayObjective(value: string): string {
  const legacy: Record<string, string> = { 'Tráfico': 'Traffic', Ventas: 'Sales' };
  return legacy[value] ?? value;
}

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [contractModal, setContractModal] = useState<{
    campaignId: string;
    campaignName: string;
  } | null>(null);
  const { user, logout } = useAuth();
  const { apiOnline, syncing, syncError, syncAll } = useAgencySync();
  const integrations = useAppStore((s) => s.integrations);
  const googleConnected = integrations.some((i) => i.provider === 'google' && i.connected);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const setTab = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      setSidebarOpen(false);
      if (tab === 'dashboard') {
        setSearchParams({});
      } else {
        setSearchParams({ tab });
      }
    },
    [setSearchParams],
  );

  // Helper to show notification
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  // Helper to show confirmation dialog
  const showConfirm = useCallback((dialog: ConfirmDialog) => {
    setConfirmDialog(dialog);
  }, []);

  // Notification Component
  const Toast = () => (
    <div className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 max-w-md sm:max-w-none mx-auto sm:mx-0 px-4 sm:px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 transition-all border animate-in slide-in-from-bottom-5 fade-in duration-300 ${
      notification?.type === 'success'
      ? 'bg-white border-emerald-500 text-emerald-600'
      : notification?.type === 'warning'
      ? 'bg-white border-amber-500 text-amber-600'
      : 'bg-white border-rose-500 text-rose-600'
    }`}>
      {notification?.type === 'success' ? (
        <CheckCircle size={20} className="shrink-0" />
      ) : notification?.type === 'warning' ? (
        <AlertTriangle size={20} className="shrink-0" />
      ) : (
        <X size={20} className="shrink-0" />
      )}
      <span className="font-bold">{notification?.message}</span>
      <button
        onClick={() => setNotification(null)}
        className="ml-2 hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );

  // Confirmation Dialog Component
  const ConfirmationDialog = () => {
    if (!confirmDialog) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md mx-4 w-[calc(100%-2rem)] shadow-2xl animate-in zoom-in-95 duration-300">
          <h3 className="text-2xl font-black text-slate-900 mb-3">{confirmDialog.title}</h3>
          <p className="text-slate-600 mb-8">{confirmDialog.message}</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(null);
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {confirmDialog.confirmText || 'Confirm'}
            </button>
            <button
              onClick={() => setConfirmDialog(null)}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {confirmDialog.cancelText || 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleLogout = useCallback(() => {
    showConfirm({
      title: 'Sign out',
      message: 'Are you sure you want to sign out?',
      confirmText: 'Yes, sign out',
      cancelText: 'Cancel',
      onConfirm: () => {
        showToast('Signed out successfully', 'success');
        setTimeout(() => logout(), 500);
      },
    });
  }, [logout, showConfirm, showToast]);

  const userInitials = user?.username 
    ? user.username.substring(0, 2).toUpperCase()
    : 'AS';

  return (
    <AuthGuard requireAuth={true}>
      <div className="flex min-h-screen h-[100dvh] bg-white text-slate-800 font-sans antialiased overflow-hidden">
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <nav
          className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-100 bg-slate-50/95 p-6 sm:p-8 space-y-8 sm:space-y-10 backdrop-blur-md transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:max-w-none lg:translate-x-0 lg:bg-slate-50/30 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between gap-2 px-2">
            <AppLogo size="md" showText />
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-xl p-2 text-slate-400 hover:bg-white hover:text-slate-700 lg:hidden"
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>

          <div className="space-y-2 sm:space-y-3 flex-1 overflow-y-auto">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
              { id: 'campaigns', icon: Rocket, label: 'Campaigns', color: 'text-orange-500', bg: 'bg-orange-50' },
              { id: 'studio', icon: ImageIcon, label: 'Asset Studio', color: 'text-cyan-500', bg: 'bg-cyan-50' },
              { id: 'calendar', icon: CalendarIcon, label: 'Calendar', color: 'text-rose-500', bg: 'bg-rose-50' },
              { id: 'integrations', icon: Settings, label: 'Integrations', color: 'text-violet-600', bg: 'bg-violet-50' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all group ${
                  activeTab === item.id 
                  ? `${item.bg} ${item.color} shadow-sm ring-1 ring-inset ring-slate-200` 
                  : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-md'
                }`}
              >
                <item.icon size={22} className={activeTab === item.id ? item.color : 'text-slate-400 group-hover:text-slate-600'} />
                <span className="font-bold text-[15px]">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-3">
            <Link
              to="/demo/contrato"
              className="w-full flex items-center gap-3 px-5 py-3 text-slate-400 hover:text-fuchsia-600 transition-all font-semibold rounded-xl hover:bg-fuchsia-50 focus:outline-none focus:ring-2 focus:ring-fuchsia-300"
            >
              <FlaskConical size={20} />
              <span>Contract demo</span>
            </Link>
            <button
              onClick={() => syncAll()}
              disabled={syncing}
              className="w-full flex items-center gap-3 px-5 py-3 text-slate-400 hover:text-emerald-600 transition-all font-semibold rounded-xl hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-50"
            >
              <Zap size={20} />
              <span>{syncing ? 'Syncing...' : 'Sync API'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-3 text-slate-400 hover:text-red-600 transition-all font-semibold rounded-xl hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              <LogOut size={20} />
              <span>Sign out</span>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden relative bg-white">
          {/* Header */}
          <header className="sticky top-0 z-30 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 lg:p-10 bg-white/90 backdrop-blur-md border-b border-slate-50 shrink-0">
            <div className="flex items-center gap-3 w-full sm:flex-1 sm:max-w-md lg:max-w-96">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="shrink-0 rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
              <div className="relative flex-1 min-w-0">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                isSearchFocused ? 'text-fuchsia-500' : 'text-slate-300'
              }`} size={20} />
              <input
                type="text"
                placeholder="What are you looking for?"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-fuchsia-500 outline-none transition-all placeholder:text-slate-400 font-medium hover:bg-slate-100"
              />
              </div>
            </div>
            <div className="flex items-center justify-end gap-4 sm:gap-6 shrink-0">
              <button
                onClick={() => showToast('No new notifications', 'warning')}
                className="p-2 text-slate-400 hover:text-fuchsia-600 transition-all relative hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 rounded-lg"
                aria-label="Notifications"
              >
                <Bell size={24} />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              </button>
              <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900 truncate max-w-[120px] sm:max-w-none">{user?.username || 'Admin Start'}</p>
                  <p className="text-xs font-semibold text-cyan-600">Enterprise plan</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-rose-500 shadow-lg shadow-fuchsia-200 flex items-center justify-center text-white font-black text-sm sm:text-base">
                  {userInitials}
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 pb-6 sm:pb-10 pt-4 sm:pt-6">
            {apiOnline === false && syncError && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                <span>{syncError}</span>
                <button type="button" onClick={() => syncAll()} className="text-amber-900 underline text-xs self-start sm:self-auto">
                  Retry
                </button>
              </div>
            )}
            {apiOnline === true && (
              <div className="mb-4 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                API connected — data synced
              </div>
            )}
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'campaigns' && (
              <CampaignLauncher
                showToast={showToast}
                onOpenContract={(campaignId, campaignName) =>
                  setContractModal({ campaignId, campaignName })
                }
              />
            )}
            {activeTab === 'studio' && <AssetStudio showToast={showToast} />}
            {activeTab === 'calendar' && (
              <CalendarView onToast={showToast} googleConnected={googleConnected} />
            )}
            {activeTab === 'integrations' && <IntegrationsPanel onToast={showToast} />}
          </div>

          {notification && <Toast />}
          {confirmDialog && <ConfirmationDialog />}
          {contractModal && (
            <Suspense
              fallback={
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-fuchsia-200 border-t-fuchsia-600" />
                </div>
              }
            >
              <CampaignContractModal
                campaignId={contractModal.campaignId}
                campaignName={contractModal.campaignName}
                onClose={() => setContractModal(null)}
                onSealed={() =>
                  showToast(`Contract sealed: ${contractModal.campaignName}`, 'success')
                }
              />
            </Suspense>
          )}
        </main>
      </div>
    </AuthGuard>
  );
};

/* --- Dashboard Section --- */
const DashboardView = memo(() => {
  const { stats: storeStats, activities } = useAppStore();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const stats = [
    { label: 'Total reach', value: formatNumber(storeStats.reach), trend: storeStats.reachTrend, icon: Users, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
    { label: 'Engagement', value: `${storeStats.engagement}%`, trend: storeStats.engagementTrend, icon: Target, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { label: 'Conversions', value: formatNumber(storeStats.conversions), trend: storeStats.conversionsTrend, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Investment', value: `$${formatNumber(storeStats.investment)}`, trend: storeStats.investmentTrend, icon: BarChart3, color: storeStats.investmentTrend.startsWith('+') ? 'text-orange-500' : 'text-red-500', bg: storeStats.investmentTrend.startsWith('+') ? 'bg-orange-50' : 'bg-red-50' },
  ];

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white border border-slate-100 p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden cursor-pointer hover:-translate-y-1 active:translate-y-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                <stat.icon size={28} />
              </div>
              <span className={`text-xs font-black px-3 py-1 rounded-full transition-all group-hover:scale-110 ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {stat.trend}
              </span>
            </div>
            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest group-hover:text-slate-500 transition-colors">{stat.label}</h3>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 tracking-tight group-hover:scale-105 transition-transform inline-block">{stat.value}</p>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
        <div className="lg:col-span-2 bg-slate-50/50 border border-slate-100 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-10">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Weekly performance</h2>
            <div className="flex gap-2">
              <Zap size={20} className="text-orange-500 fill-orange-500" />
            </div>
          </div>
          <div className="h-48 sm:h-64 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-4">
            {[65, 45, 95, 55, 80, 60, 85].map((val, i) => (
              <div key={i} className="w-full space-y-4">
                <div className="relative w-full bg-white rounded-2xl overflow-hidden h-full border border-slate-100">
                  <div 
                    className="absolute bottom-0 w-full bg-gradient-to-t from-fuchsia-600 to-orange-500 rounded-t-xl transition-all duration-1000" 
                    style={{ height: `${val}%` }}
                  ></div>
                </div>
                <span className="block text-center text-[10px] font-black text-slate-400 uppercase">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-10 shadow-xl shadow-slate-100">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-6 sm:mb-8">Activity feed</h2>
          <div className="space-y-6">
            {activities.length > 0 ? (
              activities.slice(0, 5).map((item, i) => (
                <div key={item.id} className="flex gap-5 items-center p-4 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer group animate-in fade-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className={`w-3 h-3 rounded-full ${item.color} shrink-0 shadow-lg`}></div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{item.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{item.type} • {item.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">No recent activity</p>
                <p className="text-slate-300 text-xs mt-2">Create your first campaign or asset</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

DashboardView.displayName = 'DashboardView';

/* --- Campaign Launcher Section --- */
interface CampaignLauncherProps {
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
  onOpenContract: (campaignId: string, campaignName: string) => void;
}

const CampaignLauncher = memo(({ showToast, onOpenContract }: CampaignLauncherProps) => {
  const [name, setName] = useState('');
  const [selectedObjective, setSelectedObjective] = useState<CampaignObjective | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [publishTarget, setPublishTarget] = useState<Campaign | null>(null);
  const [launching, setLaunching] = useState(false);

  const { campaigns, campaignContracts, socialPosts } = useAppStore();
  const { createCampaignRemote, updateCampaignRemote, deleteCampaignRemote, publishCampaignRemote } =
    useAgencyActions();

  const channels = [
    { name: 'Instagram', icon: Instagram },
    { name: 'Facebook', icon: Facebook },
    { name: 'Twitter', icon: Twitter },
    { name: 'LinkedIn', icon: Linkedin },
  ];

  const toggleChannel = (channelName: string) => {
    setSelectedChannels(prev =>
      prev.includes(channelName)
        ? prev.filter(c => c !== channelName)
        : [...prev, channelName]
    );
  };

  const launch = async () => {
    if (!name) return showToast('Please name your campaign', 'error');
    if (!selectedObjective) return showToast('Select an objective', 'error');
    if (selectedChannels.length === 0) return showToast('Select at least one channel', 'error');

    setLaunching(true);
    try {
      await createCampaignRemote({
        name,
        objective: selectedObjective,
        channels: selectedChannels,
        status: 'draft',
      });
      showToast(`Campaign "${name}" created`);
      setName('');
      setSelectedObjective(null);
      setSelectedChannels([]);
    } catch {
      showToast('Failed to create campaign', 'error');
    } finally {
      setLaunching(false);
    }
  };

  const handlePublish = async (payload: {
    copy: string;
    scheduledAt?: string;
    platforms?: string[];
  }) => {
    if (!publishTarget) return;
    try {
      const result = await publishCampaignRemote(publishTarget.id, payload);
      const urls = Object.values(result.results)
        .filter((r): r is { externalUrl?: string } => typeof r === 'object' && r !== null)
        .map((r) => r.externalUrl)
        .filter(Boolean);
      if (payload.scheduledAt) {
        showToast('Campaign scheduled — check Calendar', 'success');
      } else if (urls.length) {
        showToast(`Published on ${urls.length} channel(s)`, 'success');
      } else {
        showToast('Check Integrations if a channel failed', 'warning');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to publish';
      showToast(msg, 'error');
      throw err;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-10 animate-in zoom-in-95 duration-500 py-4 sm:py-6">
      <div className="text-center space-y-2 px-2">
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter uppercase italic">New campaign</h1>
        <p className="text-slate-400 text-base sm:text-lg font-bold">Take your brand to the next level.</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-[3rem] p-6 sm:p-12 shadow-2xl space-y-8 sm:space-y-10">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Strategy title</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Start-Up Rebranding 2026" 
            className="w-full bg-slate-50 border-none rounded-2xl py-5 px-8 text-xl font-bold focus:ring-4 focus:ring-fuchsia-100 outline-none transition-all placeholder:text-slate-300"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h3 className="font-black text-slate-900 flex items-center gap-3 text-lg">
              <Target size={24} className="text-orange-500" /> Objective
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {OBJECTIVE_OPTIONS.map(obj => (
                <button
                  key={obj}
                  onClick={() => setSelectedObjective(obj)}
                  className={`p-4 rounded-xl border-2 transition-all text-xs font-black uppercase tracking-wider ${
                    selectedObjective === obj
                      ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md'
                      : 'bg-slate-50 border-transparent hover:border-orange-500 hover:bg-white'
                  }`}
                >
                  {obj}
                  {selectedObjective === obj && <CheckCircle size={16} className="inline-block ml-2" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-black text-slate-900 flex items-center gap-3 text-lg">
              <Users size={24} className="text-cyan-500" /> Channels
            </h3>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              {channels.map((channel, i) => (
                <button
                  key={i}
                  onClick={() => toggleChannel(channel.name)}
                  className={`p-5 rounded-2xl shadow-lg transition-all relative ${
                    selectedChannels.includes(channel.name)
                      ? 'text-white bg-gradient-to-br from-fuchsia-500 to-orange-500 scale-110'
                      : 'bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                  aria-label={channel.name}
                >
                  <channel.icon size={24} />
                  {selectedChannels.includes(channel.name) && (
                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                      <CheckCircle size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={launch}
          disabled={launching}
          className="w-full py-5 bg-slate-900 text-white font-black text-xl rounded-2xl shadow-xl hover:bg-fuchsia-600 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
        >
          {launching ? 'Creating...' : 'Create campaign'}
        </button>
      </div>

      {/* Lista de campañas */}
      {campaigns.length > 0 && (
        <div className="max-w-4xl mx-auto mt-10">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-6">Active campaigns ({campaigns.length})</h3>
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const contract = campaignContracts[campaign.id];
              const contractSealed = contract?.status === 'sealed';
              const posts = socialPosts.filter((p) => p.campaignId === campaign.id);

              return (
              <div
                key={campaign.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-black text-slate-900">{campaign.name}</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {contractSealed ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                          <CheckCircle size={12} />
                          Contract sealed
                        </span>
                      ) : contract ? (
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold">
                          Draft contract
                        </span>
                      ) : null}
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                        {displayObjective(campaign.objective)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                        campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                        campaign.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {campaign.status === 'active' ? 'Active' :
                         campaign.status === 'scheduled' ? 'Scheduled' :
                         campaign.status === 'paused' ? 'Paused' :
                         campaign.status === 'draft' ? 'Draft' : 'Completed'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {campaign.channels.map(channel => (
                        <span key={channel} className="text-xs text-slate-500 font-semibold">
                          {channel}
                        </span>
                      ))}
                    </div>
                    {posts.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {posts.map((p) => (
                          <div key={p.id} className="text-xs">
                            <span className="font-bold text-slate-600 capitalize">{p.platform}: </span>
                            <span className={`font-semibold ${
                              p.status === 'published' ? 'text-emerald-600' :
                              p.status === 'scheduled' ? 'text-blue-600' : 'text-red-500'
                            }`}>
                              {p.status}
                            </span>
                            {p.externalUrl && (
                              <a
                                href={p.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-fuchsia-600 hover:underline"
                              >
                                View post
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <button
                      onClick={() => setPublishTarget(campaign)}
                      className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-orange-500 hover:opacity-90 text-white font-bold rounded-xl transition-all text-sm"
                    >
                      <Rocket size={16} />
                      Publish
                    </button>
                    <button
                      onClick={() => onOpenContract(campaign.id, campaign.name)}
                      className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 font-bold rounded-xl transition-all text-sm"
                    >
                      <FileSignature size={16} />
                      {contractSealed ? 'View contract' : 'Contract'}
                    </button>
                    {campaign.status === 'active' || campaign.status === 'scheduled' ? (
                      <button
                        onClick={() => {
                          updateCampaignRemote(campaign.id, { status: 'paused' });
                          showToast('Campaign paused');
                        }}
                        className="flex-1 sm:flex-none px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-bold rounded-xl transition-all text-sm"
                      >
                        Pause
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          updateCampaignRemote(campaign.id, { status: 'active' });
                          showToast('Campaign activated');
                        }}
                        className="flex-1 sm:flex-none px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 font-bold rounded-xl transition-all text-sm"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => {
                        deleteCampaignRemote(campaign.id);
                        showToast('Campaign deleted', 'success');
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl transition-all text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}

      {publishTarget && (
        <PublishCampaignModal
          campaign={publishTarget}
          onClose={() => setPublishTarget(null)}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
});

CampaignLauncher.displayName = 'CampaignLauncher';

/* --- Asset Studio Section --- */
interface AssetStudioProps {
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
}

const AssetStudio = memo(({ showToast }: AssetStudioProps) => {
  const [ratio, setRatio] = useState<'1:1' | '9:16' | '16:9'>('1:1');
  const [assetName, setAssetName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { assets } = useAppStore();
  const { uploadAssetRemote, deleteAssetRemote } = useAgencyActions();

  const ratios = [
    { label: 'Start Post', value: '1:1' as const, size: 'w-64 h-64' },
    { label: 'Start Story', value: '9:16' as const, size: 'w-48 h-80' },
    { label: 'Start Banner', value: '16:9' as const, size: 'w-80 h-44' },
  ];

  const generateAsset = async () => {
    if (!assetName.trim()) {
      return showToast('Please name your asset', 'error');
    }

    setIsGenerating(true);
    try {
      await uploadAssetRemote(selectedFile, assetName, ratio);
      showToast(`Asset "${assetName}" saved`);
      setAssetName('');
      setSelectedFile(null);
    } catch {
      showToast('Failed to upload asset', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tighter">ASSET STUDIO <span className="text-cyan-500">360</span></h2>
          <p className="text-slate-400 font-bold mt-2 uppercase text-xs tracking-widest">AI-powered creative engine</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm text-slate-500 font-semibold">Assets created</p>
          <p className="text-3xl font-black text-slate-900">{assets.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-12">
        <div className="space-y-4">
          {ratios.map(r => (
            <button 
              key={r.value}
              onClick={() => setRatio(r.value)}
              className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${
                ratio === r.value ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-600' : 'border-slate-50 text-slate-400 hover:bg-slate-50'
              }`}
            >
              <p className="font-black text-sm uppercase tracking-wider">{r.label}</p>
              <p className="text-xs font-bold opacity-60">{r.value}</p>
            </button>
          ))}
        </div>
        <div className="lg:col-span-3 bg-slate-50 rounded-2xl sm:rounded-[3rem] flex flex-col items-center justify-center p-6 sm:p-12 lg:p-20 min-h-[360px] sm:min-h-[500px] border-4 border-dashed border-slate-100">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            className="mb-4 w-full max-w-md text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-fuchsia-50 file:text-fuchsia-700 file:font-bold"
            disabled={isGenerating}
          />
          <input
            type="text"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            placeholder="Asset name (e.g. Summer Banner 2026)"
            className="mb-8 w-full max-w-md px-6 py-3 rounded-2xl border-2 border-slate-200 focus:border-cyan-500 focus:outline-none font-semibold text-center"
            disabled={isGenerating}
          />
          <div className={`bg-white rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-500 ${ratios.find(r => r.value === ratio)?.size || 'w-64 h-64'}`}>
            <div className={`w-full h-full flex items-center justify-center ${isGenerating ? 'bg-gradient-to-br from-cyan-500 to-fuchsia-500 animate-pulse' : 'bg-gradient-to-br from-slate-100 to-slate-200'}`}>
               <ImageIcon size={48} className="text-white drop-shadow-lg" />
            </div>
          </div>
          <button
            onClick={generateAsset}
            disabled={isGenerating}
            className="mt-12 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : 'Upload asset'}
          </button>
        </div>
      </div>

      {/* Lista de assets generados */}
      {assets.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-6">Created assets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset, i) => (
              <div
                key={asset.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl transition-all group animate-in fade-in zoom-in-95 duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`${ratios.find(r => r.value === asset.ratio)?.size || 'w-full h-48'} mx-auto bg-gradient-to-br from-cyan-100 to-fuchsia-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform overflow-hidden`}>
                  {asset.url || asset.thumbnail ? (
                    <img
                      src={asset.url || asset.thumbnail}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={32} className="text-slate-400" />
                  )}
                </div>
                <h4 className="font-black text-slate-900 mb-2">{asset.name}</h4>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-semibold">Ratio: {asset.ratio}</span>
                  <button
                    onClick={() => {
                      deleteAssetRemote(asset.id);
                      showToast('Asset deleted');
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

AssetStudio.displayName = 'AssetStudio';

export default Dashboard;

