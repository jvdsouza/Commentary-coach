import { RateLimiterMemory } from "rate-limiter-flexible";
import { NextResponse } from "next/server";

// Shared limiter across extract-audio + analysis so the two routes
// can't be called in alternation to bypass the per-IP quota.
// RateLimiterMemory resets on process restart — see docs/security.md
// for the upgrade path when running multiple replicas.
const pipelineLimiter = new RateLimiterMemory({
  points: 5,    // requests
  duration: 600, // per 10 minutes
});

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function checkRateLimit(request: Request): Promise<NextResponse | null> {
  try {
    await pipelineLimiter.consume(getClientIp(request));
    return null;
  } catch (rejection) {
    const secs = Math.ceil(
      ((rejection as { msBeforeNext?: number }).msBeforeNext ?? 60_000) / 1000
    );
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(secs) } }
    );
  }
}
