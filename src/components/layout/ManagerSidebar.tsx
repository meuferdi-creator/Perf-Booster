import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Upload,
  AlertTriangle,
  MessageSquare,
  MessageCircle,
  BrainCircuit,
  BarChart2,
  FileSpreadsheet,
  Calculator,
  History,
  CalendarDays,
  LogOut,
  KeyRound,
  Briefcase,
  X,
} from 'lucide-react';
import { clearAuth, getStoredAuth } from '../../lib/auth-helpers';

interface ManagerSidebarProps {
  onClose?: () => void;
}

export const ManagerSidebar: React.FC<ManagerSidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const auth = getStoredAuth();

  const handleLogout = () => {
    clearAuth();
    if (onClose) onClose();
    navigate('/');
  };

  const navItems = [
    { to: '/manager', label: "Vue d'ensemble", icon: LayoutDashboard, end: true },
    { to: '/manager/agents', label: 'Équipe & Agents', icon: Users },
    { to: '/manager/import', label: 'Import Hebdo', icon: Upload },
    { to: '/manager/rca', label: 'Causes & Actions (RCA)', icon: AlertTriangle },
    { to: '/manager/feedbacks', label: 'Feedbacks Manager', icon: MessageSquare },
    { to: '/manager/comments', label: 'Avis Agents', icon: MessageCircle },
    { to: '/manager/coaching', label: 'Coaching IA', icon: BrainCircuit, badge: 'IA' },
    { to: '/manager/analytics', label: 'Analyses Avancées', icon: BarChart2 },
    { to: '/manager/exports', label: 'Rapports & Exports', icon: FileSpreadsheet },
    { to: '/manager/monthly', label: 'Gestion Mensuelle', icon: CalendarDays },
    { to: '/manager/simulator', label: 'Simulateur Primes', icon: Calculator },
    { to: '/manager/results', label: 'Historique Résultats', icon: History },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full md:h-screen sticky top-0 border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#814BE7] to-purple-600 flex items-center justify-center text-white shadow-lg shadow-[#814BE7]/30">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">Performances</h1>
            <p className="text-2xs text-purple-400 font-semibold tracking-wide uppercase">Booster · Manager</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Scope Indicator */}
      <div className="px-4 py-2 bg-purple-950/40 border-b border-slate-800 flex items-center gap-2 text-3xs font-semibold text-purple-300">
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
        <span>Périmètre : Phone · Email · MU</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-[#814BE7] text-white shadow-md shadow-[#814BE7]/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-3xs font-bold rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer User Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-purple-900/60 border border-purple-700/50 flex items-center justify-center text-purple-300 font-bold text-xs shrink-0">
              {auth?.name ? auth.name.charAt(0) : 'M'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{auth?.name || 'SABI Prospere'}</p>
              <p className="text-3xs text-purple-400 truncate">Manager d'équipe</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (onClose) onClose();
                navigate('/change-password');
              }}
              className="p-2 text-slate-400 hover:text-purple-300 rounded-lg hover:bg-slate-800 transition-colors"
              title="Modifier mon mot de passe"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
