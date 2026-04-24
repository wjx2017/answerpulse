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
      const hash = window.location.hash;
      if (!hash) {
        // No hash fragment — nothing to process, redirect to home
        router.replace("/");
        return;
      }

      // Parse hash fragment (e.g. #access_token=xxx&token_type=bearer&expires_in=3600&refresh_token=yyy&type=signup)
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
          // Session established successfully — redirect to home
          router.replace("/");
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to establish session";
          setError(message);
          // Still redirect to home after a short delay so user sees the error
          setTimeout(() => router.replace("/"), 3000);
        }
      } else {
        // No token in hash — just redirect to home
        router.replace("/");
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-red-200 p-8 shadow-sm max-w-md text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">Verification Error</h1>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          <p className="text-gray-400 text-sm">Redirecting to home...</p>
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
