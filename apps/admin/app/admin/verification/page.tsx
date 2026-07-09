import { getVerificationRequests } from '@/lib/api';
import VerificationReview from '@/components/verification/VerificationReview';

// Live review queue — always fetch fresh.
export const dynamic = 'force-dynamic';

export default async function VerificationPage() {
  const requests = await getVerificationRequests();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Business Verification
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Review partner document submissions and approve or reject their
          business verification.
        </p>
      </div>

      <VerificationReview
        initialRequests={requests ?? []}
        unavailable={requests === null}
      />
    </div>
  );
}
