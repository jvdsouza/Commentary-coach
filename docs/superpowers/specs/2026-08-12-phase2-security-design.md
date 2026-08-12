# Phase 2 security fixes — design

Date: 2026-08-12
Status: Approved, not yet implemented

## Context

Phase 1 (per-user login) is done: `POST /api/login` issues an HMAC-signed bearer
token, `checkAuth` gates `extract-audio` and `analysis`, and the rate limiter is
keyed by `user_id`. While reviewing that work (`TODO.md` Phase 2), three gaps
were found before hosting anything publicly:

1. `GET /api/reviews` and `GET /api/reviews/[id]` call no `checkAuth` at all —
   open to anyone, logged in or not.
2. Even gated, there's no ownership: `reviews` has no `user_id` column, so any
   authenticated tester could list/read every other tester's reviews.
3. `createToken`/`verifyToken` have no expiry and no revocation path — a leaked
   token is valid forever.

Remaining Phase 2 items (`AUTH_SECRET` value, `.env` git history, the
`docker-compose.dev.yml` `db:push --force` scope, the in-memory rate limiter
note, `FRONTEND_ORIGIN`/HTTPS) are verification-only or blocked on Phase 3/4
hosting decisions — no code changes, not covered further in this spec.

## Decisions

- **Review ownership: full per-user scoping.** Small trusted beta group or not,
  gate-only was rejected — reviews get scoped to their owner, matching what
  Phase 1's per-user auth implied.
- **Token lifetime: expiry + admin-only revocation via `token_version`.**
  Rejected expiry-only (no way to kill a live leaked token before it expires)
  and rejected a full session-table/refresh-token system (unnecessary
  complexity for 5-10 testers). `token_version` is the minimal mechanism that
  gives a selective, DB-access-only kill switch with no new API surface.

## Design

### 1. Review ownership

- Migration: add `reviews.user_id` (`uuid`, `NOT NULL`, `REFERENCES users(id)
  ON DELETE CASCADE`). No real testers exist yet (Phase 4/5 haven't run), so
  existing `reviews` rows are dev/test data only — the migration truncates
  `reviews` (cascades to `transcript_segments`, `transcript_chunks`,
  `coaching_notes`, `review_summaries`, `review_strengths`,
  `review_improvement_areas`, `review_speaker_feedback`) rather than
  backfilling an owner that doesn't exist.
- `backend/app/utils/db/reviews.ts`: `createReview(title: string)` becomes
  `createReview(title: string, userId: string)`, passing `userId` into the
  insert.
- `backend/app/api/extract-audio/route.ts`: pass `auth.userId` (already
  available from the existing `checkAuth` call) into `createReview`.
- `backend/app/api/reviews/route.ts` (`GET`): add `checkAuth`; filter the
  query by `WHERE reviews.user_id = auth.userId`.
- `backend/app/api/reviews/[id]/route.ts` (`GET`): add `checkAuth`; after
  fetching the review, compare `review.userId === auth.userId`. On mismatch
  *or* missing review, return the existing `404` (never `403` — don't confirm
  the ID exists to a caller who doesn't own it).

### 2. Token expiry + revocation

- Migration: add `users.token_version` (`integer`, `NOT NULL`, `DEFAULT 0`).
- `backend/app/utils/auth/index.ts`:
  - `createToken(userId: string, tokenVersion: number)` — payload becomes
    `{ userId, tokenVersion, exp }`, `exp` = issue time + 30 days (unix
    seconds).
  - `verifyToken` rejects (returns `null`) when `exp` has passed, in addition
    to the existing signature check. Returns `{ userId, tokenVersion }`.
  - `checkAuth` becomes `async` end-to-end (it already is): after signature +
    expiry pass, look up the user by `userId` and compare
    `user.tokenVersion === payload.tokenVersion`; mismatch → `401`. This is
    the one architectural change of the phase — `checkAuth` moves from pure
    signature verification to a DB-backed check on every authenticated
    request. Acceptable at this scale (5-10 testers, 5 req/10min cap each).
- `backend/app/api/login/route.ts`: pass the looked-up user's current
  `tokenVersion` into `createToken`.
- New `backend/scripts/revoke-user.ts` (same shape/CLI pattern as the planned
  `create-user.ts` from the earlier TODO item): takes a user name, increments
  their `token_version` by 1 in the DB. That single script is the entire
  revocation mechanism — no admin API route, no new auth surface; it only
  works for whoever already has DB access.

### 3. Verification-only items (tracked in TODO.md, no code here)

Confirm `AUTH_SECRET` is a real random value on the host and never committed;
confirm `.env` files were never committed; confirm the production `db:push`/
`db:migrate` path doesn't inherit `docker-compose.dev.yml`'s `--force`; note
the rate limiter's in-memory/single-instance limitation; set `FRONTEND_ORIGIN`
and enforce HTTPS once Phase 3/4 hosting URLs exist.

## Testing

- `backend/app/utils/auth/index.test.ts`: extend for `exp` expiry rejection
  and `token_version` mismatch rejection.
- `backend/app/api/reviews/route.test.ts` / `[id]/route.test.ts` (new): assert
  401 with no/invalid token, 404 for another user's review ID, 200 + correct
  scoping for the owner.
- `backend/app/api/login/route.test.ts`: assert issued token carries the
  user's current `token_version`.
- `backend/app/api/extract-audio/route.test.ts`: assert `createReview` is
  called with `auth.userId`.

## Out of scope

- Refresh tokens / sliding expiry.
- Any admin UI or API route for revocation (script only).
- The verification-only checklist items (no code to design).
