import type { PublicBusinessDto } from '@quoteflow/shared';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { buttonClasses } from '@/components/ui/button-styles';
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
              className={buttonClasses({ variant: 'secondary', size: 'sm' })}
            >
              <Icon aria-hidden="true" />
              {link.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
