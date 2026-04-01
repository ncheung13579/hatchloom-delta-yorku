// Styled text input with optional label and error message.
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-body">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-[10px] border-[1.5px] border-border bg-bg px-3.5 py-2 text-[0.85rem] text-body
          font-[family-name:var(--font-body)]
          placeholder:text-[#B0B5BF] focus:outline-none focus:ring-2 focus:ring-primary/30
          focus:border-primary transition-colors ${error ? 'border-danger' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
