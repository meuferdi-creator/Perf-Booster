import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'gradient' | 'ghost';
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  noPadding = false,
  ...props
}) => {
  const base = 'rounded-2xl transition-all duration-200';

  const variants = {
    default: 'bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800',
    flat: 'bg-slate-50 border border-slate-200/60 dark:bg-slate-800/50 dark:border-slate-800',
    gradient: 'bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 border border-indigo-100/80 shadow-xs dark:from-slate-900 dark:to-indigo-950/20 dark:border-indigo-900/30',
    ghost: 'bg-transparent border-none shadow-none',
  };

  const padding = noPadding ? '' : 'p-5 md:p-6';

  return (
    <div className={`${base} ${variants[variant]} ${padding} ${className}`} {...props}>
      {children}
    </div>
  );
};
