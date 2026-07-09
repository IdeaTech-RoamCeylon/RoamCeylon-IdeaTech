// Business-verification status helper.
//
// The mobile app has no global auth/role store, so each "add" entry point
// calls `ensureVerified` to gate the action. Status comes from the admin
// backend (`GET /verification/me`).

import * as SecureStore from 'expo-secure-store';
import type { useRouter } from 'expo-router';
import { showToast } from './toast';

type AppRouter = ReturnType<typeof useRouter>;

const apiUrl = () =>
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface VerificationRecord {
  status: VerificationStatus;
  nicUrl?: string | null;
  businessLicenseUrl?: string | null;
  selfieUrl?: string | null;
  reviewNotes?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
}

/** Fetch the current user's verification record (or null if unavailable). */
export async function getVerification(): Promise<VerificationRecord | null> {
  try {
    const token = await SecureStore.getItemAsync('authToken');
    if (!token) return null;
    const res = await fetch(`${apiUrl()}/verification/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as VerificationRecord;
  } catch {
    return null;
  }
}

/**
 * Guard an "add" action. Returns true if the user may proceed.
 * If not approved, shows a prompt and routes to the verification screen.
 *
 * @param router            expo-router router instance
 * @param verificationRoute e.g. '/booking/businessVerification'
 */
export async function ensureVerified(
  router: AppRouter,
  verificationRoute: string,
): Promise<boolean> {
  const rec = await getVerification();
  if (rec?.status === 'approved') return true;

  const msg =
    rec?.status === 'pending'
      ? 'Your verification is under review. You can add listings once it is approved.'
      : rec?.status === 'rejected'
        ? 'Your verification was rejected. Please review and resubmit your documents in Settings.'
        : 'Please verify your business in Settings before adding listings.';

  showToast.info(msg, 'Verification Required');
  router.push(verificationRoute as never);
  return false;
}
