# Live hive design and evidence review —16October2026

Reference requirements: three distinctive Bee performance cards, equity plots, position/state, last call, activity limits, fees/fills, decision-flow panel, Beekeeper, leaderboard and wider hive access. OmieBot uses its own names and original SVG avatars. Existing terminal remains available.

Delivered /hive with responsive three-column cards plus side panels, readable financial hierarchy, honey/violet/rose accents, reduced-motion-aware entry transitions, semantic controls and accessible SVG labels. Mobile collapses to one card per row. Desktop retains simultaneous comparison. A public allowlisted snapshot contains only simulated hive state, without credentials, provider budgets or investor records. Public snapshot refresh60seconds skips hidden tabs; response has30second shared-cache headers. This avoids Convex chart polling.

Runtime records actual equity at each new closed candle, max288points,24decisions and24fills/account. Old history is not backfilled. Fees accumulate from this revision. A regression verifies duplicate candles cannot create duplicate chart/fill evidence. Existing chart sample sizing is independent per Bee; plots show account history, not an imagined return curve. Research roles are labeled untrained; Laya production connection and weight training remain pending.

Observed live incident: OKX Worker request returned upstream429. The Worker abstains and now applies a15minute provider cooldown; other failures receive60seconds. UI warns about failed cycles and marks decision records older than15minutes stale. No retry loop or alternate endpoint bypass is added. Full ongoing autonomous execution cannot be asserted during upstream throttling.

Deferred: independently validated trading models, live credentials/account controls, authentic forward-performance history, connected production Laya inference, full Beekeeper rewriting/proposal review. No guaranteed profits, false visitor counts, fake model calls or copied upstream brand/portraits.
