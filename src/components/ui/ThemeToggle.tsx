import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={theme === 'dark' ? 'Passer au Mode Jour' : 'Passer au Mode Nuit'}
      title={theme === 'dark' ? 'Passer au Mode Jour (Clair)' : 'Passer au Mode Nuit (Sombre)'}
      className={`relative inline-flex items-center h-9 p-1 w-18 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#814BE7] focus:ring-offset-2 border select-none cursor-pointer ${
        theme === 'dark'
          ? 'bg-slate-800 border-slate-700 text-amber-400'
          : 'bg-slate-100 border-slate-300 text-slate-700'
      } ${className}`}
    >
      <span className="sr-only">Changer le thème</span>

      {/* Sun icon on the left */}
      <span
        className={`flex items-center justify-center w-6 h-6 transition-opacity duration-200 z-10 ${
          theme === 'light' ? 'opacity-100 text-amber-500 font-bold' : 'opacity-40 text-slate-400'
        }`}
      >
        <Sun className="w-4 h-4" />
      </span>

      {/* Moon icon on the right */}
      <span
        className={`flex items-center justify-center w-6 h-6 transition-opacity duration-200 z-10 ${
          theme === 'dark' ? 'opacity-100 text-indigo-400 font-bold' : 'opacity-40 text-slate-400'
        }`}
      >
        <Moon className="w-4 h-4" />
      </span>

      {/* Sliding knob */}
      <span
        className={`absolute top-1 left-1 w-7 h-7 rounded-full bg-white dark:bg-slate-900 shadow-md transform transition-transform duration-300 flex items-center justify-center ${
          theme === 'dark' ? 'translate-x-9 bg-slate-900 border border-slate-700' : 'translate-x-0 bg-white border border-slate-200'
        }`}
      />
    </button>
  );
};
