import { PlayCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button, type ButtonProps } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { useDemoLogin } from './use-demo-login';

export interface DemoLoginButtonProps extends Pick<ButtonProps, 'size' | 'className'> {
  label?: string;
  /** Shows an "or" divider above the button (under a sign-in form). */
  divider?: boolean;
  /** Rendered instead when the deployment has no demo. */
  fallback?: ReactNode;
}

/** Signs in to the shared demo business when the API offers one. */
export function DemoLoginButton({
  label = 'Explore the demo',
  divider = false,
  fallback = null,
  size,
  className,
}: DemoLoginButtonProps) {
  const demo = useDemoLogin();
  if (!demo.available) return fallback;

  return (
    <div className={cn('space-y-4', divider && 'mt-6')}>
      {divider && (
        <div className="flex items-center gap-3 text-xs font-medium tracking-wide text-zinc-500 uppercase">
          <span aria-hidden="true" className="h-px flex-1 bg-zinc-200" />
          or
          <span aria-hidden="true" className="h-px flex-1 bg-zinc-200" />
        </div>
      )}
      {demo.error && <Alert tone="danger">{getErrorMessage(demo.error)}</Alert>}
      <Button
        type="button"
        variant="secondary"
        size={size}
        loading={demo.pending}
        onClick={demo.start}
        className={className}
      >
        <PlayCircle aria-hidden="true" />
        {label}
      </Button>
    </div>
  );
}
