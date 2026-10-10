import { type ReactNode, useId } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export interface SettingsSectionProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}

/** A settings group: a card with its title and explanation above the fields. */
export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <Card>
        <CardHeader title={<span id={headingId}>{title}</span>} description={description} />
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}
