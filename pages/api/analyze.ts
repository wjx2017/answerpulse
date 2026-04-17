import type { NextApiRequest, NextApiResponse } from "next";
import { parseHtml } from "@/lib/cheerio-parser";
import { analyzeAeo } from "@/lib/aeo-analyzer";
import { checkRateLimit } from "@/lib/rate-limiter";

interface AnalyzeBody {
  url: string;
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
  const ip = (typeof forwardedFor === "string"
    ? forwardedFor.split(",")[0].trim()
    : typeof realIp === "string"
      ? realIp
      : req.socket?.remoteAddress ?? "unknown") as string;

  // Rate limit check (3 scans/day/IP)
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return res.status(429).json({
      error: "Daily scan limit reached (3 scans/day). Please try again tomorrow.",
      remaining: 0,
      resetAt: rate.resetAt,
    });
  }
  res.setHeader("X-RateLimit-Remaining", rate.remaining.toString());
  res.setHeader("X-RateLimit-Limit", "3");

  // Fetch the page
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AnswerPulse/1.0; AEO Scanner; +https://answerpulse.com)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8",
      },
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!response.ok) {
      return res.status(400).json({
        error: `Failed to fetch page: HTTP ${response.status}`,
      });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("html") && !contentType.includes("text")) {
      return res.status(400).json({
        error: "URL does not point to an HTML page",
      });
    }

    const html = await response.text();

    if (html.length < 100) {
      return res.status(400).json({
        error: "Page content too short, may be blocked or empty",
      });
    }

    // Parse and analyze
    const parsed = parseHtml(html);
    const report = analyzeAeo(parsed, url);

    return res.status(200).json({ report });
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.code === "UND_ERR_CONNECT_TIMEOUT") {
      return res.status(400).json({
        error: "Request timed out. The server may be slow or blocking scrapers.",
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
