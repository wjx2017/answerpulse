import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-pulse-600 hover:text-pulse-700 font-bold">
            ← Back to AnswerPulse
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-600">
          <p className="text-sm text-gray-400">Last updated: April 2026</p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. What We Collect</h2>
            <p>
              When you submit a URL for AEO analysis, we temporarily process the HTML content of that page.
              We do <strong>not</strong> store, log, or persist any URL, IP address, or page content beyond the duration of the analysis session.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Data Retention</h2>
            <p>
              All analyzed HTML content is discarded immediately after generating the report.
              Rate limiting data (scan counts per IP) is stored in memory and automatically cleared every 24 hours.
              No data is written to persistent storage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Cookies</h2>
            <p>
              We do not use tracking cookies or analytics. No personal data is collected.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Third-Party Services</h2>
            <p>
              This service is hosted on Vercel. Vercel may collect standard server logs (IP addresses, request times)
              for operational purposes. We do not access or use these logs for any purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Your Rights</h2>
            <p>
              Since we do not store personal data, there is no data to access, modify, or delete.
              If you have concerns, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Changes</h2>
            <p>
              We may update this policy. Changes will be posted on this page with an updated date.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
