import Link from "next/link";

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-600">
          <p className="text-sm text-gray-400">Last updated: April 2026</p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Service Description</h2>
            <p>
              AnswerPulse is an AEO (Answer Engine Optimization) scanning and analysis tool.
              It evaluates web pages across 8 key dimensions—including structured data, Q&A format,
              readability, heading structure, authority signals, and mobile readiness—to help users
              improve their content&apos;s visibility in answer engines such as AI Overviews, ChatGPT, and Perplexity.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Account Registration</h2>
            <p>
              To access certain features of AnswerPulse, you must create an account. You agree to provide
              accurate, current, and complete information during registration and to keep your account
              information up to date. You are responsible for maintaining the confidentiality of your
              account credentials and for all activities that occur under your account. If you suspect
              unauthorized access, please notify us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Free Tier</h2>
            <p>
              AnswerPulse provides a free tier that includes <strong>5 scans per calendar month</strong>.
              Free scans reset at the start of each month. Unused free scans do not carry over.
              We reserve the right to modify or discontinue the free tier at any time with notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Pro Service</h2>
            <p>
              AnswerPulse offers a Pro plan available through one-time payment. Pro access is valid for
              <strong> 30 days</strong> from the date of purchase. There is <strong>no automatic renewal
              or subscription</strong>—your Pro access expires after the 30-day period unless you make a
              new purchase. After expiration, your account reverts to the free tier.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Refund Policy</h2>
            <p>
              You may request a refund within <strong>7 days</strong> of your Pro purchase. Refunds will
              not be issued if you have performed <strong>more than 5 Pro scans</strong> during that period.
              To request a refund, contact us through the support channels provided on our website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. User Conduct</h2>
            <p>
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Abuse, exploit, or disrupt the service or its infrastructure.</li>
              <li>Scrape, crawl, or systematically extract data from AnswerPulse without prior written consent.</li>
              <li>Use the service for any illegal or unauthorized purpose.</li>
              <li>Attempt to bypass scan limits, rate limits, or access controls.</li>
              <li>Use automated tools (bots, scripts) to interact with the service beyond normal browser usage.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Intellectual Property</h2>
            <p>
              AnswerPulse and its original content, features, and functionality are owned by AnswerPulse
              and are protected by applicable intellectual property laws. The scan results and reports
              generated for your URLs are provided for your personal or business use. You retain ownership
              of the content on your scanned pages; however, the analysis methodology and scoring framework
              remain our intellectual property.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Disclaimer of Warranties</h2>
            <p>
              AnswerPulse is provided on an &quot;as is&quot; and &quot;as available&quot; basis without
              warranties of any kind, either express or implied. The AEO scores and recommendations
              generated by our tool are <strong>for reference purposes only</strong> and do not guarantee
              any specific ranking, visibility, or performance in answer engines or search results.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, AnswerPulse shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, or any loss of profits or revenues,
              whether incurred directly or indirectly, or any loss of data, use, goodwill, or other
              intangible losses resulting from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to AnswerPulse at any time, with or
              without notice, if you violate these Terms or engage in conduct we determine to be harmful to
              the service, other users, or third parties. Upon termination, your right to use the service
              will cease immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">11. Governing Law &amp; Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws.
              Any disputes arising out of or relating to these Terms or your use of the service shall
              first be attempted to be resolved through good-faith negotiation. If negotiation fails,
              disputes shall be resolved through the competent courts or arbitration as required by
              applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">12. Changes to These Terms</h2>
            <p>
              We may update these Terms of Service from time to time. Material changes will be communicated
              by posting the updated terms on this page with a revised &quot;Last updated&quot; date.
              We encourage you to review these Terms periodically. Your continued use of AnswerPulse
              after changes are posted constitutes your acceptance of the updated Terms.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-400">
          <p>
            <Link href="/privacy" className="text-pulse-600 hover:text-pulse-700 hover:underline mr-4">
              Privacy Policy
            </Link>
            <Link href="/" className="text-pulse-600 hover:text-pulse-700 hover:underline">
              ← Back to AnswerPulse
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
