"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { isProActive } from "@/lib/config";
import Link from "next/link";
import Header from "@/components/Header";

interface ScanRecord {
  id: string;
  url: string;
  score: number;
  result: any;
  created_at: string;
}

export default function HistoryPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      setLoading(false);
      return;
    }
    if (user) {
      fetchHistory();
    }
  }, [user, authLoading]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const limit = isProActive(profile) ? 100 : 10;

    const { data, error } = await supabase
      .from("scan_history")
      .select("id, url, score, result, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      setError(error.message);
    } else {
      setScans(data || []);
    }
    setLoading(false);
  };

  const handleDelete = useCallback(async (id: string) => {
    setDeleting(id);
    const supabase = createClient();
    const { error } = await supabase.from("scan_history").delete().eq("id", id);
    if (!error) {
      setScans((prev) => prev.filter((s) => s.id !== id));
    }
    setDeleting(null);
  }, []);

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 px-4 max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in to view your scan history</h1>
          <p className="text-gray-500 mb-6">Create a free account to save and track your scans.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/login" className="px-6 py-2.5 bg-pulse-600 hover:bg-pulse-700 text-white font-semibold rounded-lg transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="px-6 py-2.5 border border-gray-300 hover:border-pulse-600 text-gray-700 font-semibold rounded-lg transition-colors">
              Sign Up Free
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-24 px-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scan History</h1>
            <p className="text-sm text-gray-500 mt-1">
              {isProActive(profile) ? "Pro plan — unlimited history" : `Free plan — last 10 scans`}
              {scans.length > 0 && ` (${scans.length} saved)`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isProActive(profile) && (
              <Link
                href="/pricing"
                className="px-4 py-2 text-sm font-semibold text-pulse-700 bg-pulse-50 hover:bg-pulse-100 rounded-lg transition-colors"
              >
                ⚡ Upgrade to Pro
              </Link>
            )}
            <Link href="/" className="px-4 py-2 text-sm font-medium text-pulse-600 hover:text-pulse-700">
              ← New Scan
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-gray-400">Loading history...</div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        ) : scans.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 mb-4">No scans yet</p>
            <Link href="/" className="text-pulse-600 hover:text-pulse-700 font-medium">
              Run your first scan →
            </Link>
            {!isProActive(profile) && (
              <p className="mt-4">
                <Link href="/pricing" className="text-sm text-pulse-500 hover:text-pulse-700">
                  Upgrade to Pro for unlimited scans & full history →
                </Link>
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map((scan) => (
              <div
                key={scan.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-pulse-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <a
                      href={scan.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-900 hover:text-pulse-600 truncate block"
                    >
                      {scan.url}
                    </a>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(scan.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className={`text-lg font-bold ${
                      scan.score >= 70 ? "text-green-600" : scan.score >= 40 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {scan.score}
                    </div>
                    <Link
                      href={`/report?d=${encodeURIComponent(JSON.stringify(scan.result))}`}
                      className="px-3 py-1.5 text-sm font-medium text-pulse-600 hover:text-pulse-700 hover:bg-pulse-50 rounded-lg transition-colors"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(scan.id)}
                      disabled={deleting === scan.id}
                      className="px-2 py-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deleting === scan.id ? "..." : "✕"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
