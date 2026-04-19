"use client";

import { useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";

type InputMode = "url" | "html";

export default function UrlInput() {
  const [mode, setMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isProcessingRef = useRef(false); // P0 fix: synchronous guard against concurrent submits
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // P0 fix: synchronous guard — prevents React StrictMode double-submit race
    if (isProcessingRef.current) {
      console.log("[UrlInput] Duplicate submit blocked");
      return;
    }
    isProcessingRef.current = true;
    setLoading(true);

    try {
      let endpoint: string;
      let body: Record<string, string>;

      if (mode === "html") {
        if (!html.trim()) return;
        endpoint = "/api/analyze-html";
        body = { html: html.trim() };
      } else {
        let processedUrl = url.trim();
        if (!processedUrl) return;
        // Auto-prepend protocol if missing
        if (!processedUrl.startsWith("http://") && !processedUrl.startsWith("https://")) {
          processedUrl = "https://" + processedUrl;
        }

        try {
          new URL(processedUrl);
        } catch {
          setError("Please enter a valid URL");
          return;
        }

        endpoint = "/api/analyze";
        body = { url: processedUrl };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Analysis failed");
        return;
      }

      // Navigate to report with data via search params
      const encoded = encodeURIComponent(JSON.stringify(data.report));
      router.push(`/report?d=${encoded}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      {/* Mode Toggle Tabs */}
      <div className="flex gap-0 mb-3">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`px-5 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
            mode === "url"
              ? "bg-white border-pulse-600 text-pulse-700"
              : "bg-gray-100 border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          🔗 URL Scan
        </button>
        <button
          type="button"
          onClick={() => setMode("html")}
          className={`px-5 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
            mode === "html"
              ? "bg-white border-pulse-600 text-pulse-700"
              : "bg-gray-100 border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          📋 Paste HTML
        </button>
      </div>

      {/* Input Area */}
      <div className="bg-white rounded-xl rounded-tl-none border-2 border-gray-200 shadow-sm overflow-hidden">
        {mode === "url" ? (
          <div className="relative">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL to scan (e.g., https://example.com/blog/faq)"
              className="w-full px-5 py-4 focus:outline-none text-lg pr-12"
              disabled={loading}
            />
            <svg
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
        ) : (
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder="Paste your HTML source code here..."
            rows={8}
            className="w-full px-5 py-4 focus:outline-none text-sm font-mono resize-y"
            disabled={loading}
          />
        )}

        {/* Submit Button */}
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 flex justify-end">
          <button
            type="submit"
            disabled={loading || (mode === "url" ? !url.trim() : !html.trim())}
            className="px-8 py-3 bg-pulse-600 hover:bg-pulse-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-pulse-600/25 min-w-[140px] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Scanning...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Analyze
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-3 text-red-500 text-sm text-center">{error}</p>
      )}

      {/* Footer text */}
      <p className="mt-3 text-xs text-gray-400 text-center">
        By analyzing, you agree to our{" "}
        <a href="/privacy" className="underline hover:text-gray-600">
          Privacy Policy
        </a>
        . 3 scans/day for free users.
      </p>
    </form>
  );
}
