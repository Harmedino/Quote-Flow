import type { Service } from '../../models';

type ServiceSeed = Pick<Service, 'name' | 'description' | 'price' | 'unit'> & { active?: boolean };

/** Prices are in cents (USD). */
export const DEMO_SERVICES = {
  standardClean: {
    name: 'Standard home cleaning',
    description: 'Kitchen, bathrooms, dusting, vacuuming and mopping throughout.',
    unit: 'visit',
    price: 14_000,
  },
  deepClean: {
    name: 'Deep cleaning',
    description: 'Top-to-bottom clean including baseboards, inside cabinets and appliances.',
    unit: 'hour',
    price: 5_500,
  },
  moveOutClean: {
    name: 'Move-out cleaning',
    description: 'Full clean of an empty unit, ready for inspection and new tenants.',
    unit: 'unit',
    price: 32_000,
  },
  acTuneUp: {
    name: 'AC tune-up',
    description: 'Coil cleaning, refrigerant check, filter replacement and performance test.',
    unit: 'system',
    price: 12_900,
  },
  acCallOut: {
    name: 'AC diagnostic call-out',
    description: 'On-site fault diagnosis. Credited against any repair carried out the same day.',
    unit: 'visit',
    price: 8_900,
  },
  ductCleaning: {
    name: 'Air duct cleaning',
    unit: 'vent',
    price: 3_500,
  },
  interiorPainting: {
    name: 'Interior painting',
    description: 'Two coats of premium washable paint. Minor patching and sanding included.',
    unit: 'sq ft',
    price: 325,
  },
  exteriorPainting: {
    name: 'Exterior painting',
    description: 'Surface prep, primer where needed and two coats of exterior acrylic.',
    unit: 'sq ft',
    price: 410,
  },
  handyman: {
    name: 'Handyman labour',
    description: 'Repairs, mounting, assembly and small fixes.',
    unit: 'hour',
    price: 7_500,
  },
  gutterCleaning: {
    name: 'Gutter cleaning',
    description: 'Debris removal, downspout flush and visual inspection.',
    unit: 'linear ft',
    price: 125,
  },
  windowCleaning: {
    name: 'Window cleaning (2024 rate)',
    unit: 'window',
    price: 800,
    active: false,
  },
} satisfies Record<string, ServiceSeed>;

export type DemoServiceKey = keyof typeof DEMO_SERVICES;
