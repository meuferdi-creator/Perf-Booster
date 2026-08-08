import React from 'react';

export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
    <table className={`w-full text-left text-sm text-slate-700 dark:text-slate-300 ${className}`}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-400">
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
    className={`border-b border-slate-100 transition-colors last:border-none hover:bg-slate-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/40 ${
      onClick ? 'cursor-pointer' : ''
    } ${className}`}
  >
    {children}
  </tr>
);

export const TableHead: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <th className={`px-4 py-3.5 font-medium ${className}`}>{children}</th>
);

export const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <td className={`px-4 py-3.5 whitespace-nowrap ${className}`}>{children}</td>
);
