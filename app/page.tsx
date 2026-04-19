import Header from "@/components/Header";
import UrlInput from "@/components/UrlInput";
import ScanAreaCta from "@/components/ScanAreaCta";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-20 pt-24 bg-gradient-to-b from-pulse-50/50 to-gray-50">
        <div className="text-center mb-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-pulse-100 text-pulse-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-pulse-600 rounded-full animate-pulse" />
            AEO Scanner
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-5 leading-tight">
            Is Your Page Ready for{" "}
            <span className="text-pulse-600">Answer Engines</span>?
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Scan any URL and get an instant AEO (Answer Engine Optimization) score across 8 key dimensions. 
            Fast, no signup required.
          </p>
        </div>

        <UrlInput />

        {/* Pricing CTA — plan-aware */}
        <ScanAreaCta />

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Secure &amp; private
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Results in seconds
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            8-dimension analysis
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Why AEO Matters
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
            Answer engines (AI Overviews, ChatGPT, Perplexity) are changing how users find information. 
            Optimize for answers, not just clicks.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "📊",
                title: "Structured Data Check",
                desc: "Detect FAQ, Article, and HowTo schemas that answer engines rely on for direct answers.",
              },
              {
                icon: "❓",
                title: "Q&A Format Analysis",
                desc: "Identify question-answer patterns that match how AI models extract and present information.",
              },
              {
                icon: "✍️",
                title: "Readability Score",
                desc: "Calculate Flesch Reading Ease to ensure content is accessible for both users and AI.",
              },
              {
                icon: "🏗️",
                title: "Heading Structure",
                desc: "Verify proper H1-H3 hierarchy and question-word usage for better content parsing.",
              },
              {
                icon: "🏆",
                title: "Authority Signals",
                desc: "Check for author attribution, publication dates, and citation links that boost trust.",
              },
              {
                icon: "📱",
                title: "Mobile Readiness",
                desc: "Ensure viewport, language tags, and responsive patterns for mobile-first indexing.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-xl border border-gray-100 hover:border-pulse-200 hover:shadow-md transition-all bg-gray-50/50"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Check Your AEO Score?
          </h2>
          <p className="text-gray-500 mb-8">
            Enter any URL and get your detailed AEO report in seconds.
          </p>
          <UrlInput />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-pulse-600 font-bold">AnswerPulse</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="hover:text-gray-600 font-medium text-pulse-600">Pricing</Link>
            <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
