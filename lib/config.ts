/**
 * Centralised app configuration with env-var overrides and safe defaults.
 *
 * Pro price is a one-time payment for 30 days access (not a subscription).
 *   NEXT_PUBLIC_PRO_PRICE        – numeric amount (default "9")
 *   NEXT_PUBLIC_PRO_PRICE_LABEL  – suffix shown next to price (default "")
 *
 * Usage:
 *   import { PRO_PRICE, PRO_PRICE_LABEL, PRO_PRICE_DISPLAY } from "@/lib/config";
 */

export const PRO_PRICE = process.env.NEXT_PUBLIC_PRO_PRICE ?? "9";
export const PRO_PRICE_LABEL = process.env.NEXT_PUBLIC_PRO_PRICE_LABEL ?? "";

/** Full display string used in buttons / banners, e.g. "$9" */
export const PRO_PRICE_DISPLAY = process.env.NEXT_PUBLIC_PRO_PRICE_DISPLAY || `$${PRO_PRICE}`;

/** Pro access duration in days (one-time payment, not subscription) */
export const PRO_DURATION_DAYS = 30;

/**
 * Check if a user's Pro access is currently active based on plan and pro_expires_at.
 * Returns false if plan is not 'pro' OR if pro_expires_at has passed.
 * Works with both server-side Date objects and client-side string timestamps.
 */
export function isProActive(profile: { plan?: string; pro_expires_at?: string | null } | null | undefined): boolean {
  if (!profile || profile.plan !== "pro") return false;
  if (!profile.pro_expires_at) return true; // backward compat: no expiry set, assume active
  const expiresAt = new Date(profile.pro_expires_at);
  return Date.now() < expiresAt.getTime();
}
