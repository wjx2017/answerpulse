"use client";

import { useAuth } from "@/lib/use-auth";
import { isProActive } from "@/lib/config";
import Link from "next/link";

/**
 * Shown on the homepage for logged-in users:
 * - Pro users: a compact Pro status bar with expiry info + link to manage
 * - Free users: a subtle upgrade prompt (less intrusive than full ProBanner)
 */
export default function HomeProStatus() {
  const { user, profile, loading } = useAuth();

  if (loading || !user) return null;

  if (isProActive(profile)) {
    const expiry = profile?.pro_expires_at ? new Date(profile.pro_expires_at) : null;
    const daysLeft = expiry
      ? Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
      : null;
    const dateLabel = expiry
      ? expiry.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
      : null;

    return (
      <div className="max-w-3xl mx-auto mt-6">
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <span className="text-sm font-semibold text-amber-800">Pro active</span>
            {dateLabel && (
              <span className="text-sm text-amber-700">
                until {dateLabel}
                {daysLeft !== null && daysLeft > 0 && (
                  <span className="ml-1 text-amber-600">({daysLeft} days remaining)</span>
                )}
              </span>
            )}
          </div>
          <Link
            href="/pricing"
            className="text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
          >
            View plans →
          </Link>
        </div>
      </div>
    );
  }

  // Free user — subtle upgrade nudge
  return (
    <div className="max-w-3xl mx-auto mt-6">
      <Link
        href="/pricing"
        className="flex items-center justify-between bg-pulse-50 border border-pulse-100 rounded-xl px-5 py-3 hover:bg-pulse-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="text-sm font-medium text-pulse-700">
            Upgrade to Pro — unlimited scans & full history
          </span>
        </div>
        <span className="text-sm font-semibold text-pulse-600">Learn more →</span>
      </Link>
    </div>
  );
}
