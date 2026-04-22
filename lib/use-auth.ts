import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: "free" | "pro";
  scans_used: number;
  scans_reset_at: string;
  pro_expires_at: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(supabase, session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(supabase, session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Listen for cross-component profile refresh events (e.g. after PayPal payment)
    const onRefresh = () => {
      if (user) fetchProfile(supabase, user.id);
    };
    window.addEventListener("answerpulse:profile-refresh", onRefresh);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("answerpulse:profile-refresh", onRefresh);
    };
  }, []);

  const fetchProfile = async (supabase: ReturnType<typeof createClient>, userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, plan, scans_used, scans_reset_at, pro_expires_at")
        .eq("id", userId)
        .single();
      if (data && !error) {
        // ── Proactive Pro expiry check ──
        // If Pro has expired, downgrade plan to 'free' immediately.
        // This ensures the UI reflects expired status even if the user
        // hasn't triggered a scan (which is the only place the downgrade
        // happened before — see /api/analyze).
        let profile = data as UserProfile;
        if (profile.plan === "pro" && profile.pro_expires_at) {
          const expiresAt = new Date(profile.pro_expires_at);
          if (Date.now() >= expiresAt.getTime()) {
            const now = new Date();
            const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            const { error: updateErr } = await supabase
              .from("profiles")
              .update({
                plan: "free",
                scans_used: 0,
                scans_reset_at: nextReset.toISOString(),
              })
              .eq("id", userId);
            if (!updateErr) {
              console.log(`[useAuth] Pro expired for user ${userId}, downgraded to free`);
              profile = { ...profile, plan: "free", scans_used: 0, scans_reset_at: nextReset.toISOString() };
            }
          }
        }
        setProfile(profile);
      }
    } catch (e) {
      console.error("Failed to fetch profile:", e);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const supabase = createClient();
      await fetchProfile(supabase, user.id);
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return { user, profile, loading, refreshProfile, signOut };
}
