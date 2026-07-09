'use client';

import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import {
  approveVerification,
  rejectVerification,
  type VerificationRequest,
  type VerificationStatus,
} from '@/lib/api';

const STATUS_STYLES: Record<
  VerificationStatus,
  { label: string; badge: string; icon: typeof Clock }
> = {
  pending: {
    label: 'Pending',
    badge:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    badge:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    icon: XCircle,
  },
};

const FILTERS: { key: 'all' | VerificationStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

function DocTile({ label, url }: { label: string; url: string | null }) {
  const [broken, setBroken] = useState(false);
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-3 text-center h-32">
        <FileText className="w-5 h-5 text-zinc-400" />
        <span className="text-[11px] font-medium text-zinc-400">
          {label} — not provided
        </span>
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-teal-400 dark:hover:border-teal-500 transition-colors h-32"
    >
      {broken ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-1 bg-zinc-50 dark:bg-zinc-900">
          <FileText className="w-6 h-6 text-zinc-400" />
          <span className="text-[11px] text-zinc-500">Open document</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={label}
          onError={() => setBroken(true)}
          className="flex-1 w-full object-cover bg-zinc-100 dark:bg-zinc-900"
        />
      )}
      <div className="flex items-center justify-between px-2 py-1.5 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800">
        <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
        <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-teal-500" />
      </div>
    </a>
  );
}

export default function VerificationReview({
  initialRequests,
  unavailable,
}: {
  initialRequests: VerificationRequest[];
  unavailable: boolean;
}) {
  const [requests, setRequests] =
    useState<VerificationRequest[]>(initialRequests);
  const [filter, setFilter] = useState<'all' | VerificationStatus>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? requests
        : requests.filter((r) => r.status === filter),
    [requests, filter],
  );

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, all: requests.length };
    for (const r of requests) c[r.status]++;
    return c;
  }, [requests]);

  const patchLocal = (
    userId: string,
    status: VerificationStatus,
    reviewNotes: string | null,
  ) =>
    setRequests((prev) =>
      prev.map((r) =>
        r.userId === userId
          ? { ...r, status, reviewNotes, reviewedAt: new Date().toISOString() }
          : r,
      ),
    );

  const handleApprove = async (userId: string) => {
    setBusyId(userId);
    const ok = await approveVerification(userId);
    if (ok) patchLocal(userId, 'approved', null);
    else alert('Failed to approve. Please try again.');
    setBusyId(null);
  };

  const handleReject = async (userId: string) => {
    const reason = window.prompt('Reason for rejection (optional):') ?? undefined;
    setBusyId(userId);
    const ok = await rejectVerification(userId, reason);
    if (ok) patchLocal(userId, 'rejected', reason ?? null);
    else alert('Failed to reject. Please try again.');
    setBusyId(null);
  };

  if (unavailable) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-10 text-center">
        <ShieldCheck className="w-8 h-8 mx-auto text-zinc-400 mb-3" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Verification service unavailable
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          Could not reach the admin backend. Check that it is running and that
          NEXT_PUBLIC_ADMIN_API_URL is configured.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              filter === f.key
                ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white'
                : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            {f.label}
            <span className="ml-1.5 text-xs opacity-70">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
          <p className="text-sm text-zinc-500">
            No {filter === 'all' ? '' : filter} submissions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => {
            const s = STATUS_STYLES[r.status];
            const StatusIcon = s.icon;
            const busy = busyId === r.userId;
            return (
              <div
                key={r.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                      {r.user?.name || 'Unknown user'}
                    </p>
                    <p className="text-sm text-zinc-500 truncate">
                      {r.user?.email || r.userId}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {r.user?.role && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                          {r.user.role}
                        </span>
                      )}
                      {r.submittedAt && (
                        <span className="text-[11px] text-zinc-400">
                          Submitted{' '}
                          {new Date(r.submittedAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${s.badge}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {s.label}
                  </span>
                </div>

                {/* Documents */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <DocTile label="NIC / Passport" url={r.nicUrl} />
                  <DocTile label="Business License" url={r.businessLicenseUrl} />
                  <DocTile label="Selfie" url={r.selfieUrl} />
                </div>

                {/* Rejection note */}
                {r.status === 'rejected' && r.reviewNotes && (
                  <div className="mb-4 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg px-3 py-2">
                    Reason: {r.reviewNotes}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2">
                  {r.status !== 'rejected' && (
                    <button
                      disabled={busy}
                      onClick={() => handleReject(r.userId)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  )}
                  {r.status !== 'approved' && (
                    <button
                      disabled={busy}
                      onClick={() => handleApprove(r.userId)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
