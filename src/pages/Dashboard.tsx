import { useState, useCallback, memo, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import AuthGuard from '../components/AuthGuard';
import { AppLogo } from '../components/AppLogo';
import { useAppStore } from '../lib/store';
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

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notification, setNotification] = useState<Notification | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [contractModal, setContractModal] = useState<{
    campaignId: string;
    campaignName: string;
  } | null>(null);
  const { user, logout } = useAuth();

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
    <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 transition-all border animate-in slide-in-from-bottom-5 fade-in duration-300 ${
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
        <div className="bg-white rounded-3xl p-8 max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-300">
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
              {confirmDialog.confirmText || 'Confirmar'}
            </button>
            <button
              onClick={() => setConfirmDialog(null)}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {confirmDialog.cancelText || 'Cancelar'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleLogout = useCallback(() => {
    showConfirm({
      title: 'Cerrar Sesión',
      message: '¿Estás seguro que deseas cerrar sesión?',
      confirmText: 'Sí, cerrar sesión',
      cancelText: 'Cancelar',
      onConfirm: () => {
        showToast('Sesión cerrada exitosamente', 'success');
        setTimeout(() => logout(), 500);
      },
    });
  }, [logout, showConfirm, showToast]);

  const userInitials = user?.username 
    ? user.username.substring(0, 2).toUpperCase()
    : 'AS';

  return (
    <AuthGuard requireAuth={true}>
      <div className="flex h-screen bg-white text-slate-800 font-sans antialiased overflow-hidden">
        {/* Sidebar */}
        <nav className="w-72 border-r border-slate-100 bg-slate-50/30 flex flex-col p-8 space-y-10">
          <AppLogo size="md" showText className="px-2" />

          <div className="space-y-3 flex-1">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
              { id: 'campaigns', icon: Rocket, label: 'Campañas', color: 'text-orange-500', bg: 'bg-orange-50' },
              { id: 'studio', icon: ImageIcon, label: 'Asset Studio', color: 'text-cyan-500', bg: 'bg-cyan-50' },
              { id: 'calendar', icon: CalendarIcon, label: 'Calendario', color: 'text-rose-500', bg: 'bg-rose-50' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
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
              <span>Demo contrato</span>
            </Link>
            <button
              onClick={() => showToast('Configuración en desarrollo', 'warning')}
              className="w-full flex items-center gap-3 px-5 py-3 text-slate-400 hover:text-slate-900 transition-all font-semibold rounded-xl hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <Settings size={20} className="transition-transform group-hover:rotate-90 duration-300" />
              <span>Configuración</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-3 text-slate-400 hover:text-red-600 transition-all font-semibold rounded-xl hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative bg-white">
          {/* Header */}
          <header className="sticky top-0 z-30 flex items-center justify-between p-10 bg-white/90 backdrop-blur-md border-b border-slate-50">
            <div className="relative w-96">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                isSearchFocused ? 'text-fuchsia-500' : 'text-slate-300'
              }`} size={20} />
              <input
                type="text"
                placeholder="¿Qué buscas hoy?"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-fuchsia-500 outline-none transition-all placeholder:text-slate-400 font-medium hover:bg-slate-100"
              />
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => showToast('No hay nuevas notificaciones', 'warning')}
                className="p-2 text-slate-400 hover:text-fuchsia-600 transition-all relative hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 rounded-lg"
                aria-label="Notificaciones"
              >
                <Bell size={24} />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              </button>
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{user?.username || 'Admin Start'}</p>
                  <p className="text-xs font-semibold text-cyan-600">Plan Enterprise</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-rose-500 shadow-lg shadow-fuchsia-200 flex items-center justify-center text-white font-black">
                  {userInitials}
                </div>
              </div>
            </div>
          </header>

          <div className="px-10 pb-10 mt-6">
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
            {activeTab === 'calendar' && <CalendarView />}
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
                  showToast(`Contrato sellado: ${contractModal.campaignName}`, 'success')
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
    { label: 'Alcance Total', value: formatNumber(storeStats.reach), trend: storeStats.reachTrend, icon: Users, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
    { label: 'Engagement', value: `${storeStats.engagement}%`, trend: storeStats.engagementTrend, icon: Target, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { label: 'Conversiones', value: formatNumber(storeStats.conversions), trend: storeStats.conversionsTrend, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Inversión', value: `$${formatNumber(storeStats.investment)}`, trend: storeStats.investmentTrend, icon: BarChart3, color: storeStats.investmentTrend.startsWith('+') ? 'text-orange-500' : 'text-red-500', bg: storeStats.investmentTrend.startsWith('+') ? 'bg-orange-50' : 'bg-red-50' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white border border-slate-100 p-8 rounded-[2rem] hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden cursor-pointer hover:-translate-y-1 active:translate-y-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
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
            <p className="text-4xl font-black text-slate-900 mt-2 tracking-tight group-hover:scale-105 transition-transform inline-block">{stat.value}</p>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-slate-900">Rendimiento Semanal</h2>
            <div className="flex gap-2">
              <Zap size={20} className="text-orange-500 fill-orange-500" />
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-4 px-4">
            {[65, 45, 95, 55, 80, 60, 85].map((val, i) => (
              <div key={i} className="w-full space-y-4">
                <div className="relative w-full bg-white rounded-2xl overflow-hidden h-full border border-slate-100">
                  <div 
                    className="absolute bottom-0 w-full bg-gradient-to-t from-fuchsia-600 to-orange-500 rounded-t-xl transition-all duration-1000" 
                    style={{ height: `${val}%` }}
                  ></div>
                </div>
                <span className="block text-center text-[10px] font-black text-slate-400 uppercase">
                  {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-xl shadow-slate-100">
          <h2 className="text-2xl font-black text-slate-900 mb-8">Feed de Actividad</h2>
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
                <p className="text-slate-400 text-sm">No hay actividad reciente</p>
                <p className="text-slate-300 text-xs mt-2">Crea tu primera campaña o asset</p>
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
  const [selectedObjective, setSelectedObjective] = useState<'Tráfico' | 'Leads' | 'Ventas' | 'Brand' | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const { addCampaign, campaigns, updateCampaign, deleteCampaign, campaignContracts } =
    useAppStore();

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

  const launch = () => {
    if (!name) return showToast("Por favor, nombra tu campaña", "error");
    if (!selectedObjective) return showToast("Selecciona un objetivo", "error");
    if (selectedChannels.length === 0) return showToast("Selecciona al menos un canal", "error");

    addCampaign({
      name,
      objective: selectedObjective,
      channels: selectedChannels,
      status: 'active',
    });

    showToast(`Campaña "${name}" desplegada con éxito`);
    setName('');
    setSelectedObjective(null);
    setSelectedChannels([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in zoom-in-95 duration-500 py-6">
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Nueva Campaña</h1>
        <p className="text-slate-400 text-lg font-bold">Impulsa tu marca al siguiente nivel.</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-[3rem] p-12 shadow-2xl space-y-10">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título de la Estrategia</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Rebranding Start-Up 2026" 
            className="w-full bg-slate-50 border-none rounded-2xl py-5 px-8 text-xl font-bold focus:ring-4 focus:ring-fuchsia-100 outline-none transition-all placeholder:text-slate-300"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h3 className="font-black text-slate-900 flex items-center gap-3 text-lg">
              <Target size={24} className="text-orange-500" /> Objetivo
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {(['Tráfico', 'Leads', 'Ventas', 'Brand'] as const).map(obj => (
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
              <Users size={24} className="text-cyan-500" /> Canales
            </h3>
            <div className="flex gap-4">
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
          className="w-full py-5 bg-slate-900 text-white font-black text-xl rounded-2xl shadow-xl hover:bg-fuchsia-600 transition-all transform hover:-translate-y-1 active:scale-95"
        >
          Lanzar Ahora
        </button>
      </div>

      {/* Lista de campañas */}
      {campaigns.length > 0 && (
        <div className="max-w-4xl mx-auto mt-10">
          <h3 className="text-2xl font-black text-slate-900 mb-6">Campañas Activas ({campaigns.length})</h3>
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const contract = campaignContracts[campaign.id];
              const contractSealed = contract?.status === 'sealed';

              return (
              <div
                key={campaign.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-lg font-black text-slate-900">{campaign.name}</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {contractSealed ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                          <CheckCircle size={12} />
                          Contrato sellado
                        </span>
                      ) : contract ? (
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold">
                          Contrato en borrador
                        </span>
                      ) : null}
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                        {campaign.objective}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                        campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {campaign.status === 'active' ? 'Activa' : campaign.status === 'paused' ? 'Pausada' : 'Completada'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {campaign.channels.map(channel => (
                        <span key={channel} className="text-xs text-slate-500 font-semibold">
                          {channel}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      onClick={() => onOpenContract(campaign.id, campaign.name)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 font-bold rounded-xl transition-all text-sm"
                    >
                      <FileSignature size={16} />
                      {contractSealed ? 'Ver contrato' : 'Contrato'}
                    </button>
                    {campaign.status === 'active' ? (
                      <button
                        onClick={() => {
                          updateCampaign(campaign.id, { status: 'paused' });
                          showToast('Campaña pausada');
                        }}
                        className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-bold rounded-xl transition-all text-sm"
                      >
                        Pausar
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          updateCampaign(campaign.id, { status: 'active' });
                          showToast('Campaña activada');
                        }}
                        className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 font-bold rounded-xl transition-all text-sm"
                      >
                        Activar
                      </button>
                    )}
                    <button
                      onClick={() => {
                        deleteCampaign(campaign.id);
                        showToast('Campaña eliminada', 'success');
                      }}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl transition-all text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </div>
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
  const { addAsset, assets, deleteAsset } = useAppStore();

  const ratios = [
    { label: 'Start Post', value: '1:1' as const, size: 'w-64 h-64' },
    { label: 'Start Story', value: '9:16' as const, size: 'w-48 h-80' },
    { label: 'Start Banner', value: '16:9' as const, size: 'w-80 h-44' },
  ];

  const generateAsset = () => {
    if (!assetName.trim()) {
      return showToast("Por favor, nombra tu asset", "error");
    }

    setIsGenerating(true);

    // Simular generación de asset
    setTimeout(() => {
      addAsset({
        name: assetName,
        ratio,
      });

      showToast(`Asset "${assetName}" generado con éxito`);
      setAssetName('');
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">ASSET STUDIO <span className="text-cyan-500">360</span></h2>
          <p className="text-slate-400 font-bold mt-2 uppercase text-xs tracking-widest">Motor creativo impulsado por IA</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 font-semibold">Assets generados</p>
          <p className="text-3xl font-black text-slate-900">{assets.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
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
        <div className="lg:col-span-3 bg-slate-50 rounded-[3rem] flex flex-col items-center justify-center p-20 min-h-[500px] border-4 border-dashed border-slate-100">
          <input
            type="text"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            placeholder="Nombre del asset (ej: Banner Verano 2026)"
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
                Generando...
              </>
            ) : 'Generar Asset'}
          </button>
        </div>
      </div>

      {/* Lista de assets generados */}
      {assets.length > 0 && (
        <div className="mt-10">
          <h3 className="text-2xl font-black text-slate-900 mb-6">Assets Generados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset, i) => (
              <div
                key={asset.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl transition-all group animate-in fade-in zoom-in-95 duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`${ratios.find(r => r.value === asset.ratio)?.size || 'w-full h-48'} mx-auto bg-gradient-to-br from-cyan-100 to-fuchsia-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                  <ImageIcon size={32} className="text-slate-400" />
                </div>
                <h4 className="font-black text-slate-900 mb-2">{asset.name}</h4>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-semibold">Ratio: {asset.ratio}</span>
                  <button
                    onClick={() => {
                      deleteAsset(asset.id);
                      showToast('Asset eliminado');
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-bold"
                  >
                    Eliminar
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

/* --- Calendar Section --- */
const CalendarView = memo(() => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const { calendarEvents, addCalendarEvent } = useAppStore();
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleAddEvent = () => {
    if (selectedDay && eventTitle.trim()) {
      addCalendarEvent({
        day: selectedDay,
        title: eventTitle,
        type: 'other',
        color: 'bg-fuchsia-500',
      });
      setEventTitle('');
      setSelectedDay(null);
    }
  };

  const getEventsForDay = (day: number) => {
    return calendarEvents.filter(e => e.day === day);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Calendario <span className="text-fuchsia-500">Start</span></h2>
        <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
           <button className="px-5 py-2 bg-white shadow-sm rounded-lg text-xs font-black">MES</button>
           <button className="px-5 py-2 text-xs font-black text-slate-400">SEMANA</button>
        </div>
      </div>

      {selectedDay && (
        <div className="bg-gradient-to-r from-fuchsia-50 to-cyan-50 border-2 border-fuchsia-200 p-6 rounded-3xl animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-black text-slate-900 mb-4">Agregar evento - Día {selectedDay}</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Nombre del evento"
              className="flex-1 px-4 py-3 rounded-xl border-2 border-fuchsia-200 focus:border-fuchsia-500 focus:outline-none font-semibold"
              onKeyPress={(e) => e.key === 'Enter' && handleAddEvent()}
            />
            <button
              onClick={handleAddEvent}
              className="px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-black rounded-xl transition-all"
            >
              Agregar
            </button>
            <button
              onClick={() => { setSelectedDay(null); setEventTitle(''); }}
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black rounded-xl transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-7 gap-4">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">{d}</div>
        ))}
        {days.map(d => {
          const dayEvents = getEventsForDay(d);
          const hasEvents = dayEvents.length > 0;
          return (
            <div
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`min-h-[120px] bg-white border p-4 rounded-2xl transition-all cursor-pointer group ${
                selectedDay === d ? 'border-fuchsia-500 shadow-lg' : hasEvents ? 'border-fuchsia-200' : 'border-slate-50 hover:border-fuchsia-200'
              }`}
            >
              <span className={`text-sm font-black inline-flex items-center justify-center ${
                hasEvents ? 'bg-fuchsia-500 text-white w-8 h-8 rounded-lg shadow-lg' : 'text-slate-400'
              }`}>
                {d}
              </span>
              {dayEvents.map((event, i) => (
                <div key={event.id} className="mt-2">
                  <div className={`h-2 w-full ${event.color} rounded-full animate-in fade-in duration-200`} style={{ animationDelay: `${i * 100}ms` }}></div>
                  <p className="text-[9px] font-bold text-slate-600 mt-1 truncate">{event.title}</p>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
});

CalendarView.displayName = 'CalendarView';

export default Dashboard;

