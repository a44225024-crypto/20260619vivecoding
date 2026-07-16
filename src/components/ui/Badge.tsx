import type { ReactNode } from 'react';

type Tone = 'neutral' | 'warning' | 'danger' | 'success' | 'info';

interface Props {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}

const TONES: Record<Tone, string> = {
  neutral: 'bg-gray-100 text-gray-500',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  success: 'bg-green-100 text-green-700',
  info: 'bg-blue-100 text-blue-700',
};

export default function Badge({ tone = 'neutral', className = '', children }: Props) {
  return (
    <span className={`inline-block rounded-full transition-colors ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}
