// Generic container card with rounded border and subtle shadow.
import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: boolean;
}

export default function Card({ children, padding = true, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-card rounded-[18px] border-[1.5px] border-border shadow-[0_2px_12px_rgba(0,0,0,0.04)]
        ${padding ? 'p-6' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
