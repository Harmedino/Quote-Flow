import { describe, expect, it } from 'vitest';
import { readQuoteFlash } from './quote-flash';
import { buildQuoteShare, publicQuoteUrl } from './quote-share';

const base = {
  origin: 'https://app.quoteflow.example',
  publicToken: 'abc_DEF-123',
  quoteNumber: 'QT-0042',
  businessName: 'Sparkle Cleaning Co.',
  customerName: 'Chidi Okafor',
};

describe('quote sharing', () => {
  it('builds the public link from the origin and token', () => {
    expect(publicQuoteUrl(base.origin, base.publicToken)).toBe(
      'https://app.quoteflow.example/quote/abc_DEF-123',
    );
  });

  it('builds a WhatsApp link to the customer when their number is international', () => {
    const share = buildQuoteShare({ ...base, customerPhone: '+234 803 555 0101' });
    expect(share.hasWhatsAppNumber).toBe(true);
    expect(share.message).toContain('Hi Chidi,');
    expect(share.message).toContain('QT-0042 from Sparkle Cleaning Co.');
    expect(share.message).toContain(share.url);
    expect(share.whatsAppUrl).toBe(
      `https://wa.me/2348035550101?text=${encodeURIComponent(share.message)}`,
    );
  });

  it('opens WhatsApp without a chat when there is no usable number', () => {
    for (const customerPhone of [null, '0803']) {
      const share = buildQuoteShare({ ...base, customerPhone });
      expect(share.hasWhatsAppNumber).toBe(false);
      expect(share.whatsAppUrl.startsWith('https://wa.me/?text=')).toBe(true);
    }
  });

  it('reads only known flash messages from navigation state', () => {
    expect(readQuoteFlash({ flash: 'sent' })).toBe('sent');
    expect(readQuoteFlash({ flash: 'hacked' })).toBeNull();
    expect(readQuoteFlash(null)).toBeNull();
    expect(readQuoteFlash('sent')).toBeNull();
  });
});
