# Convex cost migration â€” 17 October 2026

## Release status

Code is deployed to the production Convex deployment, Cloudflare runtime and Pages project. **Full production acceptance is incomplete:** the shared Cloudflare account currently returns Worker Error 1027 (daily free request allowance exhausted). Pages Functions fall through to static assets; the previous SSR-only pages consequently returned 404. This release prerenders the page shells to remove those navigation invocations. Private data still requires authenticated server APIs. No paid plan was enabled.

The runtime's measured request count today was 387; the account's email-service and standalone-connect Workers reported 11,961 and 72,156 respectively. These analytics are not an exact account billing total and exclude other Pages traffic. No other application's configuration was changed. Cloudflare's documented daily reset is midnight UTC (01:00 Africa/Lagos on 18 October). Restored service after that time is not yet verified.

## Baseline diagnosis

- Public `/paper`, `/hive`, provider ingestion, training datasets and reports already used Cloudflare, not Convex. There was no Convex file-serving or public bulk HTTP action to migrate.
- An optional one-minute Convex cron could poll three instruments, insert/prune quotes, scan active Bees and rewrite decisions/positions every tick. At full cadence that allowed 1,440 actions and up to 4,320 instrument mutations/day, before per-Bee writes. These are capacity estimates, **not observed active consumption**.
- Private hive, investment and admin pages subscribed to Convex aggregates over WebSockets. Admin overview could scan up to 505 records plus 20 audit rows; dashboards returned up to 100 fill/journal records. Every reactive invalidation could repeat that work.
- Admin saves patched records and appended audits even when values were unchanged. Promotion evidence duplicated entire evaluation reports.

A read-only production inventory found **zero** quotes, fills, evaluations, evidence, candidates, Bees, portfolios, investment positions, withdrawal requests, users, applications, referrals, financial records and Convex `_storage` files. Existing records were two admin audits, one simulated journal entry, one wallet and one settings document. Nothing needed destructive bulk export/deletion; private backups were retained outside this repository. Empty tables are not described as migrated data.

There is no fixture/forecast publisher or premium subscriber-feed module in this app. Those generic request items are not applicable. No entitlement system was invented or bypassed.

## Implemented paths

1. `convex/crons.ts` now has no scheduled jobs. Compatibility `market:poll` and `market:tick` return `retired` without any database access. The active Alpaca paper loop remains in the Cloudflare five-minute cron, with daily training; the cadence preserves existing useful trading behavior.
2. `/api/control` authenticates every request. Admin views require verified admin identity before R2 access. Cache keys hash the verified owner and arguments; callers cannot provide another owner. On a miss the server signs a fresh short-lived token and queries the original owner/admin-guarded Convex function.
3. Private R2 content-addressed snapshots hold dashboard payloads. A tiny DO generation/expiry record controls a 60-second reuse window. Generation checks reject publications raced by a mutation. There are no UI WebSocket subscriptions or idle private-dashboard polls.
4. R2 bodies and pointers change only when canonical content hashes change. Identical publication performs zero R2 replacements. Payloads are bounded at 512KB; admin lists retain pagination. Fill/journal previews are bounded at 20; audit preview at 10. Candidate registration's 100-record admission check remains intact.
5. Mutations remain atomic in Convex, retaining ownership, admin authorization, immutable financial records and existing limits. An invalidation failure returns `committed: true`; it does not make a completed action appear safe to resubmit. Unchanged admin saves skip both patch and audit insertion.
6. Failed snapshot publication is durably queued in DO storage, capped at 25 jobs. Retries use immutable content keys and the same pointer; newer successful jobs supersede older failed ones. Invalidated jobs are discarded. Alarm and fetch work serialize to avoid stale retry overwrites.
7. A fixed public-paper projection lives in private R2 and is served through `/public/paper` with ETags/304 support. There is no arbitrary public key reader. Pages paper APIs use this projection. Raw licensed market datasets, credentials, account snapshots and admin payloads remain private.
8. General artifact writes skip identical content. Daily training skips a dataset whose retained input hash already matches the latest report. Provider quota reservation and storage-budget counters already live in small separate DO records, outside Convex.
9. New internal evaluations accept a bounded R2 report pointer rather than a full report body; promotion writes only evaluation identifiers/hashes/status. The future trusted evaluator bridge remains unwired; this change does not attest reports or promote models automatically.
10. Convex's external OpenID discovery endpoint returned 404 during verification. Auth now pins the existing public RSA signing key using the documented custom-JWT provider, retaining exact issuer, audience and RS256 validation. Only public RSA fields enter its JWKS. Key rotation must update both Pages and Convex public-key configuration.
11. Page shells are static, without private records. Authenticated APIs remain dynamic. Static navigation therefore does not consume a Worker request; no private response is publicly cached.

