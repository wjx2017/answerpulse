"use client";

import Link from "next/link";
import { useAuth } from "@/lib/use-auth";
import { isProActive } from "@/lib/config";

/**
 * Plan-aware CTA shown below the scan area on the homepage.
 * - Pro users: hidden (HomeProStatus already shows Pro status)
 * - Free / not logged in: show upgrade CTA
 */
export default function ScanAreaCta() {
  const { profile, loading } = useAuth();
  const isPro = isProActive(profile);

  if (loading) return null;

  if (isPro) return null; // HomeProStatus already shows Pro status on homepage

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
