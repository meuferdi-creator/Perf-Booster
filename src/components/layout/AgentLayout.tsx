import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, KeyRound, User } from 'lucide-react';
import { AgentSidebar } from './AgentSidebar';
import { NotificationBell } from '../agent/NotificationBell';
import { ThemeToggle } from '../ui/ThemeToggle';
import { getStoredAuth } from '../../lib/auth-helpers';

export const AgentLayout: React.FC = () => {
  const navigate = useNavigate();
  const auth = getStoredAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AgentSidebar />
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Sidebar Drawer */}
          <div className="relative z-10 w-64 max-w-[80vw] h-full shadow-2xl">
            <AgentSidebar onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200/90 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between dark:bg-slate-900/90 dark:border-slate-800/90 transition-colors duration-200">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">Espace Agent</span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
            <span className="text-xs font-bold text-[#814BE7] bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 truncate max-w-[200px] sm:max-w-none">
              Activité Support Multicanal
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/change-password')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950/60 text-slate-700 dark:text-slate-300 hover:text-[#814BE7] dark:hover:text-purple-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Modifier mon mot de passe"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#814BE7]" />
              <span className="hidden sm:inline">Mot de passe</span>
            </button>
            <ThemeToggle />
            <NotificationBell agentId={auth?.id} />
          </div>
        </header>

        {/* Main Page Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
