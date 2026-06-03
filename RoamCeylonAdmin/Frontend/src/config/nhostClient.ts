import { createClient } from '@nhost/nhost-js';

// A simple in-memory storage stub to prevent Nhost from trying to use
// window.localStorage, which doesn't exist in React Native.
let memSession: any = null;

const memorySessionStorage = {
  get: () => memSession,
  set: (val: any) => { memSession = val; },
  remove: () => { memSession = null; },
};

/**
 * Singleton Nhost client for the Admin app.
 * Uses the same Nhost project as the main RoamCeylon app.
 */
export const nhost = createClient({
  subdomain: process.env.EXPO_PUBLIC_NHOST_SUBDOMAIN!,
  region: process.env.EXPO_PUBLIC_NHOST_REGION!,
  storage: memorySessionStorage,
});
