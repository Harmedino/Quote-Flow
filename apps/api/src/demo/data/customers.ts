import type { Customer } from '../../models';

export type CustomerSeed = Pick<
  Customer,
  'name' | 'email' | 'phone' | 'company' | 'address' | 'notes'
> & {
  /** Archived customers stay on their old documents but are hidden from new work. */
  archivedDaysAgo?: number;
};

/** A Lagos address the way it is written there: street, area, state. */
const lagos = (line1: string, area: string) => ({
  line1,
  city: area,
  state: 'Lagos',
  country: 'Nigeria',
});

const customers = {
  adaeze: {
    name: 'Adaeze Okonkwo',
    email: 'adaeze.okonkwo@example.com',
    phone: '+234 802 555 0101',
    address: lagos('5 Bourdillon Road', 'Ikoyi'),
    notes: 'Prefers morning visits. Leave the gate pass with the estate security.',
  },
  tunde: {
    name: 'Tunde Bakare',
    email: 'tunde.bakare@example.net',
    phone: '+234 803 555 0102',
    address: lagos('18 Adebayo Doherty Road', 'Lekki Phase 1'),
  },
  smileCare: {
    name: 'Dr. Ngozi Eze',
    company: 'SmileCare Dental Clinic',
    email: 'office@smilecare-dental.example',
    phone: '+234 805 555 0103',
    address: { ...lagos('22 Allen Avenue', 'Ikeja'), line2: 'Second floor' },
    notes:
      'Commercial client. Work must be scheduled outside clinic hours (after 6pm or on Sundays).',
  },
  chinedu: {
    name: 'Chinedu Obi',
    email: 'chinedu.obi@example.com',
    phone: '+234 806 555 0104',
    address: lagos('9 Ogunlana Drive', 'Surulere'),
  },
  palmView: {
    name: 'Kemi Adeyemi',
    company: 'Palm View Estates',
    email: 'maintenance@palmview-estates.example',
    phone: '+234 807 555 0105',
    address: { ...lagos('3 Ozumba Mbadiwe Avenue', 'Victoria Island'), line2: 'Floor 9' },
    notes: 'Manages 40+ flats. Send invoices to the maintenance inbox; PO number required.',
  },
  bisi: {
    name: 'Bisi Ogunleye',
    email: 'bisi.ogunleye@example.org',
    phone: '+234 808 555 0106',
    address: lagos('14 Isaac John Street', 'Ikeja GRA'),
  },
  musa: {
    name: 'Musa Ibrahim',
    phone: '+234 809 555 0107',
    address: lagos('7 Akerele Street', 'Surulere'),
    notes: 'No email. Call or send a WhatsApp message.',
  },
  ofadaCorner: {
    name: 'Amaka Nwankwo',
    company: 'Ofada Corner Café',
    email: 'amaka@ofadacorner.example',
    phone: '+234 810 555 0108',
    address: lagos('41 Herbert Macaulay Way', 'Yaba'),
  },
  segun: {
    name: 'Segun Alade',
    email: 'segun.alade@example.com',
    address: lagos('12 Glover Road', 'Ikoyi'),
  },
  grace: {
    name: 'Grace Okafor',
    email: 'grace.okafor@example.net',
    phone: '+234 811 555 0110',
    address: lagos('25 Bode Thomas Street', 'Surulere'),
  },
  harbourPoint: {
    name: 'Ifeanyi Okeke',
    company: 'Harbour Point Realty',
    email: 'ifeanyi@harbourpoint.example',
    phone: '+234 812 555 0111',
    address: lagos('10 Admiralty Road', 'Lekki Phase 1'),
  },
  yetunde: {
    name: 'Yetunde Bello',
    email: 'yetunde.bello@example.org',
    phone: '+234 813 555 0112',
    notes: 'Moved to Abuja.',
    archivedDaysAgo: 20,
  },
} satisfies Record<string, CustomerSeed>;

export type DemoCustomerKey = keyof typeof customers;

export const DEMO_CUSTOMERS: Record<DemoCustomerKey, CustomerSeed> = customers;
