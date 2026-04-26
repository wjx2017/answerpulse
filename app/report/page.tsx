"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ScoreGauge from "@/components/ScoreGauge";
import BreakdownList from "@/components/BreakdownList";
import ProBanner from "@/components/ProBanner";
import ExpiryReminder from "@/components/ExpiryReminder";
import Header from "@/components/Header";
import { AeoReport } from "@/lib/aeo-analyzer";
import { exportCsv, exportPdf } from "@/lib/export-utils";

function ReportContent() {
  const searchParams = useSearchParams();
  const [report, setReport] = useState<AeoReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    if (!searchParams) return;
    const data = searchParams.get("d");
    if (data) {
      try {
        setReport(JSON.parse(decodeURIComponent(data)));
      } catch {
        setError("Failed to parse report data");
      }
    } else {
      setError("No report data found. Please run a scan first.");
    }
  }, [searchParams]);

  const handleExportCsv = useCallback(() => {
    if (!report) return;
    setExporting("csv");
    try {
      exportCsv(report);
    } catch (e) {
      console.error("CSV export failed:", e);
      alert("CSV export failed. Please try again.");
    }
    setExporting(null);
  }, [report]);

  const handleExportPdf = useCallback(async () => {
    if (!report) return;
    setExporting("pdf");
    try {
      await exportPdf(report);
    } catch (e) {
      console.error("PDF export failed:", e);
      alert("PDF export failed. Please try again.");
    }
    setExporting(null);
  }, [report]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Link href="/" className="text-pulse-600 hover:underline">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading report...</div>
      </div>
    );
  }

  const statusLabel =
    report.totalScore >= 70 ? "Good" : report.totalScore >= 40 ? "Needs Improvement" : "Poor";
  const statusColor =
    report.totalScore >= 70 ? "text-green-600" : report.totalScore >= 40 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Report Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 mt-16">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-pulse-600 font-bold hover:text-pulse-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            AnswerPulse
          </Link>
          <div data-role="export-bar" className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              disabled={exporting !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-pulse-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export as PDF"
            >
              📄 PDF
            </button>
            <button
              onClick={handleExportCsv}
              disabled={exporting !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-pulse-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export as CSV"
            >
              📊 CSV
            </button>
            {exporting && (
              <span className="text-xs text-gray-400">Exporting...</span>
            )}
            <Link
              href="/"
              className="ml-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              New Scan
            </Link>
          </div>
        </div>
      </header>

      <div id="report-content" className="max-w-4xl mx-auto px-4 py-10">
        {/* URL */}
        <div className="mb-8">
          <p className="text-sm text-gray-400 mb-1">Scanned URL</p>
          <a
            href={report.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-medium text-pulse-600 hover:text-pulse-700 break-all"
          >
            {report.url}
          </a>
          <p className="text-xs text-gray-400 mt-1">
            Scanned at {new Date(report.fetchTime).toLocaleString()}
          </p>
        </div>

        {/* SPA warning */}
        {report.isSpa && report.spaNote && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{report.spaNote}</span>
            </div>
          </div>
        )}

        {/* Score Dashboard */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8 shadow-sm">
          <div className="text-center mb-2">
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wide">AEO Score</p>
          </div>
          <div className="relative flex justify-center mb-4">
            <ScoreGauge score={report.totalScore} size={200} />
          </div>
          <p className={`text-center text-lg font-semibold ${statusColor}`}>{statusLabel}</p>
        </div>

        {/* 8 Dimensions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-5">8-Dimension Breakdown</h2>
          <BreakdownList dimensions={report.dimensions} />
        </div>

        {/* Expiry reminder — shown for Pro users expiring soon or expired */}
        <div data-role="expiry-reminder"><ExpiryReminder /></div>

        {/* Pro Banner */}
        <div data-role="pro-banner"><ProBanner /></div>

        {/* Scan another */}
        <div className="text-center mt-10 mb-6" data-role="scan-another">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-pulse-600 hover:text-pulse-700 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Scan another page
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>AnswerPulse © {new Date().getFullYear()}</span>
          <Link href="/terms" className="hover:text-gray-600">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
