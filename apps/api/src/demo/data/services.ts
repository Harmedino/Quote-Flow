import type { Service } from '../../models';

type ServiceSeed = Pick<Service, 'name' | 'description' | 'price' | 'unit'> & { active?: boolean };

/** Prices are in kobo (NGN). */
export const DEMO_SERVICES = {
  standardClean: {
    name: 'Standard home cleaning',
    description: 'Kitchen, bathrooms, dusting, sweeping and mopping throughout.',
    unit: 'visit',
    price: 2_500_000,
  },
  deepClean: {
    name: 'Deep cleaning',
    description: 'Top-to-bottom clean including skirting, inside cabinets and appliances.',
    unit: 'hour',
    price: 750_000,
  },
  moveOutClean: {
    name: 'Move-out cleaning',
    description: 'Full clean of an empty flat, ready for inspection and new tenants.',
    unit: 'flat',
    price: 9_000_000,
  },
  acService: {
    name: 'AC servicing',
    description: 'Coil and filter cleaning, gas pressure check and performance test.',
    unit: 'unit',
    price: 1_500_000,
  },
  acCallOut: {
    name: 'AC fault diagnosis',
    description: 'On-site diagnosis. Credited against any repair done the same day.',
    unit: 'visit',
    price: 1_000_000,
  },
  solarCleaning: {
    name: 'Solar panel cleaning',
    unit: 'panel',
    price: 300_000,
  },
  interiorPainting: {
    name: 'Interior painting',
    description: 'Two coats of washable emulsion. Minor patching and sanding included.',
    unit: 'm²',
    price: 250_000,
  },
  exteriorPainting: {
    name: 'Exterior painting',
    description: 'Surface prep, primer where needed and two coats of weatherproof paint.',
    unit: 'm²',
    price: 320_000,
  },
  handyman: {
    name: 'Handyman labour',
    description: 'Repairs, mounting, assembly and small fixes.',
    unit: 'hour',
    price: 600_000,
  },
  tankCleaning: {
    name: 'Water tank cleaning',
    description: 'Drain, scrub and disinfect an overhead or underground tank.',
    unit: 'tank',
    price: 3_500_000,
  },
  windowCleaning: {
    name: 'Window cleaning (2025 rate)',
    unit: 'window',
    price: 150_000,
    active: false,
  },
} satisfies Record<string, ServiceSeed>;

export type DemoServiceKey = keyof typeof DEMO_SERVICES;
