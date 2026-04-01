// Colored pill badge for displaying status, tags, and labels.
import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

const colors: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-teal/10 text-teal',
  muted: 'bg-bg text-soft',
};

export default function Badge({
  variant = 'default',
  children,
  className = '',
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.78rem] font-semibold
        ${colors[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
