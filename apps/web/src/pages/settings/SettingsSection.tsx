import { type ReactNode, useId } from 'react';
import { Card } from '@/components/ui/Card';

export interface SettingsSectionProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}

/** A settings group: its title and explanation beside (or above) a card of fields. */
export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="grid gap-x-10 gap-y-4 py-8 first-of-type:pt-0 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]"
    >
      <div>
        <h2 id={headingId} className="text-base font-semibold text-zinc-950">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-pretty text-zinc-600">{description}</p>}
      </div>
      <Card className="min-w-0 p-5 sm:p-6">{children}</Card>
    </section>
  );
}
