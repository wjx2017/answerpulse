"use client";

export default function ProBanner() {
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
          Get multi-engine detection, competitor comparison, batch scanning, and detailed improvement roadmaps.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-lg mx-auto mb-6">
          {[
            "Unlimited scans per day",
            "Multi-engine detection",
            "Competitor comparison",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-green-300 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {feature}
            </div>
          ))}
        </div>
        <button className="px-8 py-3 bg-white text-pulse-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg">
          Coming Soon — Join Waitlist
        </button>
      </div>
    </div>
  );
}
