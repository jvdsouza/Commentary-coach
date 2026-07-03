# Security roadmap

## What's in place

| Measure | Where |
|---|---|
| API keys backend-only, never in client bundle | `backend/.env`, read in `utils/openai` and `utils/AssemblyAI` |
| File type validation (MP4, MOV, AVI, MKV, FLV, WMV) | `utils/file-handler.ts` |
| File size cap (500 MB) | `api/extract-audio/route.ts` |
| Duration cap (90 min, checked via ffprobe before any API spend) | `api/extract-audio/route.ts` |
| Rate limit (5 requests / 10 min per IP, shared across upload + analysis) | `utils/rate-limit/index.ts` |
| OpenAI retry with exponential backoff (max 3 retries, honours `Retry-After`) | `utils/openai/index.ts` |
| Analysis concurrency cap (20 parallel chunk calls) | `api/analysis/route.ts` |

---

## Step 1 — Shared-secret API key (recommended next)

### What it is
A static token stored in `.env` that every client request must include as a header
(`X-API-Key: <token>`). The backend rejects any request missing it with 401.

### Why it's needed
The rate limiter bounds *how fast* someone can call the API, but it doesn't stop
a determined actor who rotates IPs or waits out the window. Without a secret, any
person or script that discovers the backend URL can trigger unlimited transcription
and OpenAI analysis jobs over time.

A shared secret closes anonymous access entirely — only callers who hold the token
get past the front door.

### Implementation sketch
```ts
// backend/app/utils/auth/index.ts
export function checkApiKey(request: Request): Response | null {
  const key = request.headers.get("x-api-key");
  if (key && key === process.env.API_SECRET_KEY) return null;
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```

Add `API_SECRET_KEY=<random-256-bit-hex>` to `backend/.env`.
Call `checkApiKey(request)` at the top of each route handler (same pattern as
`checkRateLimit`).

On the frontend, add the header to both `fetch` calls in `VideoUpload.tsx`:
```ts
headers: { "X-API-Key": import.meta.env.VITE_API_SECRET_KEY }
```

Add `VITE_API_SECRET_KEY=<same token>` to `frontend/.env`.

**Rate limiter upgrade:** the current `RateLimiterMemory` resets on every process
restart and doesn't work across multiple backend replicas. Once you add the shared
secret and consider a more public deployment, swap to `RateLimiterPostgres` — the
existing Postgres container already in `docker-compose.dev.yml` is all you need:

```ts
import { RateLimiterPostgres } from "rate-limiter-flexible";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const pipelineLimiter = new RateLimiterPostgres({
  storeClient: pool,
  tableName: "rate_limits",
  points: 5,
  duration: 600,
});
```

This survives restarts and works correctly if you ever run multiple backend replicas.

---

## Step 2 — Per-user authentication (if multi-user deployment is needed)

### What it is
A proper identity system: users sign up / log in, each owns their own reviews, and
API routes verify session ownership before reading or writing data.

### Why it's needed
The shared secret (Step 1) treats all callers as one identity — anyone with the
token can see and trigger analysis for any review in the database. If Commentary
Coach is ever used by more than one person (e.g. multiple coaches/teams), the
single secret gives everyone access to everyone else's data.

Per-user auth adds:
- Row-level data ownership (`reviews` rows scoped to a `user_id`)
- Session tokens issued at login, not shared out-of-band
- The rate limiter can be keyed by `user_id` instead of IP, making limits harder
  to bypass via VPN/proxy rotation

### Implementation path
**Library:** [`better-auth`](https://www.better-auth.com) — minimal, framework-agnostic,
works with the existing Postgres database via its Drizzle adapter. Alternatively
`next-auth` v5 if you prefer its ecosystem.

**Schema additions needed:**
```sql
CREATE TABLE users (id uuid PRIMARY KEY, email text UNIQUE, ...);
ALTER TABLE reviews ADD COLUMN user_id uuid REFERENCES users(id);
```

**Scope of change:** larger than Step 1 — touches the DB schema, all review API
routes, and the frontend (login/signup UI, session token storage).
