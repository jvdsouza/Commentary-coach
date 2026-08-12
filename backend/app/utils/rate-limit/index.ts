import { RateLimiterMemory } from "rate-limiter-flexible";
import { NextResponse } from "next/server";

// Shared limiter across extract-audio + analysis so the two routes
// can't be called in alternation to bypass a single user's quota.
// Keyed by user_id (see checkAuth) so each of the 5-10 beta testers gets
// their own budget instead of one shared bucket.
// RateLimiterMemory resets on process restart — see docs/security.md
// for the upgrade path when running multiple replicas.
const pipelineLimiter = new RateLimiterMemory({
  points: 5,    // requests
  duration: 600, // per 10 minutes
});

export async function checkRateLimit(userId: string): Promise<NextResponse | null> {
  try {
    await pipelineLimiter.consume(userId);
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
