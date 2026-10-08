import { cn } from '@/lib/cn';

export interface SpinnerProps {
  className?: string;
  /** Announced to assistive technology. Omit when the surrounding control already conveys progress. */
  label?: string;
}

export function Spinner({ className, label }: SpinnerProps) {
  const icon = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('size-4 animate-spin', className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );

  if (!label) {
    return icon;
  }
  return (
    <span role="status" className="inline-flex">
      {icon}
      <span className="sr-only">{label}</span>
    </span>
  );
}
