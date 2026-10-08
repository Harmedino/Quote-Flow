/** The current time. Injected where tests need to control it (token expiry, refresh grace window). */
export type Clock = () => Date;

export const systemClock: Clock = () => new Date();
