# OmieBot AI Trading

A research and paper-trading application with a separate OKX live-account connection workspace, built with SvelteKit, Tailwind CSS, Convex and Cloudflare. Production: https://omiebot.ewinproject.org. Operations: https://omiebot.ewinproject.org/admin. Paper: `/paper`; live account records: `/live`; encrypted account linking: `/connect/okx`. Actual OKX order execution remains incomplete and disabled.

## Run the web application

Use Node 22.13 or newer. From `web`, run `npm ci --legacy-peer-deps`, `npm run dev`, then open http://127.0.0.1:5187. Vite uses a strict dedicated port to avoid displaying another local project. Server integrations require environment configuration; missing market connectivity displays explicitly labeled preview candles. Never put private credentials in PUBLIC variables.

## Application boundaries

- `web/`: trading terminal, original OmieBot branding and Bee avatars, accessible responsive UI, browser-local paper ledger, signed session authentication, Convex cloud hive and operations console.
- `web/convex/`: authenticated users/applications/referrals/settings management, immutable financial journal, audit trail and user-owned paper portfolios. Market polling is disabled by default to conserve Convex operations.
- `edge/`: authenticated runtime, globally serialized provider quota reservations, R2 retained datasets/artifacts, scheduled baseline paper strategies, broker paper adapter and daily shadow training.
- `research-engine/`: independent offline Python walk-forward research and tests. It is distinct from the deployed JavaScript trainer.
- `src/`, `dashboard/` and existing container configuration: preserved upstream engine and dashboard. These are not the Cloudflare application or production deployment path. See `docs/UPSTREAM-README.md` and LICENSE for upstream attribution.

Twenty specialist Bees are registered. Drift, Rebound and Breaker have executable deterministic crypto-spot paper strategies. The other roles are research candidates. Learned challengers require evidence and forward-paper validation; none is represented as a proven profitable model. Forex execution is not implemented.

## Production operation

See `docs/PRODUCTION.md` and `docs/WORKSPACES-LIVE-PAPER.md` for schedules, costs, integration limits and acceptance status. The Alpaca-backed shared paper fleet evaluates actual closed BTC/USD bars every five minutes and fits retained-data shadow candidates daily at 04:00 Africa/Lagos. The first actual 1,819-bar fitting jobs were rejected and the first market tournament lost money; neither was promoted. `/live` reads only the signed-in profile's linked OKX records, with no fallback to paper balances. Connection verification, encrypted storage and recorded starting risk limits are implemented; actual live order submission and execution acceptance remain unfinished. An API key does not establish paid entitlements, data licenses or unlimited usage. Provider limits are shared outside this app; local counters cannot observe unrelated clients.

## Validation

From `web`: `npm run check`, `npm test`, `npm run build`. From repository root: `node edge/check.mjs`, `node web/node_modules/vitest/vitest.mjs run --config edge/vitest.config.js`, and `python -m unittest discover -s research-engine -v`.

The upstream MIT license is retained. OmieBot is an independently branded extension; third-party notices live in `web/THIRD-PARTY-NOTICES.md`.

## Investor simulation and Laya

`/invest` provides private fictitious wallets, bounded individual allocations, squad/pool interests, simulated redemption requests and a wallet journal. No real funds, escrow, pooling or payouts are connected. See `docs/INVESTMENT-STRUCTURE-DRAFT.md`. The proposed10%fee applies on principal withdrawal; numeric ROI targets remain unset pending evidence.

`decision-engine/` installs the pinned Laya ONNX model, verifies artifacts and runs guarded typed action/coaching inference. A local actual-candle smoke inference succeeded. Weight fine-tuning and production inference hosting remain pending; this Node native model does not run in the Cloudflare isolate. See its README.
