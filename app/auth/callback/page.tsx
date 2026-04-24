"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const handleCallback = async () => {
      // Priority 1: Check for ?code= query param (Supabase PKCE flow — email verification, OAuth)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          router.replace("/");
          return;
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Failed to establish session";
          setError(message);
          setTimeout(() => router.replace("/"), 3000);
          return;
        }
      }

      // Priority 2: Check for hash fragment (legacy Supabase flow)
      // e.g. #access_token=xxx&token_type=bearer&expires_in=3600&refresh_token=yyy&type=signup
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.slice(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          try {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) throw error;
            router.replace("/");
            return;
          } catch (err: unknown) {
            const message =
              err instanceof Error
                ? err.message
                : "Failed to establish session";
            setError(message);
            setTimeout(() => router.replace("/"), 3000);
            return;
          }
        }
      }

      // No auth data found — nothing to process, redirect to home
      router.replace("/");
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-red-200 p-8 shadow-sm max-w-md text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">
            Verification Error
          </h1>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          <a
            href="/login"
            className="inline-block px-6 py-2 bg-pulse-600 text-white rounded-lg hover:bg-pulse-700 transition-colors text-sm font-medium"
          >
            Back to Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-pulse-600 border-t-transparent mx-auto mb-4" />
        <p className="text-gray-500">Verifying your email...</p>
      </div>
    </div>
  );
}
