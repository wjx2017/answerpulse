import Header from "@/components/Header";
import UpgradeButton from "@/components/UpgradeButton";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 px-4 pb-20">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Start free with 5 scans/month. Upgrade to Pro for unlimited power.
          </p>
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
          <div className="bg-white rounded-2xl border-2 border-pulse-600 p-8 shadow-lg relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-pulse-600 text-white text-xs font-bold rounded-full uppercase tracking-wide">
              Most Popular
            </div>
            <div className="text-sm font-semibold text-pulse-600 uppercase tracking-wide mb-2">Pro</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-bold text-gray-900">$9</span>
              <span className="text-gray-400">/month</span>
            </div>
            <p className="text-gray-400 text-sm mb-6">Paid securely via PayPal</p>
            <ul className="space-y-3 text-left mb-8">
              {[
                "Unlimited scans",
                "Full 8-dimension AEO analysis",
                "Full scan history (up to 100)",
                "Multi-engine detection",
                "Batch scanning",
                "Engine simulation preview",
                "Priority support",
                "Cancel anytime",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <UpgradeButton className="w-full justify-center" />
            <p className="text-xs text-gray-400 mt-3 text-center">
              PayPal payment · Pro activated after payment confirmation
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">FAQ</h2>
          <div className="space-y-4">
            {[
              {
                q: "How does PayPal payment work?",
                a: "Click the Upgrade button to go to PayPal's secure checkout. After your payment is confirmed, your Pro plan will be activated manually within 24 hours. You'll receive a confirmation email.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. Contact us to cancel your subscription. Your Pro access will continue until the end of your current billing period.",
              },
              {
                q: "What happens after I pay?",
                a: "Once we confirm your PayPal payment, we'll upgrade your account to Pro. You'll get unlimited scans, full history, and all Pro features immediately.",
              },
              {
                q: "Is there a free trial?",
                a: "The free plan includes 5 scans/month — no trial needed. Use it to see the value before upgrading.",
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
            <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
