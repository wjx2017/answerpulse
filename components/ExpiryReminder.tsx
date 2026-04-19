"use client";

import { useAuth } from "@/lib/use-auth";
import { getProExpiryStatus, getProDaysRemaining, PRO_PRICE_DISPLAY, PRO_DURATION_DAYS } from "@/lib/config";
import Link from "next/link";

/**
 * ExpiryReminder — in-app Pro expiry notification banner.
 *
 * Shown to logged-in Pro users whose access is:
 *   • Expiring soon (≤ 3 days remaining) — amber warning banner with CTA
 *   • Expired — red alert banner with strong CTA
 *
 * Hidden for: free users, active Pro users (> 3 days remaining), non-logged-in users.
 */
export default function ExpiryReminder() {
  const { user, profile, loading } = useAuth();

  if (loading || !user) return null;

  const status = getProExpiryStatus(profile);
  const daysLeft = getProDaysRemaining(profile);

  if (status === "none" || status === "active") return null;

  const expiryDate = profile?.pro_expires_at
    ? new Date(profile.pro_expires_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : null;

  // --- Expiring Soon (≤ 3 days) ---
  if (status === "expiringSoon") {
    return (
      <div className="max-w-3xl mx-auto mt-4 mb-2">
        <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-300 rounded-xl px-5 py-4 shadow-sm">
          <span className="text-2xl shrink-0" role="img" aria-label="warning">⚠️</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-900 text-sm">
              Your Pro access expires soon
            </p>
            <p className="text-sm text-amber-800 mt-1">
              {daysLeft === 0
                ? "Your Pro plan expires today. You'll return to the Free plan after today."
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

  // --- Expired ---
  if (status === "expired") {
    return (
      <div className="max-w-3xl mx-auto mt-4 mb-2">
        <div className="flex items-start gap-3 bg-red-50 border-2 border-red-300 rounded-xl px-5 py-4 shadow-sm">
          <span className="text-2xl shrink-0" role="img" aria-label="expired">⛔</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-900 text-sm">
              Your Pro access has expired
            </p>
            <p className="text-sm text-red-800 mt-1">
              Your Pro plan expired on {expiryDate}. Your account is now on the Free plan.
            </p>
            <p className="text-xs text-red-700 mt-1">
              {PRO_PRICE_DISPLAY} one-time · {PRO_DURATION_DAYS} days access · Manual renew, no auto-charge
            </p>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            Renew Pro — ${PRO_PRICE_DISPLAY}
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
