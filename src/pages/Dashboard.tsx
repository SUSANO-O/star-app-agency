import React, { useState } from 'react';
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
  LogOut
} from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import AuthGuard from '../components/AuthGuard';

interface Notification {
  message: string;
  type: 'success' | 'error';
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notification, setNotification] = useState<Notification | null>(null);
  const { user, logout } = useAuth();

  // Helper to show notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Notification Component
  const Toast = () => (
    <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce z-50 transition-all border ${
      notification?.type === 'success' 
      ? 'bg-white border-emerald-500 text-emerald-600' 
      : 'bg-white border-rose-500 text-rose-600'
    }`}>
      {notification?.type === 'success' ? <CheckCircle size={20} /> : <X size={20} />}
      <span className="font-bold">{notification?.message}</span>
    </div>
  );

  const handleLogout = () => {
    logout();
  };

  const userInitials = user?.username 
    ? user.username.substring(0, 2).toUpperCase()
    : 'AS';

  return (
    <AuthGuard requireAuth={true}>
      <div className="flex h-screen bg-white text-slate-800 font-sans antialiased overflow-hidden">
        {/* Sidebar */}
        <nav className="w-72 border-r border-slate-100 bg-slate-50/30 flex flex-col p-8 space-y-10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-12 h-12 bg-gradient-to-tr from-[#FF007A] via-[#FF5C00] to-[#FFD600] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Rocket className="text-white" size={28} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-slate-900 leading-none uppercase">Start App</span>
              <span className="text-sm font-bold text-slate-400">AGENCY 360</span>
            </div>
          </div>

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
            <button className="w-full flex items-center gap-3 px-5 py-3 text-slate-400 hover:text-slate-900 transition-colors font-semibold">
              <Settings size={20} />
              <span>Configuración</span>
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-3 text-slate-400 hover:text-red-600 transition-colors font-semibold"
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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                type="text" 
                placeholder="¿Qué buscas hoy?" 
                className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-fuchsia-500 outline-none transition-all placeholder:text-slate-400 font-medium"
              />
            </div>
            <div className="flex items-center gap-6">
              <button className="p-2 text-slate-400 hover:text-fuchsia-600 transition-colors relative">
                <Bell size={24} />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
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
            {activeTab === 'campaigns' && <CampaignLauncher showToast={showToast} />}
            {activeTab === 'studio' && <AssetStudio showToast={showToast} />}
            {activeTab === 'calendar' && <CalendarView />}
          </div>
          
          {notification && <Toast />}
        </main>
      </div>
    </AuthGuard>
  );
};

/* --- Dashboard Section --- */
const DashboardView = () => {
  const stats = [
    { label: 'Alcance Total', value: '1.2M', trend: '+12.5%', icon: Users, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
    { label: 'Engagement', value: '4.8%', trend: '+2.1%', icon: Target, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { label: 'Conversiones', value: '12.4k', trend: '+18.2%', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Inversión', value: '$8.2k', trend: '-4.3%', icon: BarChart3, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 p-8 rounded-[2rem] hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={28} />
              </div>
              <span className={`text-xs font-black px-3 py-1 rounded-full ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {stat.trend}
              </span>
            </div>
            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest">{stat.label}</h3>
            <p className="text-4xl font-black text-slate-900 mt-2 tracking-tight">{stat.value}</p>
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
            {[
              { type: 'Campaña', title: 'Black Friday 360', time: 'hace 2h', color: 'bg-fuchsia-500' },
              { type: 'Asset', title: 'Start Story Verano', time: 'hace 4h', color: 'bg-cyan-500' },
              { type: 'Usuario', title: 'Nuevo Manager: Alex', time: 'hace 6h', color: 'bg-orange-500' },
            ].map((item, i) => (
              <div key={i} className="flex gap-5 items-center p-4 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer group">
                <div className={`w-3 h-3 rounded-full ${item.color} shrink-0 shadow-lg`}></div>
                <div>
                  <p className="text-sm font-black text-slate-900">{item.title}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{item.type} • {item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- Campaign Launcher Section --- */
interface CampaignLauncherProps {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const CampaignLauncher = ({ showToast }: CampaignLauncherProps) => {
  const [name, setName] = useState('');
  
  const launch = () => {
    if(!name) return showToast("Por favor, nombra tu campaña", "error");
    showToast(`Campaña "${name}" desplegada con éxito`);
    setName('');
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
              {['Tráfico', 'Leads', 'Ventas', 'Brand'].map(obj => (
                <button key={obj} className="p-4 rounded-xl bg-slate-50 border-2 border-transparent hover:border-orange-500 hover:bg-white transition-all text-xs font-black uppercase tracking-wider">
                  {obj}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-black text-slate-900 flex items-center gap-3 text-lg">
              <Users size={24} className="text-cyan-500" /> Canales
            </h3>
            <div className="flex gap-4">
              {[Instagram, Facebook, Twitter, Linkedin].map((Icon, i) => (
                <button key={i} className="p-5 rounded-2xl bg-slate-50 text-slate-400 hover:text-white hover:bg-gradient-to-br from-fuchsia-500 to-orange-500 shadow-lg transition-all">
                  <Icon size={24} />
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
    </div>
  );
};

/* --- Asset Studio Section --- */
interface AssetStudioProps {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const AssetStudio = ({ showToast }: AssetStudioProps) => {
  const [ratio, setRatio] = useState('1:1');
  const ratios = [
    { label: 'Start Post', value: '1:1', size: 'w-64 h-64' },
    { label: 'Start Story', value: '9:16', size: 'w-48 h-80' },
    { label: 'Start Banner', value: '16:9', size: 'w-80 h-44' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">ASSET STUDIO <span className="text-cyan-500">360</span></h2>
          <p className="text-slate-400 font-bold mt-2 uppercase text-xs tracking-widest">Motor creativo impulsado por IA</p>
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
          <div className={`bg-white rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-500 ${ratios.find(r => r.value === ratio)?.size || 'w-64 h-64'}`}>
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse flex items-center justify-center">
               <ImageIcon size={48} className="text-white drop-shadow-lg" />
            </div>
          </div>
          <button 
            onClick={() => showToast("Asset generado con éxito")}
            className="mt-12 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-lg"
          >
            Generar Asset
          </button>
        </div>
      </div>
    </div>
  );
};

/* --- Calendar Section --- */
const CalendarView = () => {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Calendario <span className="text-fuchsia-500">Start</span></h2>
        <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
           <button className="px-5 py-2 bg-white shadow-sm rounded-lg text-xs font-black">MES</button>
           <button className="px-5 py-2 text-xs font-black text-slate-400">SEMANA</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">{d}</div>
        ))}
        {days.map(d => (
          <div key={d} className="min-h-[120px] bg-white border border-slate-50 p-4 rounded-2xl hover:border-fuchsia-200 transition-all cursor-pointer group">
            <span className={`text-sm font-black ${d === 15 ? 'bg-fuchsia-500 text-white w-8 h-8 flex items-center justify-center rounded-lg shadow-lg' : 'text-slate-400'}`}>
              {d}
            </span>
            {d === 15 && <div className="mt-3 h-2 w-full bg-orange-100 rounded-full"></div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

