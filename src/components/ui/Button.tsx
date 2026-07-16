import type { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
  loading?: boolean;
}

const VARIANTS: Record<NonNullable<Props['variant']>, string> = {
  primary:
    'bg-purple-500 text-white hover:bg-purple-400 disabled:bg-purple-300 focus-visible:ring-purple-400',
  outline:
    'border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-50 focus-visible:ring-purple-400',
};

export default function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 font-semibold transition-colors disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
