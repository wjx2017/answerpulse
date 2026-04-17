import type { NextApiRequest, NextApiResponse } from "next";
import { parseHtml } from "@/lib/cheerio-parser";
import { analyzeAeo } from "@/lib/aeo-analyzer";
import { checkRateLimit, releaseRateLimit } from "@/lib/rate-limiter";

interface AnalyzeHtmlBody {
  html: string;
  sourceUrl?: string; // optional: user-provided URL for display purposes
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

  // Extract client IP (same logic as analyze.ts)
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

  // Rate limit check (shares the same pool as URL scanning)
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

  try {
    // Parse HTML directly (skip cheerio fetch step)
    const parsed = parseHtml(html);
    const displayUrl = sourceUrl || "Pasted HTML";
    const report = analyzeAeo(parsed, displayUrl);
    cleanup();

    return res.status(200).json({ report });
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
      sizeLimit: "2mb", // HTML pasted directly can be larger
    },
  },
};
