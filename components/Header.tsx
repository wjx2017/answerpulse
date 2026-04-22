"use client";

import Link from "next/link";
import { useAuth } from "@/lib/use-auth";
import { isProActive, getProExpiryStatus } from "@/lib/config";

export default function Header() {
  const { user, profile, loading, signOut } = useAuth();
  const proActive = isProActive(profile);
  const expiryStatus = getProExpiryStatus(profile);
  const isExpired = expiryStatus === "expired";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-pulse-600 font-bold text-lg hover:text-pulse-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
          AnswerPulse
        </Link>

        <nav className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-8 bg-gray-100 rounded-lg animate-pulse" />
          ) : user ? (
            <>
              <Link
                href="/history"
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-pulse-600 transition-colors"
              >
                History
              </Link>
              {!proActive && (
                <Link
                  href="/pricing"
                  className="px-3 py-1.5 text-sm font-semibold text-pulse-700 bg-pulse-50 hover:bg-pulse-100 rounded-lg transition-colors"
                >
                  ⚡ Upgrade
                </Link>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 truncate max-w-[160px]" title={profile?.full_name || user?.email || ""}>
                  {profile?.full_name || user?.email || "User"}
                </span>
                {/* Hide PRO badge when expired; show scan count for free/expired users */}
                {proActive && !isExpired ? (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                    PRO
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">
                    {profile?.scans_used ?? 0}/5 this month
                  </span>
                )}
                <button
                  onClick={signOut}
                  className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/pricing"
                className="px-3 py-1.5 text-sm font-medium text-pulse-600 hover:text-pulse-700 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-pulse-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 text-sm font-medium text-white bg-pulse-600 hover:bg-pulse-700 rounded-lg transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
