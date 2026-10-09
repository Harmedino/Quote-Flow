import { Check, ExternalLink, Link2, MessageCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/button-styles';
import { PanelCard } from '@/components/ui/PanelCard';

export interface SharePanelProps {
  title: string;
  description: ReactNode;
  /** The customer's link. */
  url: string;
  /** True while a draft is being marked as sent before it is shared. */
  sending: boolean;
  copied: boolean;
  onShareWhatsApp: () => void;
  onCopyLink: () => void;
  /** The customer's page, to see it as they will; omitted while customers can't open it yet. */
  previewHref?: string;
  /**
   * `secondary` when the page header already offers the main next step (e.g. "Convert to
   * invoice"), so one screen never has two filled buttons competing.
   */
  emphasis?: 'primary' | 'secondary';
  /** Hints, errors and the live announcement, under the buttons. */
  children?: ReactNode;
}

/** Sending a quote or invoice: WhatsApp first, then the link to paste anywhere. */
export function SharePanel({
  title,
  description,
  url,
  sending,
  copied,
  onShareWhatsApp,
  onCopyLink,
  previewHref,
  emphasis = 'primary',
  children,
}: SharePanelProps) {
  return (
    <PanelCard title={title} description={description}>
      <div className="space-y-3">
        <Button
          variant={emphasis}
          className="w-full"
          size="lg"
          loading={sending}
          onClick={onShareWhatsApp}
        >
          <MessageCircle aria-hidden="true" />
          Share on WhatsApp
        </Button>
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="secondary" aria-disabled={sending || undefined} onClick={onCopyLink}>
            {copied ? (
              <Check aria-hidden="true" className="text-emerald-700" />
            ) : (
              <Link2 aria-hidden="true" />
            )}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
          {previewHref ? (
            <a
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: 'secondary' })}
            >
              <ExternalLink aria-hidden="true" />
              Preview
              <span className="sr-only"> as customer (opens in a new tab)</span>
            </a>
          ) : (
            <Button
              variant="secondary"
              aria-disabled
              title="Customers can open the link once it is sent"
            >
              <ExternalLink aria-hidden="true" />
              Preview
            </Button>
          )}
        </div>
        <p
          title={url}
          className="truncate rounded-lg bg-surface-muted px-3 py-2 font-mono text-[13px] text-stone-600 select-all"
        >
          {url.replace(/^https?:\/\//, '')}
        </p>
        {children}
      </div>
    </PanelCard>
  );
}
