# Execution and backtesting ecosystem audit

Reviewed 2026-10-17, Africa/Lagos. Scope: eight screenshot references, official repository identity/license, integration feasibility and data provenance. This is read-only primary-source research, not an installation, benchmark, native-binary decompilation or proof of profitable trading. Source repositories were inspected as source; no Ghidra result is claimed. Branches and licenses below are mutable and must be pinned/rechecked before importing code.

## Screenshot corrections

- CCXT is an exchange integration library. The screenshot text describing an HKU personal research agent belongs to a different project.
- Current NautilusTrader repository identifies LGPL-3.0, while the screenshot says Apache-2.0.
- StockSharp's current license notice is proprietary/custom EULA and explicitly says it is not under a general-purpose open-source license. Public GitHub visibility is insufficient permission to copy it.
- vectorbt currently has Apache-2.0 **with Commons Clause**, not unrestricted Apache-2.0. Its commercial restriction matters to an OmieBot hosted product.
- Repository stars, rankings, marketing throughput and screenshots are not evidence of return, execution reliability, dataset rights or model quality. Nothing here establishes recurring ROI.

## Verified catalogue

| Project and primary evidence | Actual purpose and license observed | Runtime and OmieBot fit | Data/training boundary |
|---|---|---|---|
| [mementum/backtrader](https://github.com/mementum/backtrader), [license](https://github.com/mementum/backtrader/blob/master/LICENSE) | Python event-driven backtesting/live framework; GPL-3.0. Commission, slippage, simulated broker and order lifecycle support. | Python process for offline validation; historic broker dependencies require separate compatibility testing. Useful conceptual reference for fill modelling and closed-bar execution. Do not copy GPL implementation into the existing application without complying with applicable obligations. | `datas/` and `samples/` exist; illustrative data is not a licensed cross-market training corpus. Historical examples and old Yahoo/Oanda integration notes are not current feed acceptance. |
| [polakowo/vectorbt](https://github.com/polakowo/vectorbt), [license](https://github.com/polakowo/vectorbt/blob/master/LICENSE.md) | Array-based batch backtesting; Apache-2.0 plus Commons Clause fair-code. | Python/NumPy research runtime; commercial embedding needs license review/exception where restricted. Prefer original bounded parameter sweeps in OmieBot now. | Examples demonstrate research, not trained execution policies. Do not confuse the community library with proprietary PRO features or assume downloaded data has redistribution rights. |
| [jesse-ai/jesse](https://github.com/jesse-ai/jesse), [license](https://github.com/jesse-ai/jesse/blob/master/LICENSE), [getting started](https://docs.jesse.trade/docs/getting-started/) | Crypto strategy research, optimization, simulation and execution; core MIT. Current docs describe feature/label collection, calibration and Monte Carlo testing. | Separate self-hosted Python service; core license does not establish entitlements for every hosted/extension product. Valuable patterns: signal-time feature records, outcome-time labels, inspectable trade charts and experiment comparison. | Candle import is a workflow requiring a source, not included universally licensed history. Strategy examples are candidates, not trained profitable bots. Validate any extension separately. |
| [QuantConnect/Lean](https://github.com/QuantConnect/Lean), [license](https://github.com/QuantConnect/Lean/blob/master/LICENSE) | Modular multi-market event-driven engine; Apache-2.0. | .NET engine with Python strategy support; local Docker/CLI workflows. Best long-term multi-asset execution candidate if separate compute is funded. Reuse model boundaries for fees, fills, brokerage constraints and buying power. | Engine/source access does not grant the QuantConnect historical catalogue, subscriptions or broker entitlements. Own datasets, calendars, corporate actions and venue rules remain necessary. |
| [nautechsystems/nautilus_trader](https://github.com/nautechsystems/nautilus_trader), [license](https://github.com/nautechsystems/nautilus_trader/blob/develop/LICENSE), [adapter inventory](https://github.com/nautechsystems/nautilus_trader/blob/develop/ADAPTERS.md) | Rust engine with Python control plane; deterministic event-driven simulation/live architecture; LGPL-3.0 observed. | Native runtime/container, external to Pages. Strong candidate for replay/reconciliation research; current develop requirements are not assumed suitable for our installed Python. Pin a release before trial. | `test_data/` and example notebook data are fixtures; no universal production corpus. Backtest/live parity does not remove transport, reconciliation or external account activity differences. |
| [ccxt/ccxt](https://github.com/ccxt/ccxt), [license](https://github.com/ccxt/ccxt/blob/master/LICENSE.txt), [manual](https://docs.ccxt.com/) | Standardized market/account/order APIs across many exchanges; MIT. Not an alpha model, exchange or custodian. | Best first integration candidate: a narrow server-only adapter for selected venues. Check precision, limits, sandbox support and per-method capabilities; a common API does not equal identical venue semantics. | Public market methods can fetch observations subject to venue terms/rate limits. Library/examples confer no rights to all exchange history and do not train agents. |
| [hummingbot/hummingbot](https://github.com/hummingbot/hummingbot), [license](https://github.com/hummingbot/hummingbot/blob/master/LICENSE), [docs](https://hummingbot.org/) | Crypto strategy/connector framework; Apache-2.0. | Python/native extensions via Conda or Docker; persistent service. Good reference for connector readiness, inventory-aware quoting, paper venues and separate agent/executor responsibilities. Market-making requires order-book simulation and inventory controls beyond our candle baselines. | Paper mode uses live feeds; it does not include future-price knowledge or a proven profitable model. Arbitration/market-making retains fill, inventory, transfer, fee and latency risk; screenshot “risk-free” wording must not enter OmieBot. |
| [StockSharp/StockSharp](https://github.com/StockSharp/StockSharp), [current license](https://github.com/StockSharp/StockSharp/blob/master/LICENSE), [EULA](https://stocksharp.com/en/products/eula/) | C# trading platform with connectors, strategies and related products; current repository notice is custom/proprietary. | Observe general UX concepts only; do not import code, assets or build/install it under an assumed open-source grant. A fresh original strategy editor can be designed independently. | Public samples and connector lists are not available licensed training data or evidence that every named connector is operational/free. |

## Proposed integration boundary (engineering inference)

Keep SvelteKit on Pages as the user interface and authenticated API boundary. Keep Convex for user-owned configuration, approvals and transactional records. Retain bounded runtime coordination/quota controls in Durable Objects and bulk history/model reports in R2. Python, .NET and Rust engines should run on separate authenticated compute; none of their native services is proved to run inside the current Pages build. Adding a dependency does not solve hosting, uptime or memory/CPU budgets.

Use one canonical contract for all research runners:

```text
DatasetManifest: source, venue, symbol, timeframe, timezone, coverage,
                 rows, sha256, rights, missing-bars, ingestion-time
Experiment:      dataset-hash, strategy-version, seed, chronology,
                 training-only transforms, parameter-budget, cost-model
Report:          holdout-period, trades, net-return, max-drawdown,
                 turnover, fees, slippage, calibration, baseline-comparison
Decision:        observation-time, expiry, model-version, signal,
                 explanation, uncertainty, proposed-risk
Execution:       deterministic risk checks -> idempotent venue adapter
                 -> acknowledgement -> fills -> reconciliation
```

Research reports never place orders. Agents propose; deterministic code checks account, freshness, position limits, daily loss, order precision and duplicate IDs. A stale/missing observation is abstention. Unknown order submission outcomes are reconciled before any retry. Prefer broker-native protective orders where supported and verified; candle-only simulation must disclose its limitations.

## Actionable implementation order

1. Improve the existing offline `research-engine/research.py` evaluation: bounded chronological strategy comparisons, net transaction costs, drawdown, incumbent comparison and persisted provenance. Reuse retained exports with explicit rights; make no automatic market-data downloads during nightly training.
2. Add a research report viewer to the current Hive/Beekeeper UI. Show data coverage, tested period, cost assumptions, decision timestamps and promotion reason. Show missing data rather than fabricated curves.
3. Trial CCXT in an isolated research adapter only after package/release pinning and licence notice retention. Test public candle normalization, duplicate and partial candles, precision, rate-limit backoff, sandbox support and order acknowledgement; enable no live order path by default.
4. Select **one** external execution engine after a reproducible paper acceptance test. LEAN is strongest for a multi-asset roadmap; NautilusTrader for deterministic event/reconciliation work; Hummingbot for order-book market making. Installing all three creates operational complexity without establishing edge.
5. Evaluate strategy candidates against untouched holdout data, then a forward paper period. Model acceptance must include operational failures and net performance, not classification accuracy alone. Nightly jobs keep the incumbent on rejection or insufficient observations. Laya remains a proposal layer until calibrated against this process.

## Dataset acceptance and exclusions

No repo in this audit established an unrestricted, current, comprehensive dataset covering the requested equities/FX/crypto markets. Code license and data license are separate. Tests and synthetic samples may validate accounting invariants, but must not be used as performance proof or mixed into production-training outcomes. Every retained import needs its own manifest, known provenance, chronological integrity and usage rights.

No engines were installed, no customer funds were touched, no live orders were submitted, and no model was retrained by this audit. Recommendations are integration candidates pending pinned-source review and empirical acceptance.
