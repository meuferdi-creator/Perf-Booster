import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { store } from '../../lib/store';
import { Notification } from '../../types';

export const NotificationBell: React.FC<{ agentId?: string }> = ({ agentId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const all = store.getNotifications();
      if (agentId) {
        setNotifs(all.filter((n) => n.agent_id === agentId));
      } else {
        setNotifs(all);
      }
    };

    update();
    return store.subscribe(update);
  }, [agentId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifs.filter((n) => !n.lu).length;

  const markAllRead = () => {
    notifs.forEach((n) => {
      if (!n.lu) store.markNotificationAsRead(n.id);
    });
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'alert':
        return <XCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#814BE7] text-[10px] font-bold text-white shadow-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[#814BE7] font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {notifs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Aucune notification</div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => store.markNotificationAsRead(n.id)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                    n.lu ? 'bg-white opacity-70 dark:bg-slate-900' : 'bg-indigo-50/40 dark:bg-indigo-950/20'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{n.titre}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
