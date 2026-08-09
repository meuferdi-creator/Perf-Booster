import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = '', id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-2xs">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:border-[#814BE7] focus:outline-none focus:ring-2 focus:ring-[#814BE7]/30 transition-all duration-150 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 ${
              icon ? 'pl-10 pr-3.5' : 'px-3.5'
            } ${error ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-500/30' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-600 dark:text-slate-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
