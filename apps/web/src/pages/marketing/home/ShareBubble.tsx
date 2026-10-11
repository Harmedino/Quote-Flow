import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { SAMPLE_BUSINESS, SAMPLE_TIMES, displayUrl, sampleShare } from './sample-job';

/**
 * The sample quote's WhatsApp message as the customer receives it: the message QuoteFlow writes,
 * word for word, with its link (shortened as the app shows it). There is no link preview card:
 * the customer's page has none to give. Decorative: the hero's copy says the same.
 */
export function ShareBubble({ className }: { className?: string }) {
  const { message, url } = sampleShare();
  const paragraphs = message.split('\n\n').map((paragraph) => paragraph.split('\n'));

  return (
    <div
      aria-hidden="true"
      className={cn(
        'rounded-[14px_14px_14px_4px] bg-surface px-3 pt-3 pb-2.5 shadow-(--shadow-elevated)',
        className,
      )}
    >
      <p className="flex items-center gap-2 text-[12.5px] font-bold text-viewed">
        <MessageCircle className="size-[15px]" />
        {SAMPLE_BUSINESS.name}
      </p>
      {paragraphs.map((lines) => (
        <p key={lines[0]} className="mt-1.5 text-[13.5px] leading-[1.45] text-ink">
          {lines.map((line) =>
            line === url ? (
              <span
                key={line}
                className="mt-0.5 block truncate rounded-md bg-sent-tint px-2 py-1 font-mono text-[11px] text-sent underline underline-offset-2"
              >
                {displayUrl(url)}
              </span>
            ) : (
              <span key={line} className="block">
                {line}
              </span>
            ),
          )}
        </p>
      ))}
      <p className="mt-1 text-right font-mono text-[10.5px] text-muted">{SAMPLE_TIMES.sent}</p>
    </div>
  );
}
