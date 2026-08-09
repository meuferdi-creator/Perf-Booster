import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-bold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none rounded-xl cursor-pointer select-none active:scale-[0.98] min-h-[40px] sm:min-h-[44px]';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-xs sm:text-sm gap-2',
    lg: 'px-5 py-3 text-sm sm:text-base gap-2.5',
  };

  const variants = {
    primary:
      'bg-[#814BE7] text-white hover:bg-[#6f3cd1] active:bg-[#5f32b8] focus:ring-[#814BE7]/50 shadow-sm shadow-[#814BE7]/30 border border-purple-500/20',
    secondary:
      'bg-indigo-100 text-purple-950 hover:bg-indigo-200 border border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-200 dark:border-indigo-700/80 dark:hover:bg-indigo-900/90 font-bold',
    outline:
      'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 hover:text-slate-900 shadow-2xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800',
    ghost:
      'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500/50 shadow-sm border border-rose-500/30',
    emerald:
      'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus:ring-emerald-500/50 shadow-sm border border-emerald-500/30',
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
