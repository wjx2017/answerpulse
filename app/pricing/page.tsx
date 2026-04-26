"use client";

import Header from "@/components/Header";
import PayPalButton from "@/components/PayPalButton";
import ExpiryReminder from "@/components/ExpiryReminder";
import Link from "next/link";
import { PRO_PRICE, PRO_PRICE_DISPLAY, isProActive, getProExpiryStatus, PRO_DURATION_DAYS } from "@/lib/config";
import { useAuth } from "@/lib/use-auth";

export default function PricingPage() {
  const { user, profile, loading } = useAuth();
  const proActive = isProActive(profile);
  const expiryStatus = getProExpiryStatus(profile);
  // Treat expired/expiringSoon as not active for pricing display
  const showAsActive = expiryStatus === "active";

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 px-4 pb-20">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Start free with 5 scans per month. Get Pro for unlimited power — one-time payment, 30 days access.
          </p>
          {/* Expiry reminder for Pro users */}
          <ExpiryReminder />
          {showAsActive && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-sm text-amber-700 font-medium">
              <span>⭐</span>
              You are on <span className="font-bold">Pro</span> — unlimited scans & full history
            </div>
          )}
          {expiryStatus === "expired" && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full text-sm text-red-700 font-medium">
              <span>⛔</span>
              Your Pro has <span className="font-bold">expired</span> — renew below to regain unlimited access
            </div>
          )}
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Free</div>
            <div className="text-4xl font-bold text-gray-900 mb-1">$0</div>
            <p className="text-gray-400 text-sm mb-6">Forever free</p>
            <ul className="space-y-3 text-left mb-8">
              {[
                "5 scans per month",
                "8-dimension AEO analysis",
                "Instant PDF/CSV export",
                "Basic scan history (last 10)",
                "No credit card required",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/"
              className="block w-full py-3 text-center font-semibold rounded-xl border-2 border-gray-200 text-gray-700 hover:border-pulse-600 hover:text-pulse-600 transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className={`bg-white rounded-2xl p-8 shadow-lg relative ${showAsActive ? "border-2 border-amber-400" : "border-2 border-pulse-600"}`}>
            {showAsActive ? (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-500 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                Current Plan
              </div>
            ) : expiryStatus === "expired" ? (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-500 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                Renew Now
              </div>
            ) : (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-pulse-600 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                Most Popular
              </div>
            )}
            <div className={`text-sm font-semibold uppercase tracking-wide mb-2 ${showAsActive ? "text-amber-600" : expiryStatus === "expired" ? "text-red-600" : "text-pulse-600"}`}>Pro</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-bold text-gray-900">${PRO_PRICE}</span>
            </div>
            <p className="text-gray-400 text-sm mb-6">one-time payment • 30 days access</p>

            {/* Pro active: show expiry info + Start Scanning */}
            {showAsActive ? (
              <>
                <ul className="space-y-3 text-left mb-8">
                  {[
                    "Unlimited scans",
                    "Full 8-dimension AEO analysis",
                    "Full scan history (up to 100)",
                    "Multi-engine detection",
                    "Batch scanning",
                    "Engine simulation preview",
                    "Priority support",
                    "No auto-renewal",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                {profile?.pro_expires_at && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    <span className="font-semibold">Pro active until </span>
                    {new Date(profile.pro_expires_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    {(() => {
                      const daysLeft = Math.max(0, Math.ceil((new Date(profile.pro_expires_at!).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
                      return daysLeft > 0 ? <span className="ml-1">({daysLeft} days remaining)</span> : null;
                    })()}
                  </div>
                )}
                <Link
                  href="/"
                  className="block w-full py-3 text-center font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                >
                  Start Scanning →
                </Link>
              </>
            ) : (
              <>
                <ul className="space-y-3 text-left mb-8">
                  {[
                    "Unlimited scans",
                    "Full 8-dimension AEO analysis",
                    "Full scan history (up to 100)",
                    "Multi-engine detection",
                    "Batch scanning",
                    "Engine simulation preview",
                    "Priority support",
                    "No auto-renewal",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                {expiryStatus === "expired" && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                    <span className="font-semibold">⛔ Pro expired</span>
                    {profile?.pro_expires_at && (
                      <> — expired on {new Date(profile.pro_expires_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</>
                    )}
                    <br />
                    <span>Renew below to regain unlimited access.</span>
                  </div>
                )}
                <PayPalButton />
                <p className="text-xs text-gray-400 mt-3 text-center">
                  ${PRO_PRICE} one-time payment · {PRO_DURATION_DAYS} days Pro · No auto-renewal · Pro activated automatically after payment
                </p>
              </>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">FAQ</h2>
          <div className="space-y-4">
            {[
              {
                q: "How long does Pro last?",
                a: "Pro access is valid for 30 days from the date of purchase.",
              },
              {
                q: "Will I be charged automatically?",
                a: "No. AnswerPulse Pro is a one-time payment with no auto-renewal. You choose when to renew.",
              },
              {
                q: "How do I renew my Pro access?",
                a: "After your 30-day access expires, you can manually purchase Pro again at any time from the Pricing page.",
              },
              {
                q: "What happens when my Pro expires?",
                a: "Your account returns to the Free plan. You can continue using free features, or renew Pro whenever you're ready.",
              },
              {
                q: "How does PayPal payment work?",
                a: "Click the PayPal Checkout button on the Pro plan to pay securely. After payment is confirmed, your Pro plan is activated instantly — no waiting, no manual steps.",
              },
              {
                q: "What happens after I pay?",
                a: "Your Pro access is activated instantly after payment confirmation. You'll get unlimited scans, full history, and all Pro features immediately. If anything goes wrong, contact support.",
              },
              {
                q: "Is there a refund policy?",
                a: "Refunds can be requested within 7 days of purchase. If you have used Pro features more than 5 times, refunds are not supported. Contact support@answerpulse.com for assistance.",
              },
              {
                q: "Is there a free trial?",
                a: "The free plan includes 5 scans per month — no trial needed. Use it to see the value before upgrading.",
              },
            ].map((faq) => (
              <details key={faq.q} className="group bg-white rounded-xl border border-gray-200 p-5">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="text-sm text-gray-500 mt-3 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-pulse-600 font-bold">AnswerPulse</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-gray-600">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
