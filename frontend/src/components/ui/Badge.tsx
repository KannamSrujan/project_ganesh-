import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'featured' | 'verified' | 'pending' | 'default';
  className?: string;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  featured: 'bg-amber-100 text-amber-800 border-amber-200',
  verified: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  pending:  'bg-slate-100  text-slate-600  border-slate-200',
  default:  'bg-orange-100 text-orange-800 border-orange-200',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5',
        'text-xs font-semibold tracking-wide',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
