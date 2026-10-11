import { cn } from '@/lib/cn';

const HEIGHT = 470;
const STEP = 4;

/** A mark every 4px from the top: a long one with its number every 40, a middle one every 20. */
const MARKS = Array.from({ length: Math.floor((HEIGHT - 6) / STEP) + 1 }, (_, index) => ({
  y: 6 + index * STEP,
  length: index % 10 === 0 ? 17 : index % 5 === 0 ? 11 : 6,
  number: index % 10 === 0 && index > 0 ? index / 10 : undefined,
}));

/** The orange tape measure pulled down the side of the hero photo. Decorative. */
export function VerticalTape({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'overflow-hidden rounded-[4px] bg-primary shadow-[0_6px_18px_rgb(14_27_51/0.25),inset_0_0_0_1px_rgb(14_27_51/0.12)]',
        className,
      )}
    >
      <svg width="38" height={HEIGHT} viewBox={`0 0 38 ${HEIGHT}`} className="block">
        {MARKS.map((mark) => (
          <g key={mark.y}>
            <line
              x1="0"
              x2={mark.length}
              y1={mark.y}
              y2={mark.y}
              className="stroke-on-primary"
              strokeWidth={mark.length > 6 ? 1.6 : 1}
            />
            {mark.number && (
              <text
                x="33"
                y={mark.y + 3.5}
                textAnchor="end"
                className="fill-on-primary font-mono text-[10px] font-semibold"
              >
                {mark.number}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
