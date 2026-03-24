interface MetricCardProps {
  label: string;
  value: string | number;
  detail?: string;
  accent?: 'teal' | 'primary' | 'warning' | 'success' | 'danger' | 'orange';
}

const accentColors: Record<string, string> = {
  teal: 'border-l-teal',
  primary: 'border-l-primary',
  warning: 'border-l-warning',
  success: 'border-l-success',
  danger: 'border-l-danger',
  orange: 'border-l-orange',
};

export default function MetricCard({ label, value, detail, accent = 'teal' }: MetricCardProps) {
  return (
    <div
      className={`bg-card rounded-[14px] border-[1.5px] border-border shadow-[0_2px_12px_rgba(0,0,0,0.04)]
        p-4 border-l-[3px] ${accentColors[accent]}
        transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]`}
    >
      <p className="text-[0.75rem] font-semibold uppercase tracking-wide text-soft">{label}</p>
      <p className="mt-2 text-[1.45rem] font-bold font-[family-name:var(--font-display)] text-charcoal leading-tight">
        {value}
      </p>
      {detail && <p className="mt-1 text-[0.78rem] text-soft">{detail}</p>}
    </div>
  );
}
