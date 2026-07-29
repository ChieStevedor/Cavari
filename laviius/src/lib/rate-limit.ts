import "server-only";

// Sliding-window rate limiter for public-facing API routes (booking/quote
// endpoints in particular — see SECURITY.md, "API Hardening"). Backed by
// Upstash Redis so it works across serverless invocations, unlike an
// in-memory counter.
//
// Usage in a route handler:
//
//   const { success } = await checkRateLimit(request);
//   if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit {
  if (ratelimit) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN. See .env.example.",
    );
  }

  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
    prefix: "laviius",
  });
  return ratelimit;
}

export async function checkRateLimit(
  request: Request,
): Promise<{ success: boolean; remaining: number }> {
  // Best-effort client identifier. Behind Vercel this is the true client IP;
  // fine as a rate-limit key even though it's not authentication.
  const identifier =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const { success, remaining } = await getRatelimit().limit(identifier);
  return { success, remaining };
}
