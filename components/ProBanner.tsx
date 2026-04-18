"use client";

import Link from "next/link";
import { useAuth } from "@/lib/use-auth";
import UpgradeButton from "@/components/UpgradeButton";

export default function ProBanner() {
  const { user, profile } = useAuth();

  if (profile?.plan === "pro") {
    return (
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="font-semibold">Pro Plan Active</span>
          <span className="text-sm text-white/80">Unlimited scans · Full history</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-pulse-600 to-pulse-700 rounded-2xl p-8 text-white shadow-xl">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Pro
        </div>
        <h3 className="text-2xl font-bold mb-3">Unlock Full AEO Analysis</h3>
        <p className="text-pulse-100 mb-6 max-w-xl mx-auto">
          Get unlimited scans, full history, multi-engine detection, batch scanning, and detailed improvement roadmaps.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-lg mx-auto mb-6">
          {[
            "Unlimited scans",
            "Full scan history",
            "Multi-engine detection",
            "Batch scanning",
            "Engine simulation",
            "Priority support",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-green-300 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {feature}
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {user ? (
            <UpgradeButton />
          ) : (
            <>
              <Link
                href="/register"
                className="px-8 py-3 bg-white text-pulse-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
              >
                Sign Up Free — 5 scans/month
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
        <p className="text-pulse-200 text-sm mt-4">$9/month via PayPal · Pay securely, upgrade instantly after payment confirmation</p>
      </div>
    </div>
  );
}
