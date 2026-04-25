import { Purchases } from '@revenuecat/purchases-js';

const RC_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY as string;

let lastUserId: string | null = null;

export function configureRevenueCat(userId: string): void {
  if (!RC_API_KEY) return;
  if (lastUserId === userId) return;
  Purchases.configure(RC_API_KEY, userId);
  lastUserId = userId;
}

export { Purchases };
