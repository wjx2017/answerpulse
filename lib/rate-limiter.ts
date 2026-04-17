/**
 * Simple in-memory rate limiter for MVP.
 * Falls back to memory if Upstash Redis is not configured.
 * Free tier: 3 scans per day per IP.
 */

interface RateEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateEntry>();
const DAILY_LIMIT = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface RateCheckResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

function getKey(ip: string): string {
  return `aeo:${ip}`;
}

export function checkRateLimit(ip: string): RateCheckResult {
  const key = getKey(ip);
  const now = Date.now();
  let entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + DAY_MS };
    memoryStore.set(key, entry);
    console.log(`[RateLimiter] New entry for ip=${ip}, key=${key}`);
  }

  const remaining = Math.max(0, DAILY_LIMIT - entry.count);
  const allowed = entry.count < DAILY_LIMIT;

  console.log(`[RateLimiter] ip=${ip}, key=${key}, count=${entry.count}, allowed=${allowed}, storeSize=${memoryStore.size}`);

  if (allowed) {
    entry.count += 1;
  }

  return {
    allowed,
    remaining: Math.max(0, DAILY_LIMIT - entry.count),
    resetAt: entry.resetAt,
  };
}

// Clean up expired entries periodically (every hour)
setInterval(() => {
  const now = Date.now();
  memoryStore.forEach((entry, key) => {
    if (now > entry.resetAt) {
      memoryStore.delete(key);
    }
  });
}, 3600000);
