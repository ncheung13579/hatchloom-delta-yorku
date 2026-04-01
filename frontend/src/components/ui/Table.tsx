// Composable table primitives (Table, Thead, Tbody, Th, Td) with consistent styling.
import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';

export function Table({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <table className={`w-full border-collapse ${className}`}>{children}</table>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return <thead className="bg-bg">{children}</thead>;
}

export function Th({ children, className = '', ...props }: ThHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <th
      className={`text-left px-5 py-3 font-[family-name:var(--font-display)] font-semibold
        text-[0.78rem] text-soft uppercase tracking-wider bg-bg
        border-b-[1.5px] border-border ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = '', ...props }: TdHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <td className={`px-5 py-3.5 text-[0.9rem] text-body border-b border-border align-middle ${className}`} {...props}>
      {children}
    </td>
  );
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="bg-card">{children}</tbody>;
}
