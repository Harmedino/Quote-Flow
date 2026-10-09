import type { CustomerDto } from '@quoteflow/shared';
import { CalendarDays, Mail, MapPin, Phone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { formatAddressLines } from '@/features/customers/customer-form';
import { formatDate } from '@/lib/format';

const LINK_CLASSES =
  'break-all font-medium text-brand-700 underline-offset-2 hover:text-brand-800 hover:underline';

function ContactRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-zinc-400" />
      <div className="min-w-0">
        <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{label}</dt>
        <dd className="mt-0.5 text-sm text-zinc-900">{children}</dd>
      </div>
    </div>
  );
}

const missing = <span className="text-zinc-400">Not added</span>;

export function CustomerContactCard({ customer }: { customer: CustomerDto }) {
  const { business } = useAuthenticatedSession();
  const addressLines = formatAddressLines(customer.address);

  return (
    <Card>
      <CardHeader title="Contact" />
      <CardContent>
        <dl className="space-y-4">
          <ContactRow icon={Mail} label="Email">
            {customer.email ? (
              <a href={`mailto:${customer.email}`} className={LINK_CLASSES}>
                {customer.email}
              </a>
            ) : (
              missing
            )}
          </ContactRow>
          <ContactRow icon={Phone} label="Phone">
            {customer.phone ? (
              <a href={`tel:${customer.phone.replace(/[^\d+]/g, '')}`} className={LINK_CLASSES}>
                {customer.phone}
              </a>
            ) : (
              missing
            )}
          </ContactRow>
          <ContactRow icon={MapPin} label="Address">
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
          <ContactRow icon={CalendarDays} label="Customer since">
            {formatDate(customer.createdAt, { timeZone: business.timezone })}
          </ContactRow>
        </dl>
      </CardContent>
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
    <Card>
      <CardHeader title="Notes" />
      <CardContent>
        {customer.notes ? (
          <p className="text-sm whitespace-pre-line text-zinc-700">{customer.notes}</p>
        ) : (
          <div className="text-sm text-zinc-500">
            <p>No notes yet. Keep gate codes, preferences or job history here.</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={onEdit}>
              Add a note
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
