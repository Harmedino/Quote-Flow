import type { ServiceDto } from '@quoteflow/shared';

/** Parsing and matching for the line-item inputs. */

const MAX_SUGGESTIONS = 8;

export function matchServices(services: readonly ServiceDto[], text: string): ServiceDto[] {
  const query = text.trim().toLowerCase();
  return services
    .filter((service) => service.active && service.name.toLowerCase().includes(query))
    .slice(0, MAX_SUGGESTIONS);
}

/** Parses a typed quantity: null when empty, undefined while it is not a number yet. */
export function parseQuantityInput(text: string): number | null | undefined {
  const cleaned = text.replace(/[\s,]/g, '');
  if (cleaned === '') return null;
  if (!/^\d*\.?\d*$/.test(cleaned) || cleaned === '.') return undefined;
  return Number(cleaned);
}
