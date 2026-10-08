import type { LucideIcon } from 'lucide-react';
import { EmptyState } from './ui/EmptyState';

export interface ModulePlaceholderProps {
  icon: LucideIcon;
  /** One line describing what this page will do. */
  description: string;
}

/** Stands in for a module whose feature has not been built yet. */
export function ModulePlaceholder({ icon, description }: ModulePlaceholderProps) {
  return (
    <EmptyState
      icon={icon}
      title="This module is being built"
      description={description}
      className="rounded-xl border border-dashed border-zinc-300 bg-white/60"
    />
  );
}
