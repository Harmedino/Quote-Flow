import { describe, expect, it } from 'vitest';
import { newLineItemDraft } from '@/features/documents/line-items';
import { editorSummaryLine, filledItemCount } from './editor-summary';

const customer = {
  id: 'c1',
  name: 'Daniel Nguyen',
  email: null,
  phone: null,
  company: null,
  address: {},
};

describe('editor summary', () => {
  it('counts only the rows with a name', () => {
    const items = [newLineItemDraft({ name: 'Deep cleaning' }), newLineItemDraft({ name: '  ' })];
    expect(filledItemCount(items)).toBe(1);
  });

  it('says who the document is for and how many items it has', () => {
    expect(editorSummaryLine(null, [newLineItemDraft()])).toBe('No customer yet · no items yet');
    expect(editorSummaryLine(customer, [newLineItemDraft({ name: 'Deep cleaning' })])).toBe(
      'For Daniel Nguyen · 1 item',
    );
    expect(
      editorSummaryLine(customer, [
        newLineItemDraft({ name: 'Deep cleaning' }),
        newLineItemDraft({ name: 'Windows' }),
      ]),
    ).toBe('For Daniel Nguyen · 2 items');
  });
});
