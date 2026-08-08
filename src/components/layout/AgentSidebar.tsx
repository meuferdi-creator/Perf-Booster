import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Target,
  Trophy,
  Bot,
  CalendarDays,
  LogOut,
  User,
  Zap,
} from 'lucide-react';
import { clearAuth, getStoredAuth } from '../../lib/auth-helpers';

export const AgentSidebar: React.FC = () => {
  const navigate = useNavigate();
  const auth = getStoredAuth();

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  const navItems = [
    { to: '/agent', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/agent/evolution', label: 'Évolution', icon: TrendingUp },
    { to: '/agent/feedbacks', label: 'Feedbacks', icon: MessageSquare },
    { to: '/agent/qa', label: 'Avis QA', icon: ShieldCheck },
    { to: '/agent/objectifs', label: 'Mes Objectifs', icon: Target },
    { to: '/agent/gamification', label: 'Gamification', icon: Trophy },
    { to: '/agent/monthly', label: 'Mon Mois & Primes', icon: CalendarDays },
    { to: '/agent/assistant', label: 'Assistant IA', icon: Bot, badge: 'IA' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#814BE7] to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-[#814BE7]/30">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-tight">Performances</h1>
          <p className="text-2xs text-[#814BE7] font-semibold tracking-wide uppercase">Booster · Agent</p>
        </div>
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
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-[#814BE7] text-white shadow-md shadow-[#814BE7]/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-3xs font-bold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
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
            <div className="w-8 h-8 rounded-full bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0">
              {auth?.name ? auth.name.charAt(0) : 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{auth?.name || 'Agent'}</p>
              <p className="text-3xs text-slate-500 truncate">Matricule: {auth?.matricule || '1163'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
