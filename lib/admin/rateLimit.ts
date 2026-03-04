type RateLimitEntry = {
  count: number;
  windowStartedAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string,
  options?: {
    windowMs?: number;
    maxAttempts?: number;
  },
): { allowed: boolean; retryAfterSeconds: number; remaining: number } {
  const windowMs = options?.windowMs ?? 15 * 60 * 1000;
  const maxAttempts = options?.maxAttempts ?? 10;
  const now = Date.now();

  const entry = buckets.get(key);
  if (!entry || now - entry.windowStartedAt > windowMs) {
    buckets.set(key, { count: 1, windowStartedAt: now });
    return {
      allowed: true,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
      remaining: maxAttempts - 1,
    };
  }

  entry.count += 1;
  buckets.set(key, entry);

  const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - entry.windowStartedAt)) / 1000));
  const allowed = entry.count <= maxAttempts;

  return {
    allowed,
    retryAfterSeconds,
    remaining: Math.max(0, maxAttempts - entry.count),
  };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}
