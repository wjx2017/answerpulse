"use client";

import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
        <p className="text-gray-500 mb-6">
          Something went wrong during authentication. Please try again.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 bg-pulse-600 hover:bg-pulse-700 text-white font-semibold rounded-lg transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
