import React from 'react';
import { useAuth } from '../AuthContext';
import { logout } from '../firebase';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, User as UserIcon, LogOut, Wallet, PieChart, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

const SidebarItem: React.FC<{ to: string; icon: React.ReactNode; label: string; active: boolean }> = ({ to, icon, label, active }) => (
  <Link to={to}>
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
        active ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </motion.div>
  </Link>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const location = useLocation();

  if (!user) return <>{children}</>;

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 p-6 flex flex-col">
        <div className="flex items-center space-x-3 mb-12 px-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
            <TrendingUp className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">InvestWise AI</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" active={location.pathname === '/'} />
          {isAdmin && (
            <SidebarItem to="/admin" icon={<ShieldCheck size={20} />} label="Admin Console" active={location.pathname === '/admin'} />
          )}
          <SidebarItem to="/profile" icon={<UserIcon size={20} />} label="Financial Profile" active={location.pathname === '/profile'} />
          <SidebarItem to="/recommendations" icon={<PieChart size={20} />} label="Recommendations" active={location.pathname === '/recommendations'} />
          <SidebarItem to="/portfolio" icon={<Wallet size={20} />} label="Portfolio" active={location.pathname === '/portfolio'} />
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-800">
          <div className="flex items-center space-x-3 px-4 py-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-emerald-500">
              {profile?.displayName?.[0] || user.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.displayName || 'User'}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-6xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default Layout;
