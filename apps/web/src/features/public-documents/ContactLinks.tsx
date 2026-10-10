import type { PublicBusinessDto } from '@quoteflow/shared';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { cn } from '@/lib/cn';
import { type ContactLink, businessContactLinks } from './public-status';

const ICONS: Record<ContactLink['kind'], typeof Phone> = {
  phone: Phone,
  whatsapp: MessageCircle,
  email: Mail,
};

export interface ContactLinksProps {
  business: PublicBusinessDto;
  /** E.g. 'Quote QT-0001', used in the WhatsApp message and email subject. */
  documentLabel: string;
  className?: string;
}

/** Ways to reach the business, as chips. */
export function ContactLinks({ business, documentLabel, className }: ContactLinksProps) {
  const links = businessContactLinks(business, documentLabel);
  if (links.length === 0) return null;

  return (
    <ul className={cn('flex flex-wrap gap-2', className)} aria-label={`Contact ${business.name}`}>
      {links.map((link) => {
        const Icon = ICONS[link.kind];
        const external = link.kind === 'whatsapp';
        return (
          <li key={link.kind}>
            <a
              href={link.href}
              {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-stone-100 px-3.5 text-[13px] font-medium text-stone-700 transition-colors hover:bg-stone-200 hover:text-stone-900"
            >
              <Icon aria-hidden="true" className="size-3.5 shrink-0" />
              {link.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
