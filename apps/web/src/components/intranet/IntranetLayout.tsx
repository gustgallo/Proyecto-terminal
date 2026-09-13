import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Clock,
  Award,
  Package,
  FolderKanban,
  Calendar,
  Bot,
  Users,
  LogOut,
  Menu,
  User as UserIcon,
  Bell,
  ChevronRight,
} from 'lucide-react';
import api from '../../services/api';

export const IntranetLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Notification Bell State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Polling notificaciones cada 15s
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/intranet/login');
  };

  const navItems = [
    { name: 'Tablero Principal', path: '/intranet/dashboard', icon: LayoutDashboard, roles: ['ALL'] },
    { name: 'Horas Extras', path: '/intranet/horas-extras', icon: Clock, roles: ['ALL'] },
    { name: 'Bonificaciones', path: '/intranet/bonificaciones', icon: Award, roles: ['ALL'] },
    { name: 'Materiales', path: '/intranet/materiales', icon: Package, roles: ['ADMIN_GLOBAL', 'PRODUCCION', 'MESA_CONTROL'] },
    { name: 'Proyectos', path: '/intranet/proyectos', icon: FolderKanban, roles: ['ADMIN_GLOBAL', 'PRODUCCION', 'MESA_CONTROL'] },
    { name: 'Solicitudes (Vacaciones)', path: '/intranet/solicitudes', icon: Calendar, roles: ['ALL'] },
    { name: 'Asistente RRHH Prodisa', path: '/intranet/chatbot', icon: Bot, roles: ['ALL'] },
    { name: 'Usuarios & Permisos', path: '/intranet/usuarios', icon: Users, roles: ['ADMIN_GLOBAL'] },
  ];

  const allowedNav = navItems.filter((item) => {
    if (item.roles.includes('ALL')) return true;
    if (!user) return false;
    return user.roleCode === 'ADMIN_GLOBAL' || item.roles.includes(user.roleCode);
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#0d121f] border-r border-slate-800 flex flex-col justify-between transition-all duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/80">
            <Link to="/intranet/dashboard" className="flex items-center gap-3">
              <img
                src="/assets/logo-prodisa.png"
                alt="PRODISA Logo"
                className="w-[47px] h-[47px] object-contain rounded-xl bg-black p-0.5 border border-slate-700/50 shadow-lg shadow-blue-600/20"
              />
              <div>
                <span className="font-bold text-white text-base block leading-none">SWGRHP-IG</span>
                <span className="text-[10px] text-blue-400 font-medium tracking-wider uppercase block mt-1">
                  Intranet Prodisa
                </span>
              </div>
            </Link>
          </div>

          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-160px)]">
            <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Módulos del Sistema
            </div>

            {allowedNav.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/25'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

          </nav>
        </div>

        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3 p-2 rounded-lg mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-bold">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <span className="inline-block text-[10px] bg-blue-950 text-blue-400 px-2 py-0.5 rounded font-semibold mt-0.5">
                {user?.roleName || user?.roleCode}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-xs text-red-400 hover:text-white hover:bg-red-600/20 py-2 rounded-lg border border-red-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-[#0d121f]/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 relative z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Intranet</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-200 font-medium capitalize">
                {location.pathname.replace('/intranet/', '') || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Campanita Interna de Notificaciones */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all"
                title="Notificaciones Internas"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-red-500/40">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown de Notificaciones */}
              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0d121f] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-400" />
                      <h4 className="text-sm font-bold text-white">Notificaciones</h4>
                      {unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {unreadCount} nuevas
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        Marcar todas leídas
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">No tienes notificaciones pendientes.</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                          className={`p-3 rounded-xl transition-colors cursor-pointer space-y-1 ${
                            n.is_read ? 'bg-slate-900/40 opacity-75' : 'bg-slate-800/60 border-l-2 border-blue-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">{n.title}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(n.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl"
            >
              Sitio Público
            </Link>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
