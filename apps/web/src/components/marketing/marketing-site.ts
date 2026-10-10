import { createContext, use } from 'react';

/** True inside the website's layout (MarketingLayout), where actions are pills, not app buttons. */
export const MarketingSiteContext = createContext(false);

export function useInMarketingSite(): boolean {
  return use(MarketingSiteContext);
}
