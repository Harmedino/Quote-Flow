import { USER_ROLE_LABELS } from '@quoteflow/shared';
import { Store } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import type { AuthenticatedSession } from '@/features/auth/session-store';

export interface AccountSummaryProps {
  session: AuthenticatedSession;
}

/** Who is signed in, to which business, and with which role. */
export function AccountSummary({ session: { user, business } }: AccountSummaryProps) {
  return (
    <div className="min-w-0 space-y-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-950">{user.name}</p>
          <p className="truncate text-xs text-zinc-500">{user.email}</p>
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-2 rounded-lg bg-zinc-50 px-2.5 py-2 ring-1 ring-zinc-200/70 ring-inset">
        <Store aria-hidden="true" className="size-4 shrink-0 text-zinc-500" />
        <p className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-700">{business.name}</p>
        <Badge tone={user.role === 'owner' ? 'brand' : 'neutral'}>
          {USER_ROLE_LABELS[user.role]}
        </Badge>
      </div>
    </div>
  );
}
