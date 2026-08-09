import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'pills' | 'underline';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'pills',
}) => {
  if (variant === 'underline') {
    return (
      <div className={`flex border-b border-slate-200 dark:border-slate-800 space-x-4 sm:space-x-6 overflow-x-auto max-w-full no-scrollbar ${className}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap min-h-[44px] ${
                isActive
                  ? 'border-[#814BE7] text-[#814BE7] dark:text-purple-400'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {tab.icon && <span className="w-4 h-4 shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge != null && (
                <span
                  className={`px-2 py-0.5 text-2xs font-bold rounded-full ${
                    isActive ? 'bg-indigo-100 text-[#814BE7] dark:bg-purple-950/80 dark:text-purple-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`inline-flex p-1 bg-slate-200/80 rounded-xl dark:bg-slate-800/90 max-w-full overflow-x-auto no-scrollbar ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-150 cursor-pointer select-none whitespace-nowrap min-h-[40px] ${
              isActive
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            {tab.icon && <span className="w-4 h-4 shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge != null && (
              <span
                className={`px-1.5 py-0.5 text-2xs rounded-full font-bold ${
                  isActive ? 'bg-[#814BE7]/15 text-[#814BE7] dark:text-purple-300' : 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
