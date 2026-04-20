import { createClient } from '@nhost/nhost-js';

// A simple in-memory storage stub to prevent Nhost from trying to use
// window.localStorage, which doesn't exist in React Native.
// We already handle persistent token storage manually via SecureStore
// in our AuthContext and API interceptors.
let memSession: any = null;

const memorySessionStorage = {
  get: () => memSession,
  set: (val: any) => { memSession = val; },
  remove: () => { memSession = null; },
};

/**
 * Singleton Nhost client.
 */
export const nhost = createClient({
  subdomain: process.env.EXPO_PUBLIC_NHOST_SUBDOMAIN!,
  region: process.env.EXPO_PUBLIC_NHOST_REGION!,
  storage: memorySessionStorage,
});
