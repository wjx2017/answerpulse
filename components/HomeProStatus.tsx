"use client";

import { useAuth } from "@/lib/use-auth";
import { isProActive, getProExpiryStatus, getProDaysRemaining, PRO_PRICE_DISPLAY, PRO_DURATION_DAYS } from "@/lib/config";
import Link from "next/link";

/**
 * Shown on the homepage for logged-in users:
 * - Pro active: amber Pro status bar with expiry info
 * - Pro expired: red expired banner with renewal CTA
 * - Free users: subtle upgrade prompt
 */
export default function HomeProStatus() {
  const { user, profile, loading } = useAuth();

  if (loading || !user) return null;

  const status = getProExpiryStatus(profile);

  // ── Pro expired ──
  if (status === "expired") {
    const expiryDate = profile?.pro_expires_at
      ? new Date(profile.pro_expires_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
      : null;

    return (
      <div className="max-w-3xl mx-auto mt-6">
        <div className="flex items-start gap-3 bg-red-50 border-2 border-red-300 rounded-xl px-5 py-4">
          <span className="text-2xl shrink-0" role="img" aria-label="expired">⛔</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-900 text-sm">
              Your Pro access has expired
            </p>
            <p className="text-sm text-red-800 mt-1">
              {expiryDate ? `Your Pro plan expired on ${expiryDate}.` : "Your Pro plan has expired."} You are now on the Free plan with 5 scans/month.
            </p>
            <p className="text-xs text-red-700 mt-1">
              {PRO_PRICE_DISPLAY} one-time · {PRO_DURATION_DAYS} days access · Manual renew, no auto-charge
            </p>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            Renew Pro
          </Link>
        </div>
      </div>
    );
  }

  // ── Pro expiring soon (≤ 3 days) ──
  if (status === "expiringSoon") {
    const daysLeft = getProDaysRemaining(profile);
    const expiryDate = profile?.pro_expires_at
      ? new Date(profile.pro_expires_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
      : null;

    return (
      <div className="max-w-3xl mx-auto mt-6">
        <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-300 rounded-xl px-5 py-4">
          <span className="text-2xl shrink-0" role="img" aria-label="warning">⚠️</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-900 text-sm">
              Your Pro access expires soon
            </p>
            <p className="text-sm text-amber-800 mt-1">
              {daysLeft === 0
                ? "Your Pro plan expires today."
                : `You have ${daysLeft} day${daysLeft === 1 ? "" : "s"} of Pro access remaining (expires ${expiryDate}).`}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              {PRO_PRICE_DISPLAY} one-time · {PRO_DURATION_DAYS} days access · Manual renew, no auto-charge
            </p>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            Renew Pro
          </Link>
        </div>
      </div>
    );
  }

  // ── Pro active (> 3 days remaining) ──
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

  // ── Free user — subtle upgrade nudge ──
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