## Measured results and proof boundaries

Production Convex returned successful authenticated responses of 605 bytes for admin overview, 84 bytes for hive dashboard and 1,295 bytes for investment dashboard.

A controlled replay used those **real production responses** with the actual data-plane implementation and an **in-memory R2/DO adapter**:

| Workload within the 60-second window | Direct-query baseline | Snapshot replay |
|---|---:|---:|
| Ten reads of each of three views | 30 Convex queries | 3 Convex queries |
| Convex JSON response bytes | 19,840 | 1,984 |
| Repeat publication of all three unchanged views | â€” | 0 R2 replacements |

That is **90% fewer source queries and response bytes in this replay**. It is not a production billing-meter reduction or deployed R2 acceptance test. Production gateway/cache headers, ETags, retry drainage and access checks could not be exercised while Cloudflare returned 1027/Pages 404; failures were recorded rather than counted as passes. A successful deployed replay must replace this boundary before claiming rollout acceptance.

The bucket-info API reported **22 objects / 915 kB, Standard storage, WEUR**, before new gateway publications. Account-level R2 metrics subsequently reported 726 Standard objects, 67,875,000 payload bytes and 24,796 metadata bytes: **67,899,796 bytes total**, leaving approximately **9.932GB** against the 10GB free Standard storage allowance at this snapshot. Monthly average storage billing is not identical to this instantaneous headroom. Account-wide analytics reported 3,872 R2 operations since 1 October; these counts were not reconciled by billing class. The runtime's 8GB/10,000-object admission budget is a local cap, not a Cloudflare billing guarantee. R2 operations, DO usage, account-wide Workers traffic and retention growth still need monitoring.

Residual Convex work: authenticated cold/expired snapshots and user-initiated account/admin/simulation mutations. The empty retired trading tables remain as reversible schema compatibility. There are no market ingestion/training writes, bulk file downloads or quota counters in the Convex hot path. Exact billed database I/O and daily egress telemetry were not available; do not infer a guaranteed free-tier ceiling from the replay.

Static page acceptance: production `/`, `/paper`, `/live`, `/admin`, `/invest` and `/research` all returned HTTP 200 after prerender deployment; dynamic `/api/health` still returned 404 during quota exhaustion. These page checks prove availability of shells, not current data.

Local validation: 29 runtime tests including unchanged publication, owner isolation, generation races, durable retry and ETags; 21 web tests including auth/accounting and dedicated gateway checks; Svelte diagnostics, Convex deploy type/schema checks and production web build. No real trading funds, customer records or broker orders were changed. Browser visual QA remains unavailable in current app settings.

## Remaining acceptance and rollback

- After Cloudflare service resumes, publish the public paper projection twice with identical state. Confirm second `changed:false`, `r2Replacements:0`, successful public GET and conditional 304.
- Call the retry endpoint and confirm `remaining:0`; queue state is currently **unverified**, not assumed empty.
- Exercise signed owner/admin and denied anonymous/member requests through deployed Pages. Read each view ten times and record `X-Convex-Source-Calls` and `X-Control-Cache`.
- Verify unchanged training input creates no report archive or latest replacement. Check the next actual scheduled paper update remains fresh.
- Review Cloudflare account-wide traffic and bucket/operation consumption; OmieBot cannot reset a shared daily allowance or prevent unrelated apps consuming it.
- Roll back Pages/Worker versions if necessary. Preserve private R2 objects and DO metadata. Reverting to direct private reads is possible, but do not restore the retired minute Convex ingestion loop. No schema deletion or financial history rewrite occurred.

Official references: [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Worker error codes](https://developers.cloudflare.com/workers/observability/errors/), [Convex custom JWT provider](https://docs.convex.dev/auth/advanced/custom-jwt).
