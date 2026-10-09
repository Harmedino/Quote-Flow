import type { LineItemDto, ServiceDto } from '@quoteflow/shared';
import { describe, expect, it } from 'vitest';
import { matchServices, parseQuantityInput } from './line-item-inputs';
import {
  addServiceLineItem,
  applyServiceToDraft,
  draftLineAmount,
  draftTotals,
  duplicateLineItemDraft,
  isBlankLineItemDraft,
  lineItemDraftErrors,
  lineItemDraftFromDto,
  newLineItemDraft,
  toLineItemInputs,
  withoutBlankLineItems,
} from './line-items';

const service: ServiceDto = {
  id: '64b000000000000000000001',
  name: 'Deep cleaning',
  description: 'Whole home',
  price: 2_500_000,
  unit: 'visit',
  active: true,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

describe('line item drafts', () => {
  it('creates blank rows with unique keys and a quantity of one', () => {
    const first = newLineItemDraft();
    const second = newLineItemDraft({ name: 'Paint' });
    expect(first).toMatchObject({
      name: '',
      description: '',
      quantity: 1,
      unit: '',
      unitPrice: null,
    });
    expect(second.name).toBe('Paint');
    expect(first.key).not.toBe(second.key);
    expect(isBlankLineItemDraft(first)).toBe(true);
    expect(isBlankLineItemDraft(second)).toBe(false);
  });

  it('fills a row from a service but keeps its quantity', () => {
    const draft = applyServiceToDraft(newLineItemDraft({ quantity: 3 }), service);
    expect(draft).toMatchObject({
      serviceId: service.id,
      name: 'Deep cleaning',
      description: 'Whole home',
      unit: 'visit',
      unitPrice: 2_500_000,
      quantity: 3,
    });
  });

  it('adds a service by filling the blank last row, or as a new row', () => {
    const blank = newLineItemDraft();
    const filled = addServiceLineItem([blank], service);
    expect(filled).toHaveLength(1);
    expect(filled[0]).toMatchObject({ key: blank.key, name: 'Deep cleaning' });

    const added = addServiceLineItem(filled, service);
    expect(added).toHaveLength(2);
    expect(added[1]).toMatchObject({ name: 'Deep cleaning', quantity: 1, unitPrice: 2_500_000 });
    expect(added[1]?.key).not.toBe(blank.key);
  });

  it('duplicates with a new key and round-trips API items', () => {
    const item: LineItemDto = {
      serviceId: null,
      name: 'Gutter clean',
      description: null,
      quantity: 1.5,
      unit: null,
      unitPrice: 1000,
      amount: 1500,
    };
    const draft = lineItemDraftFromDto(item);
    expect(draft).toMatchObject({ serviceId: undefined, description: '', unit: '', quantity: 1.5 });
    const copy = duplicateLineItemDraft(draft);
    expect(copy).toEqual({ ...draft, key: copy.key });
    expect(copy.key).not.toBe(draft.key);
  });

  it('maps drafts to API inputs, omitting empty optional text', () => {
    const drafts = [
      applyServiceToDraft(newLineItemDraft(), service),
      newLineItemDraft({ name: 'Custom', unitPrice: 500, quantity: 2 }),
      newLineItemDraft({ name: 'Incomplete', quantity: null }),
    ];
    const [fromService, custom, incomplete] = toLineItemInputs(drafts);
    expect(fromService).toEqual({
      serviceId: service.id,
      name: 'Deep cleaning',
      description: 'Whole home',
      quantity: 1,
      unit: 'visit',
      unitPrice: 2_500_000,
    });
    expect(custom).toEqual({ name: 'Custom', quantity: 2, unitPrice: 500 });
    expect(incomplete?.quantity).toBeNaN();
    expect(incomplete?.unitPrice).toBeNaN();
    expect(lineItemDraftErrors(drafts)).toEqual({
      'items.2.quantity': 'Enter a quantity',
      'items.2.unitPrice': 'Enter a price',
    });
  });

  it('drops untouched rows but always keeps one', () => {
    const filled = newLineItemDraft({ name: 'Paint' });
    expect(withoutBlankLineItems([newLineItemDraft(), filled, newLineItemDraft()])).toEqual([
      filled,
    ]);
    const blanks = [newLineItemDraft(), newLineItemDraft()];
    expect(withoutBlankLineItems(blanks)).toEqual([blanks[0]]);
  });

  it('computes live amounts and totals, treating incomplete rows as zero', () => {
    const drafts = [
      newLineItemDraft({ name: 'A', quantity: 2, unitPrice: 1_000 }),
      newLineItemDraft({ name: 'B', quantity: null, unitPrice: 5_000 }),
    ];
    expect(draftLineAmount(drafts[0]!)).toBe(2_000);
    expect(draftLineAmount(drafts[1]!)).toBeNull();
    expect(draftTotals(drafts, { type: 'percentage', value: 10 }, 7.5)).toEqual({
      subtotal: 2_000,
      discount: 200,
      tax: 135,
      total: 1_935,
    });
  });

  it('returns null instead of throwing for out-of-range totals', () => {
    const huge = [
      newLineItemDraft({ name: 'Huge', quantity: 100_000, unitPrice: 100_000_000_000_000 }),
    ];
    expect(draftTotals(huge, null, 0)).toBeNull();
    expect(draftLineAmount(huge[0]!)).toBeNull();
  });
});

describe('line item inputs', () => {
  it('parses typed quantities', () => {
    expect(parseQuantityInput('')).toBeNull();
    expect(parseQuantityInput('2.5')).toBe(2.5);
    expect(parseQuantityInput('1,000')).toBe(1000);
    expect(parseQuantityInput('3.')).toBe(3);
    expect(parseQuantityInput('.')).toBeUndefined();
    expect(parseQuantityInput('two')).toBeUndefined();
  });

  it('suggests active services whose name matches', () => {
    const inactive = { ...service, id: '2', name: 'Deep fryer clean', active: false };
    const windows = { ...service, id: '3', name: 'Window washing' };
    expect(matchServices([service, inactive, windows], 'DEEP')).toEqual([service]);
    expect(matchServices([service, inactive, windows], '')).toEqual([service, windows]);
  });
});
