import type { NextApiRequest, NextApiResponse } from "next";
import { parseHtml } from "@/lib/cheerio-parser";
import { analyzeAeo } from "@/lib/aeo-analyzer";
import { checkRateLimit, releaseRateLimit } from "@/lib/rate-limiter";
import { createPagesServerClient } from "@/lib/supabase/pages";

interface AnalyzeHtmlBody {
  html: string;
  sourceUrl?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { html, sourceUrl } = req.body as AnalyzeHtmlBody;

  if (!html || typeof html !== "string") {
    return res.status(400).json({ error: "HTML content is required" });
  }

  if (html.length < 50) {
    return res.status(400).json({ error: "HTML content too short" });
  }

  // Check if user is authenticated
  const supabase = createPagesServerClient(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isIpLimited = false;
  let ip = "";

  if (user) {
    // Authenticated: check user scan limit
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, plan, scans_used, scans_reset_at")
      .eq("id", user.id)
      .single();

    const now = new Date();
    let scansUsed = profile?.scans_used ?? 0;
    let resetAt = profile?.scans_reset_at ? new Date(profile.scans_reset_at) : now;

    if (now >= resetAt) {
      scansUsed = 0;
      resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      await supabase
        .from("profiles")
        .update({ scans_used: 0, scans_reset_at: resetAt.toISOString() })
        .eq("id", user.id);
    }

    const plan = profile?.plan ?? "free";
    const freeLimit = 5;

    if (plan === "free" && scansUsed >= freeLimit) {
      return res.status(429).json({
        error: `Monthly scan limit reached (${freeLimit} scans/month). Upgrade to Pro for unlimited scans.`,
        remaining: 0,
        resetAt: resetAt.toISOString(),
        plan,
      });
    }

    res.setHeader("X-Scan-Remaining", plan === "pro" ? "unlimited" : String(freeLimit - scansUsed));
    res.setHeader("X-Scan-Plan", plan);
  } else {
    // Unauthenticated: IP-based rate limit
    const forwardedFor = req.headers["x-forwarded-for"];
    const realIp = req.headers["x-real-ip"];
    const socketIp = req.socket?.remoteAddress;

    if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
      ip = forwardedFor.split(",")[0].trim();
    } else if (typeof realIp === "string" && realIp.length > 0) {
      ip = realIp;
    } else if (typeof socketIp === "string" && socketIp.length > 0) {
      ip = socketIp;
    } else {
      ip = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    const rate = checkRateLimit(ip);
    if (!rate.allowed) {
      return res.status(429).json({
        error: "Daily scan limit reached (3 scans/day). Sign up for 5 scans/month.",
        remaining: 0,
        resetAt: rate.resetAt,
      });
    }

    isIpLimited = true;
    res.setHeader("X-RateLimit-Remaining", rate.remaining.toString());
    res.setHeader("X-RateLimit-Limit", "3");
  }

  let released = false;
  const cleanup = () => {
    if (!released && isIpLimited) {
      released = true;
      releaseRateLimit(ip);
    }
  };

  try {
    const parsed = parseHtml(html);
    const displayUrl = sourceUrl || "Pasted HTML";
    const report = analyzeAeo(parsed, displayUrl);

    // Save to scan history for authenticated users
    if (user) {
      await supabase.rpc("increment_scan_count", { user_id_param: user.id });
      await supabase.from("scan_history").insert({
        user_id: user.id,
        url: displayUrl,
        score: report.totalScore,
        result: report,
      });
    }

    cleanup();
    return res.status(200).json({ report, user: user ? { id: user.id } : null });
  } catch (err: any) {
    cleanup();
    return res.status(500).json({
      error: "Failed to analyze the HTML content.",
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};
