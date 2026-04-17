import type { NextApiRequest, NextApiResponse } from "next";
import { parseHtml } from "@/lib/cheerio-parser";
import { analyzeAeo } from "@/lib/aeo-analyzer";
import { checkRateLimit, releaseRateLimit } from "@/lib/rate-limiter";

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
    // fetch() throws on network-layer failures (TLS, timeout, connection refused).
    // HTTP 4xx/5xx return a Response with ok === false, NOT an exception.
    // So any exception from fetch() on HTTPS is a candidate for HTTP fallback.
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === "https:";

    if (isHttps) {
      // Known non-recoverable: DNS failure — HTTP won't help either.
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

    // Re-throw for non-fallback errors (e.g. DNS failure on HTTPS)
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

  // Validate URL
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  // Extract client IP from request headers
  const forwardedFor = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  const socketIp = req.socket?.remoteAddress;

  let ip: string;
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    ip = forwardedFor.split(",")[0].trim();
  } else if (typeof realIp === "string" && realIp.length > 0) {
    ip = realIp;
  } else if (typeof socketIp === "string" && socketIp.length > 0) {
    ip = socketIp;
  } else {
    ip = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  console.log(`[AnswerPulse] IP extraction: forwardedFor=${forwardedFor}, realIp=${realIp}, socketIp=${socketIp}, finalIp=${ip}`);

  // Rate limit check (3 scans/day/IP)
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return res.status(429).json({
      error: "Daily scan limit reached (3 scans/day). Please try again tomorrow.",
      remaining: 0,
      resetAt: rate.resetAt,
    });
  }

  // Lock is held - release on completion
  let released = false;
  const cleanup = () => {
    if (!released) {
      released = true;
      releaseRateLimit(ip);
    }
  };

  res.setHeader("X-RateLimit-Remaining", rate.remaining.toString());
  res.setHeader("X-RateLimit-Limit", "3");

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
    cleanup();

    return res.status(200).json({ report });
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
