import { Check } from 'lucide-react';
import { businessInitials } from '@/components/documents/document-format';
import { brandPageVars } from '@/features/public-documents/fills';

/**
 * A miniature of the customer's quote page, light in both themes as the page itself is: the
 * colour band with the inverted monogram, a ticket stub tinted with the colour, and the Accept
 * button. A colour that text can't be read on is shown darkened, as customers will see it.
 */
export function BrandPreview({
  color,
  businessName,
  className,
}: {
  color: string;
  businessName: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="label-mono text-muted">How customers see it</p>
      <div
        aria-hidden="true"
        style={brandPageVars(color)}
        className="mt-2.5 max-w-md overflow-hidden rounded-xl scheme-light bg-canvas text-ink shadow-[0_0_0_1px_var(--color-line)]"
      >
        <div className="bg-(--doc-fill) px-4 pt-3.5 pb-10 text-(--doc-on-fill)">
          <p className="font-mono text-[10.5px] font-medium tracking-[0.08em] uppercase">
            Quote for your customer
          </p>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-[13px] font-[800] text-(--doc-accent-text) font-stretch-118%">
              {businessInitials(businessName)}
            </span>
            <p className="truncate text-base leading-tight font-extrabold font-stretch-115%">
              {businessName}
            </p>
          </div>
        </div>
        <div className="-mt-7 px-3 pb-3">
          <div className="ticket-col drop-shadow-[0_0_0.5px_rgb(14_27_51/0.45)] [--notch:7px]">
            <div className="bg-(--doc-accent-soft) px-3.5 py-3">
              <p className="font-mono text-[10.5px] font-medium tracking-[0.08em] text-ink-2 uppercase">
                Total to pay
              </p>
              <span className="mt-2 block h-2.5 w-28 rounded-sm bg-ink/60 shadow-[0_4px_0_color-mix(in_srgb,var(--doc-accent)_30%,transparent)]" />
            </div>
            <div className="grid grid-cols-[1fr_1.7fr] gap-2 px-3.5 py-3 text-[13px] font-[650]">
              <span className="flex h-8 items-center justify-center rounded-lg shadow-[inset_0_0_0_1px_var(--color-line-strong)]">
                Decline
              </span>
              <span className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-(--doc-fill) text-(--doc-on-fill)">
                <Check className="size-3.5" strokeWidth={2.5} />
                Accept quote
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
