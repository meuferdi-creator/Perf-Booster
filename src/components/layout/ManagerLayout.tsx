import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { ManagerSidebar } from './ManagerSidebar';
import { NotificationBell } from '../agent/NotificationBell';
import { ThemeToggle } from '../ui/ThemeToggle';
import { getStoredAuth } from '../../lib/auth-helpers';

export const ManagerLayout: React.FC = () => {
  const auth = getStoredAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <ManagerSidebar />
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
            <ManagerSidebar onClose={() => setMobileMenuOpen(false)} />
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

            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">Espace Manager</span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
            <span className="text-xs font-bold text-[#814BE7] bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300 px-3 py-1.5 rounded-lg border border-purple-200/60 dark:border-purple-800/60 truncate max-w-[200px] sm:max-w-none">
              Activité Support · {auth?.manager_name || 'SABI Prospere'}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
