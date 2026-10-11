import type { CustomerDto } from '@quoteflow/shared';
import type { ReactNode } from 'react';
import { telHref } from '@/components/documents/document-format';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PanelCard } from '@/components/ui/PanelCard';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { ContactTiles } from '@/features/customers/ContactTiles';
import { formatAddressLines } from '@/features/customers/customer-form';
import { formatDate } from '@/lib/format';

const LINK_CLASSES =
  'rounded-sm font-[650] wrap-anywhere text-primary-ink underline-offset-[3px] hover:underline';

function ContactRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="shrink-0 pt-px label-mono text-muted">{label}</dt>
      <dd className="min-w-0 text-right text-sm text-ink">{children}</dd>
    </div>
  );
}

const missing = <span className="text-muted">Not added</span>;

export function CustomerContactCard({ customer }: { customer: CustomerDto }) {
  const { business } = useAuthenticatedSession();
  const addressLines = formatAddressLines(customer.address);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <Avatar name={customer.name} size="lg" />
        <div className="min-w-0">
          <h2 className="truncate heading-card text-ink">Contact</h2>
          <p className="text-[13px] text-muted">
            Customer since {formatDate(customer.createdAt, { timeZone: business.timezone })}
          </p>
        </div>
      </div>
      <ContactTiles phone={customer.phone} email={customer.email} className="mt-4" />
      <dl className="mt-4 divide-y divide-dashed divide-line-strong border-t border-line">
        <ContactRow label="Email">
          {customer.email ? (
            <a href={`mailto:${customer.email}`} className={LINK_CLASSES}>
              {customer.email}
            </a>
          ) : (
            missing
          )}
        </ContactRow>
        <ContactRow label="Phone">
          {customer.phone ? (
            <a href={telHref(customer.phone)} className={LINK_CLASSES}>
              {customer.phone}
            </a>
          ) : (
            missing
          )}
        </ContactRow>
        <ContactRow label="Address">
          {addressLines.length > 0 ? (
            <address className="not-italic">
              {addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          ) : (
            missing
          )}
        </ContactRow>
      </dl>
    </Card>
  );
}

export function CustomerNotesCard({
  customer,
  onEdit,
}: {
  customer: CustomerDto;
  onEdit: () => void;
}) {
  return (
    <PanelCard
      title="Notes"
      action={
        customer.notes ? (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Edit<span className="sr-only"> notes</span>
          </Button>
        ) : undefined
      }
    >
      {customer.notes ? (
        <p className="rounded-[10px] bg-surface-muted px-4 py-3 text-sm whitespace-pre-line text-ink-2">
          {customer.notes}
        </p>
      ) : (
        <div className="rounded-[10px] border-[1.5px] border-dashed border-line-strong px-4 py-5 text-center text-sm text-muted">
          <p>No notes yet. Keep gate codes, preferences or job history here.</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={onEdit}>
            Add a note
          </Button>
        </div>
      )}
    </PanelCard>
  );
}
