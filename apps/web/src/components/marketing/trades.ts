import {
  Camera,
  type LucideIcon,
  PaintRoller,
  PartyPopper,
  SolarPanel,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { paths } from '@/app/paths';

export type TradeId =
  | 'cleaning'
  | 'plumbing-electrical'
  | 'ac-solar'
  | 'painting-carpentry'
  | 'events-catering'
  | 'photography-makeup';

export interface Trade {
  /** The anchor of the trade's card on the Solutions page. */
  id: TradeId;
  name: string;
  icon: LucideIcon;
  /** The kind of jobs it quotes, for the home page. */
  jobs: string;
}

/** The kinds of business QuoteFlow is built for, as grouped on the Solutions page. */
export const TRADES: Trade[] = [
  {
    id: 'cleaning',
    name: 'Cleaning',
    icon: Sparkles,
    jobs: 'Deep cleans, move-outs, offices and post-construction',
  },
  {
    id: 'plumbing-electrical',
    name: 'Plumbing & electrical',
    icon: Wrench,
    jobs: 'Call-outs, rewiring, leaks, fittings and repairs',
  },
  {
    id: 'ac-solar',
    name: 'AC & solar',
    icon: SolarPanel,
    jobs: 'Installs, servicing, inverters, batteries and panels',
  },
  {
    id: 'painting-carpentry',
    name: 'Painting & carpentry',
    icon: PaintRoller,
    jobs: 'Repaints, screeding, doors, wardrobes and fittings',
  },
  {
    id: 'events-catering',
    name: 'Events, decor & catering',
    icon: PartyPopper,
    jobs: 'Food per head, small chops, hall decor and staff',
  },
  {
    id: 'photography-makeup',
    name: 'Photography & makeup',
    icon: Camera,
    jobs: 'Wedding coverage, shoots, albums and bridal glam',
  },
];

export const tradePath = (trade: Trade) => `${paths.solutions}#${trade.id}`;
