import React from 'react';
import { Outlet } from 'react-router-dom';
import { ManagerSidebar } from './ManagerSidebar';
import { NotificationBell } from '../agent/NotificationBell';
import { getStoredAuth } from '../../lib/auth-helpers';

export const ManagerLayout: React.FC = () => {
  const auth = getStoredAuth();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans dark:bg-slate-950 dark:text-slate-100">
      <ManagerSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between dark:bg-slate-900/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">Espace Manager</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-[#814BE7] bg-purple-50 px-2.5 py-1 rounded-md dark:bg-purple-950/50">
              Activité Support · {auth?.manager_name || 'SABI Prospere'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
