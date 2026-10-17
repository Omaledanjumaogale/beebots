# OmieBot AI Trading

## 0.1.1 — 2026-10-17

- Retire Convex market ingestion; add authenticated, content-addressed R2 dashboard snapshots with durable retry and bounded on-demand reads.
- Skip unchanged artifacts, training input and admin saves; retain only pointers and concise evaluation evidence in Convex.
- Pin the existing public JWT key to remove failed external discovery; preserve owner/admin guards.
- Prerender public page shells to reduce shared Cloudflare request usage.
- Deployment acceptance is partial: Cloudflare Error 1027 blocks runtime verification. See `docs/CONVEX-COST-MIGRATION.md` for measured replay results and outstanding checks.

## 0.1.0 — 2026-10-15

- Add an original SvelteKit/Tailwind/Vite trading terminal inspired by the supplied chart and Bee references, with paper execution and explicit public/preview data states.
- Add an authenticated Convex paper service, configurable Bee registry, minute market cron, risk controls and internally evidenced candidate lifecycle.
- Add a reproducible Python research pipeline with purged chronological evaluation and shadow-only outputs.
- Preserve upstream engine and MIT notices; keep live execution outside the new application.
- Add Cloudflare Pages build configuration and validation workflow. Provider deployment and authenticated acceptance remain pending.
