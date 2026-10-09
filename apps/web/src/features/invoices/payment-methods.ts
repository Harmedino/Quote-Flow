import type { PaymentMethod } from '@quoteflow/shared';
import {
  Banknote,
  CircleDollarSign,
  CreditCard,
  Landmark,
  type LucideIcon,
  ScrollText,
  Smartphone,
} from 'lucide-react';

/** An icon for each way a customer can pay (outside QuoteFlow). */
export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, LucideIcon> = {
  cash: Banknote,
  bank_transfer: Landmark,
  card: CreditCard,
  mobile_money: Smartphone,
  cheque: ScrollText,
  other: CircleDollarSign,
};
