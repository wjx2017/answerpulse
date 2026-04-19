"use client";

import Link from "next/link";
import { useAuth } from "@/lib/use-auth";
import { isProActive } from "@/lib/config";

/**
 * Plan-aware CTA shown below the scan area on the homepage.
 * - Pro users: no upsell, just a subtle status hint
 * - Free / not logged in: show upgrade CTA
 */
export default function ScanAreaCta() {
  const { profile, loading } = useAuth();
  const isPro = isProActive(profile);

  if (loading) return null;

  if (isPro) {
    return (
      <div className="mt-6">
        <span className="inline-flex items-center gap-2 text-sm text-amber-600 font-medium">
          ✨ Pro: Unlimited scans active
        </span>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 text-sm font-medium text-pulse-600 hover:text-pulse-700 transition-colors"
      >
        ⚡ Unlock unlimited scans — see Pro plans
      </Link>
    </div>
  );
}
