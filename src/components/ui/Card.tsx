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
    default:
      'bg-white border border-slate-200/90 shadow-2xs dark:bg-slate-900 dark:border-slate-800 dark:shadow-none text-slate-900 dark:text-slate-100',
    flat:
      'bg-slate-50/90 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800 text-slate-900 dark:text-slate-100',
    gradient:
      'bg-gradient-to-br from-white via-slate-50/80 to-purple-50/40 border border-purple-200/70 shadow-2xs dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/30 dark:border-purple-900/40 text-slate-900 dark:text-slate-100',
    ghost: 'bg-transparent border-none shadow-none text-slate-900 dark:text-slate-100',
  };

  const padding = noPadding ? '' : 'p-4 sm:p-5 md:p-6';

  return (
    <div className={`${base} ${variants[variant]} ${padding} ${className}`} {...props}>
      {children}
    </div>
  );
};
