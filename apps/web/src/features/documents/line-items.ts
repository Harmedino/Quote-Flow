import {
  type DiscountInput,
  type DocumentTotals,
  type LineItemDto,
  type LineItemInput,
  type ServiceDto,
  calculateDocumentTotals,
  calculateLineAmount,
} from '@quoteflow/shared';

/**
 * One editable row of a quote or invoice. Numbers are null while their field
 * is empty, so a half-typed row never shows a misleading zero.
 */
export interface LineItemDraft {
  /** Stable React key; never sent to the API. */
  key: string;
  serviceId?: string;
  name: string;
  description: string;
  quantity: number | null;
  unit: string;
  /** Minor units. */
  unitPrice: number | null;
}

let keySequence = 0;

function nextKey(): string {
  keySequence += 1;
  return `line-${Date.now().toString(36)}-${keySequence}`;
}

export function newLineItemDraft(
  overrides: Partial<Omit<LineItemDraft, 'key'>> = {},
): LineItemDraft {
  return {
    key: nextKey(),
    name: '',
    description: '',
    quantity: 1,
    unit: '',
    unitPrice: null,
    ...overrides,
  };
}

export function lineItemDraftFromDto(item: LineItemDto): LineItemDraft {
  return newLineItemDraft({
    serviceId: item.serviceId ?? undefined,
    name: item.name,
    description: item.description ?? '',
    quantity: item.quantity,
    unit: item.unit ?? '',
    unitPrice: item.unitPrice,
  });
}

/** Fills a row from a catalogue service, keeping the quantity already entered. */
export function applyServiceToDraft(draft: LineItemDraft, service: ServiceDto): LineItemDraft {
  return {
    ...draft,
    serviceId: service.id,
    name: service.name,
    description: service.description ?? '',
    unit: service.unit ?? '',
    unitPrice: service.price,
  };
}

/** Adds a catalogue service as a row, filling the last row instead while it is still blank. */
export function addServiceLineItem(
  drafts: readonly LineItemDraft[],
  service: ServiceDto,
): LineItemDraft[] {
  const last = drafts.at(-1);
  if (last && isBlankLineItemDraft(last)) {
    return [...drafts.slice(0, -1), applyServiceToDraft(last, service)];
  }
  return [...drafts, applyServiceToDraft(newLineItemDraft(), service)];
}

export function duplicateLineItemDraft(draft: LineItemDraft): LineItemDraft {
  return { ...draft, key: nextKey() };
}

/** A row the user added but never filled in. */
export function isBlankLineItemDraft(draft: LineItemDraft): boolean {
  return (
    !draft.serviceId &&
    draft.name.trim() === '' &&
    draft.description.trim() === '' &&
    draft.unitPrice === null
  );
}

/** Drops untouched rows before saving, keeping at least one row to report "required" errors on. */
export function withoutBlankLineItems(drafts: readonly LineItemDraft[]): LineItemDraft[] {
  const filled = drafts.filter((draft) => !isBlankLineItemDraft(draft));
  return filled.length > 0 ? filled : drafts.slice(0, 1);
}

/**
 * The API shape of each row. Empty numbers become NaN so the shared schema
 * reports them at the right path (see {@link lineItemDraftErrors} for messages).
 */
export function toLineItemInputs(drafts: readonly LineItemDraft[]): LineItemInput[] {
  return drafts.map((draft) => ({
    ...(draft.serviceId && { serviceId: draft.serviceId }),
    name: draft.name,
    ...(draft.description.trim() && { description: draft.description }),
    quantity: draft.quantity ?? Number.NaN,
    ...(draft.unit.trim() && { unit: draft.unit }),
    unitPrice: draft.unitPrice ?? Number.NaN,
  }));
}

/** Friendlier messages for empty numeric fields than the schema's type errors. */
export function lineItemDraftErrors(drafts: readonly LineItemDraft[]): Record<string, string> {
  const errors: Record<string, string> = {};
  drafts.forEach((draft, index) => {
    if (draft.quantity === null) errors[`items.${index}.quantity`] = 'Enter a quantity';
    if (draft.unitPrice === null) errors[`items.${index}.unitPrice`] = 'Enter a price';
  });
  return errors;
}

/** quantity × unit price, or null while the row is incomplete or out of range. */
export function draftLineAmount(draft: LineItemDraft): number | null {
  if (draft.quantity === null || draft.unitPrice === null) return null;
  try {
    return calculateLineAmount(draft.quantity, draft.unitPrice);
  } catch {
    return null;
  }
}

/** Live totals for unsaved rows; incomplete rows count as zero. Null when out of range. */
export function draftTotals(
  drafts: readonly LineItemDraft[],
  discount: DiscountInput | null,
  taxRate: number,
): DocumentTotals | null {
  try {
    return calculateDocumentTotals({
      items: drafts.map((draft) => ({
        quantity: draft.quantity !== null && draft.quantity > 0 ? draft.quantity : 0,
        unitPrice: draft.unitPrice ?? 0,
      })),
      discount,
      taxRate: Number.isFinite(taxRate) ? taxRate : 0,
    });
  } catch (error) {
    if (error instanceof RangeError) return null;
    throw error;
  }
}
