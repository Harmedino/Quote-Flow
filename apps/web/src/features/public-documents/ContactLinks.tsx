import type { PublicBusinessDto } from '@quoteflow/shared';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { type ContactLink, businessContactLinks } from './public-status';

const ICONS: Record<ContactLink['kind'], typeof Phone> = {
  phone: Phone,
  whatsapp: MessageCircle,
  email: Mail,
};

export interface ContactLinksProps {
  business: PublicBusinessDto;
  /** E.g. 'Quote LHS-Q-0014', used in the WhatsApp message and email subject. */
  documentLabel: string;
}

/**
 * Ways to reach the business, as buttons on its colour band: an equal row on phones, beside the
 * name on wide screens. Their wash moves away from the text colour (see `brandPageVars`), so the
 * label reads at least as well as on the band itself, whatever the brand colour.
 */
export function ContactLinks({ business, documentLabel }: ContactLinksProps) {
  const links = businessContactLinks(business, documentLabel);
  if (links.length === 0) return null;

  return (
    <ul
      aria-label={`Contact ${business.name}`}
      className="grid auto-cols-fr grid-flow-col gap-2 lg:flex lg:shrink-0"
    >
      {links.map((link) => {
        const Icon = ICONS[link.kind];
        const external = link.kind === 'whatsapp';
        return (
          <li key={link.kind}>
            <a
              href={link.href}
              {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
              className="flex h-10.5 items-center justify-center gap-2 rounded-[9px] bg-[color-mix(in_srgb,var(--doc-fill),var(--doc-fill-away)_14%)] px-4 text-[14.5px] font-[650] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--doc-on-fill)_28%,transparent)] transition-colors hover:bg-[color-mix(in_srgb,var(--doc-fill),var(--doc-fill-away)_24%)] focus-visible:outline-(--doc-on-fill)"
            >
              <Icon aria-hidden="true" className="size-[17px] shrink-0" strokeWidth={2.25} />
              {link.label}
              <span className="sr-only"> {link.detail}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
