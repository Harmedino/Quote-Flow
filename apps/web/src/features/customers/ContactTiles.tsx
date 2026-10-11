import { toWhatsAppPhone } from '@quoteflow/shared';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { telHref } from '@/components/documents/document-format';
import { cn } from '@/lib/cn';

const TILE =
  'flex flex-1 flex-col items-center gap-1 rounded-[9px] bg-surface-muted py-2.5 text-[12.5px] font-semibold text-ink-2 shadow-[inset_0_0_0_1px_var(--color-line)] transition-colors hover:bg-canvas-deep hover:text-ink [&_svg]:size-4 [&_svg]:stroke-[2.25]';

export interface ContactTilesProps {
  phone: string | null | undefined;
  email: string | null | undefined;
  className?: string;
}

/**
 * One-tap Call, WhatsApp and Email for a customer, always in that order. A tile shows only when
 * its detail is there (WhatsApp needs a number in international format).
 */
export function ContactTiles({ phone, email, className }: ContactTilesProps) {
  const whatsApp = toWhatsAppPhone(phone);
  if (!phone && !email) return null;

  return (
    <div className={cn('flex gap-2', className)}>
      {phone && (
        <a href={telHref(phone)} className={TILE}>
          <Phone aria-hidden="true" />
          Call
        </a>
      )}
      {whatsApp && (
        <a
          href={`https://wa.me/${whatsApp}`}
          target="_blank"
          rel="noopener noreferrer"
          className={TILE}
        >
          <MessageCircle aria-hidden="true" />
          WhatsApp
          <span className="sr-only"> (opens a chat in a new tab)</span>
        </a>
      )}
      {email && (
        <a href={`mailto:${email}`} className={TILE}>
          <Mail aria-hidden="true" />
          Email
          <span className="sr-only"> (opens your email app)</span>
        </a>
      )}
    </div>
  );
}
