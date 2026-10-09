import { RotateCw } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/api-client';

export interface QueryErrorProps {
  /** What failed to load, e.g. "Couldn’t load customers". */
  title: string;
  error: unknown;
  onRetry: () => void;
  retrying?: boolean;
  className?: string;
}

/** A failed load with the reason and a way to try again. */
export function QueryError({
  title,
  error,
  onRetry,
  retrying = false,
  className,
}: QueryErrorProps) {
  return (
    <Alert tone="danger" title={title} className={className}>
      <p>{getErrorMessage(error)}</p>
      <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry} loading={retrying}>
        <RotateCw aria-hidden="true" />
        Try again
      </Button>
    </Alert>
  );
}
