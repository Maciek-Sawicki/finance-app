# Backend Architecture

## Layers

```
routes/       Express routers - wires paths + middleware (auth, rate limits) to controllers
controllers/  HTTP layer - parse req, validate input shape, call a service, shape the response
services/     Business logic - validation rules, orchestration, transactions
repositories/ Data access - the only layer that talks to Mongoose models directly
models/       Mongoose schemas
```

Controllers don't talk to Mongoose models directly (the one deliberate exception is `auth.controller.ts`'s direct `User` lookups — there's no `user.repository.ts`, since user data isn't accessed anywhere else in the app the way accounts/categories/etc. are). Every other resource — accounts, transactions, categories, budgets, imports, recurring transactions, settings, category-breakdown — goes through a repository.

Services that need dependencies (another repository, the currency-conversion service, a Mongoose session factory) take them as constructor parameters (`createXService(repo, ...)`) and export a default-wired singleton alongside the factory. Tests construct their own instance with fakes instead of mocking Mongoose — see any `*.service.test.ts`.

## Soft delete

`models/plugins/softDelete.plugin.ts` is applied to every model that supports deletion (Account, Transaction, Budget, Category, Import, RecurringTransaction — not Transfer, which has no delete endpoint at all). It adds `isDeleted`/`deletedAt` fields and Mongoose query middleware that automatically excludes deleted documents from `find`/`findOne`/`countDocuments`/`updateMany`/`updateOne`/aggregation pipelines, unless a query explicitly filters on `isDeleted` itself.

This means:
- Repositories' `deleteById`-style methods don't remove documents — they set `isDeleted: true` via `softDeleteUpdate()`.
- Every existing find/list call site got this for free; nothing had to change at each of the ~30 read call sites.
- To check whether a document was soft-deleted (e.g. in a test), query with an explicit `isDeleted: true` filter — that opts out of the auto-exclusion.
- Category's per-user `(name, type)` uniqueness index is a **partial** index (`partialFilterExpression: { isDeleted: false }`) so a deleted category's name/type can be reused.

## Multi-document writes

Sign-up (`auth.service.ts`) and transfers (`transfer.service.ts`) each write multiple related documents (User + default Categories + Settings; a Transfer + two linked Transactions) inside a single Mongo session/transaction (`session.withTransaction(...)`), so a failure partway through rolls everything back instead of leaving a partial record behind. This requires MongoDB running as a replica set (or Atlas, which always is one) — a plain standalone `mongod` can't run multi-document transactions.

## Cron jobs

`cron/fetchRatesJob.ts` (exchange rates, every 6h) and `cron/recurringTransactionsJob.ts` (due recurring transactions, every 10 min) both run under `cron/withLock.ts`, a Mongo-native distributed lock (`CronLock` collection, TTL-based). This exists so running multiple server instances doesn't create duplicate recurring transactions or hammer the external rates API — only one instance's tick actually executes per interval; the rest see the lock is held and skip.

## Auth

Sessions are a JWT in an `httpOnly` cookie, set on sign up/sign in and cleared on sign out (`libs/utils/generateToken.ts`, `POST /auth/signout`). `middleware/authenticate.ts` reads `req.cookies.token` first, falling back to `Authorization: Bearer <token>` if present (kept server-side for compatibility, but the client only ever uses the cookie). The response body from sign up/sign in never contains the raw token — see [`docs/auth.md`](./auth.md).

## Ownership checks

Any request body field that references another of the user's resources (`accountId`, `categoryId` on transactions, recurring transactions, imports, budgets, budget history) is checked against the caller's `userId` via the owning repository's `findById` before being written or trusted — never taken as given from the client. This is what stands between "any authenticated user" and "any authenticated user's own data."

## Rate limiting

`middleware/rateLimiters.ts` — named limiters per use case (`signInLimiter`, `signUpLimiter`, `reportLimiter` for aggregation-heavy endpoints, `importLimiter`, `publicRatesLimiter`). Keyed by client IP via `express-rate-limit`, which requires `app.set('trust proxy', 1)` (set in `app.ts`) to read the real IP from `X-Forwarded-For` behind the nginx reverse proxy — without it every rate limit would apply to all traffic combined instead of per client.

## Error handling

Every service that can fail with a client-facing reason throws `Object.assign(new Error(message), { status })` (a "domain error" — no shared exception class, just the convention). `middleware/errorHandler.ts` is the single place that turns any thrown/rejected error into an HTTP response: domain errors map straight to their `status`; Mongoose `ValidationError`/`CastError`/duplicate-key (11000) map to 400/400/409; Multer errors (e.g. file too large) map to 400; anything else is a 500. Every async controller is wrapped in `middleware/asyncHandler.ts` so a rejected promise reaches `errorHandler` instead of crashing the process.

## Environment

`app.ts` validates `JWT_SECRET` and `CLIENT_URL` are set immediately after loading `.env` and exits with a clear message if not, rather than booting "successfully" and failing confusingly on the first request that needs them. `db/connectMongoDB.ts` does the same for `MONGO_URI`.
