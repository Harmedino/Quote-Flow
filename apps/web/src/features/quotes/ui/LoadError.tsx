import { RotateCw } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/api-client';

export interface LoadErrorProps {
  title: string;
  error: unknown;
  onRetry: () => void;
  retrying?: boolean;
}

export function LoadError({ title, error, onRetry, retrying = false }: LoadErrorProps) {
  return (
    <Alert tone="danger" title={title}>
      <p>{getErrorMessage(error)}</p>
      <Button variant="secondary" size="sm" className="mt-3" loading={retrying} onClick={onRetry}>
        <RotateCw aria-hidden="true" />
        Try again
      </Button>
    </Alert>
  );
}
