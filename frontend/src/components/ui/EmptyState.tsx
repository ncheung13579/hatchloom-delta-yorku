// Centered placeholder shown when a list or table has no data.
import type { ReactNode } from 'react';

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h3 className="text-lg font-semibold text-charcoal">{title}</h3>
      {description && <p className="mt-1 text-sm text-soft max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
