# AI and data ecosystem: verified integration candidates

Research date: 17 October 2026. Read-only audit of official repositories, their GitHub tree metadata, selected source files and official documentation. No upstream package was installed or executed by this audit, no model was trained, and no broker or paid data request was made. This document records source evidence and proposed integrations, not measured trading performance. Runtime REA findings are tracked separately by the coordinating audit.

## Correct the screenshot catalogue first

Some supplied slides associate the wrong explanation or installation command with a project. CCXT is an exchange interface library; HKUDS/Vibe-Trading is a finance research agent. Qlib is a quantitative research/model workflow platform; Freqtrade is a crypto trading engine with FreqAI. A slide containing `pip install pyqlib` underneath Freqtrade is not an installation instruction for Freqtrade. Repository popularity and screenshots do not establish execution reliability, profitability or licensing rights over market data.

## Verified identities and source pins

Each commit was obtained from the official GitHub recursive tree API. Branch heads can change; review the exact pin and dependency licenses before importing code.

| Project and source pin | Verified license | Useful boundary for OmieBot |
|---|---|---|
| [TauricResearch/TradingAgents](https://github.com/TauricResearch/TradingAgents/tree/e8f5503e9b86d5c2710b0c76b1f686703968c9df) | Apache-2.0 | Analyst reports, bull/bear research, trader proposal and independent portfolio/risk review. Research reasoning must remain separate from order authority. |
| [ZhuLinsen/daily_stock_analysis](https://github.com/ZhuLinsen/daily_stock_analysis/tree/7a21cd76952c7fe44a7fc5a6113a5b2b8a16bb32) | MIT | Scheduled watchlist analysis, provider normalization, report history and explicit fetch-error categories. |
| [HKUDS/Vibe-Trading](https://github.com/HKUDS/Vibe-Trading/tree/d0db2e3abce0279c366242ece2c83634cb733f05) | MIT | Research artifact provenance, trade-journal diagnostics and cost-aware backtest engine interfaces. |
| [AI4Finance-Foundation/FinRL](https://github.com/AI4Finance-Foundation/FinRL/tree/8511e7c15fbe1fbe5eb25e9f89932ac1ecd546a0) | MIT; FinRL marks separately reserved | RL environment and baseline research. Current README identifies this repository as the original educational/research framework and directs production-oriented work toward FinRL-X. |
| [TradeMaster-NTU/TradeMaster](https://github.com/TradeMaster-NTU/TradeMaster/tree/1747cc18db3fe2639af12defc80e138c51a625c0) | Apache-2.0 | Configurable task-specific datasets, agents, trainers and evaluation; default branch is `1.0.0`, not `main`. |
| [microsoft/qlib](https://github.com/microsoft/qlib/tree/54355232463878d2eebb91fe0ee5fa7fa1f5976c) | MIT | Reproducible model/handler/dataset configuration, train/validation/test segments and experiment records. |
| [OpenBB](https://github.com/openbq-org/OpenBB/tree/7f4935488497afb47f3a013e306bca299cc8dc15) | Current root LICENSE explicitly Apache-2.0 | Typed provider results and normalized data interfaces. Original OpenBB-finance URL redirected to `openbq-org/OpenBB` during this audit. Check the chosen version: older OpenBB releases used different licensing. |
| [Open-Dev-Society/OpenStock](https://github.com/Open-Dev-Society/OpenStock/tree/b1999adbef0ef07a075a712ab062b0d08ac72fbf) | AGPL-3.0 | Reference for watchlists, alerts and company research UX. Do not copy implementation into the MIT app without deliberately addressing applicable source-sharing obligations. |
| [Fincept-Corporation/FinceptTerminal](https://github.com/Fincept-Corporation/FinceptTerminal/tree/3d8617cae3f13c93874d4bee4fb0f2846e9c83bc) | AGPL-3.0-or-later per README; AGPL text verified | Reference for research workspace organization and isolated backtest-provider processes. Desktop Qt/C++ and Python runtime is not a Cloudflare Pages dependency. |
| [freqtrade/freqtrade](https://github.com/freqtrade/freqtrade/tree/07ef2d4e93ed5f62cf6625ae29c347df4775bb8e) | GPL-3.0 | External crypto dry-run benchmark and FreqAI research sidecar; retain separation and satisfy license obligations if distributing derived software. |

GitHub license detection returned `NOASSERTION` for OpenBB and Fincept; their actual LICENSE texts were fetched and read rather than treating missing API classification as absence of a license. Licenses of optional packages, models, assets and data require their own review.

## Source interfaces that can actually guide implementation

### Structured research decisions

[TradingAgents schemas](https://github.com/TauricResearch/TradingAgents/blob/e8f5503e9b86d5c2710b0c76b1f686703968c9df/tradingagents/agents/schemas.py) define typed research, trader and portfolio outputs. The tree also contains analysts, bull/bear researchers, managers and lookahead tests. OmieBot can implement a small original JSON envelope: analysis time, instrument, observation cutoff, evidence references, proposed action, uncertainty, costs, risk objections and final abstention/rejection reason. A textual proposal is neither a verified order nor a calibrated probability. Use a bounded number of reviewers and require the deterministic risk gate after every proposal. Source presence proves an interface exists; this audit has not benchmarked its decisions.

### Provider degradation and report delivery

[DSA provider base](https://github.com/ZhuLinsen/daily_stock_analysis/blob/7a21cd76952c7fe44a7fc5a6113a5b2b8a16bb32/data_provider/base.py) distinguishes fetch failures, rate limits and unavailable sources, and normalizes market codes. Adapt that distinction to OmieBot's quota gate: retrying an exhausted source must not silently fall through to a paid source. Its reports/watchlists provide a useful low-frequency daily research product; notifications remain opt-in and must not trigger trades. Free upstream sources can still throttle and change.

### Cost-aware research artifacts

[Vibe-Trading BaseEngine](https://github.com/HKUDS/Vibe-Trading/blob/d0db2e3abce0279c366242ece2c83634cb733f05/agent/backtest/engines/base.py) exposes execution eligibility, size rounding, commissions and slippage, alongside data-source run-card helpers. OmieBot should keep these as instrument-specific contracts rather than assuming a universal percentage fee or fill rule. Its [security policy](https://github.com/HKUDS/Vibe-Trading/security) explicitly identifies generated Python backtests as code execution: generated strategies belong in a network-restricted disposable research runner with no trading credentials, never the web request process.

### Chronological learning and promotion

[Qlib Alpha158/LightGBM workflow](https://github.com/microsoft/qlib/blob/54355232463878d2eebb91fe0ee5fa7fa1f5976c/examples/benchmarks/LightGBM/workflow_config_lightgbm_Alpha158.yaml) names a model, dataset handler and separate chronological train/valid/test ranges. Its [workflow documentation](https://qlib.readthedocs.io/en/latest/component/workflow.html) describes experiment recording. Use the pattern with OmieBot's own licensed exports, forward labels and embargoed splits. The sample Chinese-equity dates/features are not crypto validation evidence. Persist dataset hash, code/config/model hash, cutoff, costs, fold metrics and incumbent comparison in each R2 evaluation artifact.

[FinRL training entry](https://github.com/AI4Finance-Foundation/FinRL/blob/8511e7c15fbe1fbe5eb25e9f89932ac1ecd546a0/finrl/train.py) and [TradeMaster task trainer](https://github.com/TradeMaster-NTU/TradeMaster/blob/1747cc18db3fe2639af12defc80e138c51a625c0/tools/algorithmic_trading/train.py) are offline research candidates, not free trained money-making agents. RL needs a defensible simulator, reward function, transaction costs, reproducible seeds and out-of-sample comparison. Start with simple baselines before adding expensive RL. Avoid universal action mappings between stocks, leveraged FX and crypto contracts.

### External adaptive-training benchmark

[FreqAI example strategy](https://github.com/freqtrade/freqtrade/blob/07ef2d4e93ed5f62cf6625ae29c347df4775bb8e/freqtrade/templates/FreqaiExampleStrategy.py) separates feature expansion, standard features, targets, entries/exits and entry confirmation. [Official FreqAI documentation](https://www.freqtrade.io/en/stable/freqai/) describes retraining, disk model retention and separate prediction operations, and explicitly says the example is not designed for production. Its [lookahead analysis](https://www.freqtrade.io/en/stable/lookahead-analysis/) offers a useful external leakage check. OmieBot should adopt equivalent tests in its original engine or run Freqtrade as a separately licensed dry-run benchmark. Do not enable its automatic download behavior when the requirement is retained-data-only training.

### Data presentation contracts

[OpenBB standard models](https://github.com/openbq-org/OpenBB/tree/7f4935488497afb47f3a013e306bca299cc8dc15/openbb_platform/core/openbb_core/provider/standard_models) are an inspectable basis for separating provider requests, canonical fields and metadata. They do not confer provider subscriptions. OpenStock and Fincept are UI references, not datasets or pretrained models. Reimplement useful interactions with OmieBot components and provenance labels; copying an entire workstation is unnecessary.

## Data suitability and training permission

No audited repository was established to contain a complete, licensed, representative OmieBot trading training corpus. Code licensing does not license external feeds, historical exports, user journals or model weights. Test fixtures and tutorial notebooks can validate parsing and accounting; they must not become evidence of live profitability.

Every candidate dataset needs instrument/venue, interval, timezone, observation availability, adjustments, missing-bar policy, provenance, retention/training rights and a content hash. Published reports and news need their actual availability time to avoid hindsight. User journals need explicit data-use consent and isolation. Do not ingest secrets, personal account identifiers or executable instructions as market observations.

## Deployment fit and recommended sequence

This deployment assessment is an architectural inference from the inspected dependencies, not a Cloudflare benchmark. Full Python ML stacks, NumPy/pandas/LightGBM/PyTorch, desktop Qt/C++, local databases and long-running broker loops do not fit the current JavaScript Pages/Worker free-runtime design as drop-in packages. Keep UI/auth on Pages, quotas/risk/state on the Worker/Durable Objects, bulk exports/artifacts on R2, and heavier training/inference in an explicitly budgeted isolated sidecar. Local ONNX Laya inference is a separate component and is not trained by importing any of these repos.

1. Immediately strengthen original contracts: typed research proposals, provider outage categories, data cutoff/provenance, duplicate-safe actions and versioned evaluation artifacts.
2. Evaluate the same retained data through baseline backtests with costs, purged chronological folds and untouched final test data. Record abstentions as well as actions.
3. Expose evidence, candidate status, rejected promotions, drawdown, costs and data freshness in the existing Hive/training UI. Avoid invented activity counters or ROI targets.
4. Add one isolated Qlib or FreqAI comparison runner after dataset rights, installation compatibility, resource budget and license boundary are established. Do not install every ecosystem framework into production.
5. Promote only after forward paper evidence and deterministic risk checks; the supervisor cannot approve its own increase in capital, leverage, permissions or spending quota. Any live execution still requires the intended broker account, venue/instrument permissions and operational acceptance.

This audit proposes interfaces and integration priorities. It does not claim that any external model, framework, strategy, dataset or copied UI has been incorporated or proven profitable.
