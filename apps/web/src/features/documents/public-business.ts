import type { BusinessDto, PublicBusinessDto } from '@quoteflow/shared';

/** What the customer sees about the business, for previewing a document as they will. */
export function toPublicBusiness(business: BusinessDto): PublicBusinessDto {
  const { name, logoUrl, email, phone, website, address, brandColor } = business;
  return { name, logoUrl, email, phone, website, address, brandColor };
}
