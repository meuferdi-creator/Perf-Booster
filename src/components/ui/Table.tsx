import React from 'react';

export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className="w-full overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800">
    <table className={`w-full text-left text-xs sm:text-sm text-slate-800 dark:text-slate-200 ${className}`}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="bg-slate-100/90 text-2xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/90 dark:bg-slate-800/80 dark:border-slate-800 dark:text-slate-300">
    {children}
  </thead>
);

export const TableRow: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({
  children,
  className = '',
  onClick,
}) => (
  <tr
    onClick={onClick}
    className={`border-b border-slate-200/60 transition-colors last:border-none hover:bg-slate-100/70 dark:border-slate-800/70 dark:hover:bg-slate-800/50 ${
      onClick ? 'cursor-pointer' : ''
    } ${className}`}
  >
    {children}
  </tr>
);

export const TableHead: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <th className={`px-3.5 py-3 font-bold whitespace-nowrap ${className}`}>{children}</th>
);

export const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <td className={`px-3.5 py-3 whitespace-nowrap font-medium ${className}`}>{children}</td>
);
