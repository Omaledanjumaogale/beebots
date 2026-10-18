# OmieBot production operations

## Deployment

Cloudflare Pages project: omiebot-ai-trading; custom domain: https://omiebot.ewinproject.org. Worker: omiebot-runtime. Convex production: shocking-fennec-152.eu-west-1.convex.cloud. R2 bucket: omiebot-retained-data. Private credentials are configured in provider secret stores and ignored local deployment files, never in the browser bundle.

## Data and quota policy

Market requests pass through the runtime. Durable Objects reserve endpoint and aggregate budgets before network requests, including unsuccessful requests; a ten-percent reserve is kept. Provider limits include Twelve Data 8/minute and 800/day, Alpha Vantage 25/day, Marketstack 100/month, FMP 250/day and 512MB/rolling30days. Limits must be reconciled with actual account entitlements. Unknown/paid budgets (including LLM inference) default to disabled. Cache hits avoid upstream charges. Disable and entitlement checks run before cache access. Cross-client account usage remains outside this runtime's counters.

Bulk market datasets, analysis and candidate artifacts use R2; quota/configuration/canonical runtime state uses Durable Objects. These operations do not use Convex. Authenticated business records, audit records and subscribed paper portfolios do use Convex database/storage/IO. This application cannot promise zero Convex usage, zero cloud billing or guaranteed shared-account free-tier availability. Runtime-managed R2 writes have a local 8GB/10000-object ceiling; this does not include other applications in the Cloudflare account.

## Schedules and model lifecycle

Cloudflare cron `0 3 * * *` evaluates retained data at 04:00 Africa/Lagos daily. `*/5 * * * *` runs the enabled baseline paper Bees. Nigeria has no seasonal clock change. Crypto operates continuously subject to data health; forex sessions/execution are not enabled.

The daily job makes no provider data or paid model requests. Each Bee gets a bounded isolated training job using retained R2 data, at most 2000 bars, ten logistic training epochs, train-only scaling, chronological 70/30 evaluation, a one-bar purge and 40bp round-trip cost proxy. Fewer than 1200 valid bars skips training. A candidate needs minimum trade count, improved Brier score and improved cost-adjusted return to become shadow-ready. Forward paper validation is still required before execution activation. Training completion never guarantees improvement or profit. Holdout reuse, short history and serial dependence limit statistical conclusions.

Imported exports require source/retention-rights confirmation. Future/duplicate/invalid rows reject. Automated collection uses one configured instrument to avoid mixed-symbol datasets. No fabricated historical datasets are seeded. Current model and baseline remain unchanged when gates fail or data is insufficient. The separate Python research engine provides longer walk-forward evaluation but is not invoked by this cron.

## Execution and management

Three deterministic long-only spot simulators use fresh closed OKX bars, bounded entries, fees/slippage, stops/take-profit and idempotent candle handling. Scheduled simulations are independent from the browser-local ledger and Convex user portfolios; the operations console identifies the server runtime's accounts. No system guarantees a profit on every trade.

The Alpaca connector accepts explicit administrator paper requests only. Unknown broker outcomes require reconciliation and are never blindly resubmitted. Live mode rejects requests with HTTP409. Real live credentials, venue/session/risk validation, forward-performance evidence and an explicit activation gate remain prerequisites for live execution.

Operations sections: Analytics, Applications, Referrals, Financial, Users, Settings. CRUD is supported for operational records; financial records are append-only with correction entries, preserving the audit trail. Deleting a management user record does not revoke an OAuth identity; identity access policy is separate. Overview counters are bounded at101 and labeled as capped. Page size25/maximum50 prevents unbounded scans.

Password sign-in uses a salted PBKDF2 hash compatible with Workers'100000-iteration ceiling, durable rate limits, HttpOnly same-site cookies and signed RS256 tokens. The bootstrap password is not retained in source. Convex verifies issuer/audience and verified email for admin calls. Origin checks protect mutations. OAuth callbacks must be registered in Google/GitHub dashboards as `/api/auth/google/callback` and `/api/auth/github/callback` on the production origin. Provider consent completion and Resend verified-sender delivery remain separate acceptance steps.

## Acceptance boundaries

A successful build/deployment does not prove model profitability, continuous availability, OAuth provider consent, email delivery, all-provider entitlements, a funded live trade or full institutional readiness. Confirm those independently. The shipped live-mode lock is intentional with the supplied paper account. Review runtime quotas and storage from the authenticated console; polling is manual to avoid excess IO.

## Verified launch evidence (2026-10-15)

Custom domain and TLS are active. Production password sign-in, protected runtime status, Convex admin query and browser create/read/update with live subscription updates were exercised. An authenticated paper cycle evaluated99 genuine closed BTC-USDT bars and created the three baseline accounts; all three correctly held without a qualified entry. This is execution-path evidence, not a profitability result. Anonymous runtime admin access returned401; a live-mode request returned409. Daily cron is installed but its first scheduled run has not yet occurred.

Validation passed: Svelte check (zero errors/warnings),14 web/auth tests,8 edge tests, native edge contract checks and7 offline research tests. The preserved upstream Windows suite has three POSIX file-mode assertion failures (Windows reports0666 rather than0600) and one network test timeout; it is not the deployed Cloudflare runtime. Those failures are retained as an explicit caveat rather than hidden or relaxed.
