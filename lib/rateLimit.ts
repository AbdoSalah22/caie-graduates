/**
 * Simple in-memory rate limiter (sliding window, per-key).
 *
 * Suitable for single-instance deployments (e.g. Vercel serverless).
 * For multi-instance production use, swap to Redis or Upstash.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Auto-clean stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

/**
 * Check whether a request from `key` (typically an IP address)
 * should be rate-limited.
 *
 * @returns `true` if the request is ALLOWED, `false` if BLOCKED.
 */
export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  cleanupStaleEntries(windowMs);

  const entry = store.get(key) || { timestamps: [] };

  // Drop timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => t > now - windowMs);

  if (entry.timestamps.length >= maxRequests) {
    store.set(key, entry);
    return false; // blocked
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return true; // allowed
}

/**
 * Helper: extract client IP from Next.js request headers.
 * Falls back to "unknown" if no IP can be determined.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
