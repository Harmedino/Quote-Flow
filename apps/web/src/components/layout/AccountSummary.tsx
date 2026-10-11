import { USER_ROLE_LABELS } from '@quoteflow/shared';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import type { AuthenticatedSession } from '@/features/auth/session-store';

export interface AccountSummaryProps {
  session: AuthenticatedSession;
}

/** Who is signed in, to which business (its monogram in its brand colour), and with which role. */
export function AccountSummary({ session: { user, business } }: AccountSummaryProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={business.name} kind="business" brandColor={business.brandColor} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-ink">{business.name}</p>
        <p className="truncate text-sm text-ink-2">{user.name}</p>
        <p className="mt-1.5 flex min-w-0 items-center gap-2">
          <Badge tone={user.role === 'owner' ? 'brand' : 'neutral'}>
            {USER_ROLE_LABELS[user.role]}
          </Badge>
          <span className="truncate text-xs text-muted">{user.email}</span>
        </p>
      </div>
    </div>
  );
}
