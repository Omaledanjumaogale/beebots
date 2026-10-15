# OmieBot AI Trading paper research backend

Run `npm install` in `web`, then `npx convex dev` to provision a development deployment and generate bindings. Set `PUBLIC_CONVEX_URL` in the SvelteKit environment. Deploy functions with `npx convex deploy` separately from Cloudflare Pages. The minute cron runs on Convex infrastructure while the browser is closed; Cloudflare serves the web app. Convex deployment quotas still apply.

Set `AUTH_ISSUER` and `AUTH_APPLICATION_ID` on Convex to a supported JWT issuer/application, configure that provider's browser sign-in and supply its token through the Convex client auth integration. No anonymous mutations are permitted. Without issuer configuration the backend intentionally remains inaccessible. No exchange API key is needed, and no private trading API exists here.

## UI function contracts

- `hive:dashboard {}`: authenticated owner's portfolio (or null), bees, latest 100 fills and up to 100 candidates.
- `hive:initialize {}`: idempotently creates $10,000 simulated USDT portfolio.
- `hive:createBee {name,strategy,symbol}`: registers one of the 20 proposal identities; strategies `trend`, `reversion`, `breakout`, `research`; symbols `BTC-USDT`, `ETH-USDT`, `SOL-USDT`. Initially paused. Maximum 20 per owner.
- `hive:setBeeActive {beeId,active}`: owner-only; cannot start while killed. Admission atomically enforces at most 100 active Bees across the deployment.
- `hive:killSwitch {killed}`: stops new fills and pauses all owner Bees; resuming does not restart Bees or liquidate positions.
- `hive:closeBeePosition {beeId}`: owner-requested atomic paper reduction at latest fresh safe bid, with fee and ledger entry. Works while killed; pauses the Bee and sets quantity to zero. Concurrent/repeated calls cannot sell a position twice. Stale quotes reject instead of inventing an exit.
- `hive:registerCandidate {name,artifactHash,datasetHash}`: SHA256 manifests required; no training is claimed.
- `hive:promoteCandidate {candidateId,target}`: sequential registered → evaluated → shadow → paper → approved. Requires an immutable internal evaluator record matching candidate ID, artifact hash, dataset hash and target; public callers cannot supply or sign evaluation reports. The evaluation is consumed atomically via an append-only use record, so it cannot be reused. Nonempty evidence, >=100 integer independent samples and finite >=1 day per stage, >=30 days for approval. Each transition is appended to evidence. Approval does not wire a candidate into execution.

`hive:recordEvaluation` is an **internal mutation** for a future trusted evaluator bridge or deployment operator. It accepts `{candidateId,artifactHash,datasetHash,target,report,independentSamples,durationDays,passed,evaluator}` and permits one immutable passing report per candidate/transition. It validates stage and manifest matching. There is no public report-ingestion endpoint. External worker signature verification, evaluator identity attestation and production bridge acceptance remain unestablished; the offline Python worker cannot automatically promote candidates. Deployment administrators remain a privileged trust boundary.

Use generated `api` after codegen or `makeFunctionReference` with those paths. Every owner check uses JWT tokenIdentifier, never an input owner ID. Market tick and polling functions are internal-only.

## Execution boundaries

Once a minute, a bounded action reads public OKX spot bid/ask for three instruments. Requests time out after 8 seconds. Invalid/missing/stale/future/crossed quotes or spread >30bps fail closed. Keep 60 observations per symbol. Baselines abstain until 30 contiguous samples; a gap longer than 90 seconds resets readiness to observations after that gap. Historical quotes remain available for marking but cannot bridge an outage in signal features. These are minute **quote observations**, not exchange candles or trained predictions. Research-role Bees hold unless explicitly assigned one of three implemented baselines.

Fills are immediate simulated bid/ask fills, long only, cash funded, max $250 per Bee, minimum $5 notional, 10^-8 quantity rounding, fixed 0.1% fee. Each fill appends fee and cash delta to immutable ledger and updates position/cash atomically. Per-Bee per-source-minute idempotency prevents replay fills. Account starts at $10,000; the 20-Bee cap bounds original entry exposure to $5,000. An equity threshold of $9,000 pauses portfolio and Bees; stale marks block decisions. This is a total starting-equity loss guard, not a daily-loss engine. Kill switch preserves existing exposure. No leverage, shorting, transfers, deposits, withdrawals, FX execution or live orders.

This MVP does not model depth, queue priority, partial fills, market impact, latency slippage, venue lot/tick rules, daily reset accounting or guaranteed stop fills. Floating point ledger arithmetic needs decimal/fixed-point migration before money handling. Deployment admission is limited to 100 active Bees; each tick uses the active+symbol index, so unrelated symbols cannot starve a Bee. Legacy/admin over-cap states throw explicitly and roll back the tick instead of silently truncating execution. Increasing capacity requires scheduling and load acceptance work. Ledger history is append-only through exposed API but deployment administrators can alter database records. No deletion/reset endpoint exists. Pausing preserves holdings and stops autonomous exits too; use the authenticated close-position reduction to exit while paused or killed when fresh quotes are available.

Training workers, dataset storage, signed artifacts, independent evaluation verification, LLM coach and external-provider credentials remain integration work. No candidate is trained or reliably profitable merely because its registry row exists. Tests cover quote gates, abstention and transition guards; deployed authentication, concurrency, cron and integration acceptance must still be exercised on a real deployment.
