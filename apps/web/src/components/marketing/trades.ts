import {
  Camera,
  Droplets,
  Hammer,
  type LucideIcon,
  PaintRoller,
  Paintbrush,
  PartyPopper,
  Plug,
  Snowflake,
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
  /** The anchor of the trade's section on the Solutions page. */
  id: TradeId;
  name: string;
  icon: LucideIcon;
}

/** The kinds of business QuoteFlow is built for, as grouped on the Solutions page. */
export const TRADES: Trade[] = [
  { id: 'cleaning', name: 'Cleaning', icon: Sparkles },
  { id: 'plumbing-electrical', name: 'Plumbing & electrical', icon: Wrench },
  { id: 'ac-solar', name: 'AC & solar', icon: SolarPanel },
  { id: 'painting-carpentry', name: 'Painting & carpentry', icon: PaintRoller },
  { id: 'events-catering', name: 'Events, decor & catering', icon: PartyPopper },
  { id: 'photography-makeup', name: 'Photography & makeup', icon: Camera },
];

export const tradePath = (trade: Pick<Trade, 'id'>) => `${paths.solutions}#${trade.id}`;

/** The people on the home page's trades band, each linking to their trade on the Solutions page. */
export const TRADE_BAND: { label: string; icon: LucideIcon; trade: TradeId }[] = [
  { label: 'Cleaners', icon: Sparkles, trade: 'cleaning' },
  { label: 'Plumbers', icon: Droplets, trade: 'plumbing-electrical' },
  { label: 'Electricians', icon: Plug, trade: 'plumbing-electrical' },
  { label: 'AC & solar', icon: Snowflake, trade: 'ac-solar' },
  { label: 'Painters', icon: Paintbrush, trade: 'painting-carpentry' },
  { label: 'Carpenters', icon: Hammer, trade: 'painting-carpentry' },
  { label: 'Decor & catering', icon: PartyPopper, trade: 'events-catering' },
  { label: 'Photographers', icon: Camera, trade: 'photography-makeup' },
];
