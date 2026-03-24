import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-gradient-to-br from-primary to-primary-dark text-white hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-px',
  secondary: 'border-[1.5px] border-border text-body bg-card hover:bg-bg hover:border-soft',
  danger: 'bg-danger text-white hover:bg-red-600',
  ghost: 'text-soft hover:text-body hover:bg-bg',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[0.82rem]',
  md: 'px-5 py-2.5 text-[0.9rem]',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold
        transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
        cursor-pointer font-[family-name:var(--font-body)]
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
