import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Squares2X2Icon, 
  VideoCameraIcon, 
  UsersIcon, 
  QueueListIcon, 
  HomeModernIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  BellIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from './Icons';
import { useState } from 'react';

const SpeakerLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/speaker', icon: Squares2X2Icon },
    { name: 'My Sessions', href: '/speaker/sessions', icon: VideoCameraIcon },
    { name: 'Feedback', href: '/speaker/feedback', icon: ChartBarIcon },
  ];

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <h1 className="text-xl font-bold text-blue-800 tracking-tight">
              Speaker <span className="text-slate-900 font-black">Portal</span>
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-bold rounded-md transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center px-3 py-3 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest truncate">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center px-3 py-2 text-sm font-bold text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5 text-slate-400" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header (Mobile Only) */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-md"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="ml-4 flex-1">
            <h2 className="text-lg font-bold text-slate-900">
              {navigation.find(n => n.href === currentPath)?.name || 'Speaker'}
            </h2>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SpeakerLayout;
