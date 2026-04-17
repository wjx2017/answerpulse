import type { NextApiRequest, NextApiResponse } from "next";
import { parseHtml } from "@/lib/cheerio-parser";
import { analyzeAeo } from "@/lib/aeo-analyzer";
import { checkRateLimit, releaseRateLimit } from "@/lib/rate-limiter";
import { createPagesServerClient } from "@/lib/supabase/pages";

interface AnalyzeBody {
  url: string;
}

/**
 * Try fetching a URL with HTTPS first, fall back to HTTP on network failures.
 */
async function fetchWithFallback(
  url: string
): Promise<{ html: string; finalUrl: string }> {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (compatible; AnswerPulse/1.0; AEO Scanner; +https://answerpulse.com)",
    Accept: "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8",
  };

  try {
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(15000),
    });
    const html = await res.text();
    return { html, finalUrl: url };
  } catch (err: any) {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === "https:";

    if (isHttps) {
      const isDnsFailure =
        err.message?.includes("ENOTFOUND") ||
        err.message?.includes("getaddrinfo");
      if (!isDnsFailure) {
        console.log(
          `[Analyze] HTTPS fetch failed (${err.name || err.code || err.message?.slice(0, 80)}), trying HTTP fallback for ${urlObj.hostname}`
        );
        const httpUrl = `http://${urlObj.hostname}${urlObj.pathname}${urlObj.search}`;
        const res = await fetch(httpUrl, {
          headers,
          signal: AbortSignal.timeout(15000),
        });
        const html = await res.text();
        return { html, finalUrl: httpUrl };
      }
    }

    throw err;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body as AnalyzeBody;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL format" });
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
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, plan, scans_used, scans_reset_at")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("[Analyze] Profile fetch error:", profileError);
    }

    const now = new Date();
    let scansUsed = profile?.scans_used ?? 0;
    let resetAt = profile?.scans_reset_at ? new Date(profile.scans_reset_at) : now;

    // Reset monthly count if past reset time
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
    // Unauthenticated: IP-based rate limit (3/day)
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

  // Lock is held for IP-limited users - release on completion
  let released = false;
  const cleanup = () => {
    if (!released && isIpLimited) {
      released = true;
      releaseRateLimit(ip);
    }
  };

  // Fetch the page with HTTPS → HTTP fallback
  try {
    const { html, finalUrl } = await fetchWithFallback(url);

    if (html.length < 100) {
      cleanup();
      return res.status(400).json({
        error: "Page content too short, may be blocked or empty",
      });
    }

    // Parse and analyze
    const parsed = parseHtml(html);
    const report = analyzeAeo(parsed, finalUrl);

    // Save to scan history for authenticated users
    if (user) {
      // Increment scan count
      await supabase.rpc("increment_scan_count", { user_id_param: user.id });

      // Save to history
      await supabase.from("scan_history").insert({
        user_id: user.id,
        url: finalUrl,
        score: report.totalScore,
        result: report,
      });
    }

    cleanup();

    return res.status(200).json({
      report,
      user: user ? { id: user.id } : null,
    });
  } catch (err: any) {
    cleanup();

    if (err.name === "TimeoutError" || err.name === "AbortError" || err.code === "UND_ERR_CONNECT_TIMEOUT") {
      return res.status(400).json({
        error: "Request timed out. The server may be slow or blocking scrapers.",
      });
    }
    if (err.message?.includes("ECONNREFUSED") || err.message?.includes("ENOTFOUND")) {
      return res.status(400).json({
        error: "Unable to connect to the server. Please check the URL and try again.",
      });
    }
    return res.status(500).json({
      error: "Failed to fetch or analyze the page. Please check the URL and try again.",
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};
