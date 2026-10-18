# OmieBot AI Trading research worker

This separate Python 3.10+ standard-library worker actually fits a small regularized logistic baseline. It is not an LLM, a recovered proprietary model or a proven profitable strategy. All outputs are **shadow-only**, never execution approved. No credentials, paid calls, live orders or account access are implemented.

## Inputs and use

CSV schema: `timestamp,open,high,low,close,volume`. Timestamp is UTC Unix **milliseconds at bar open**. Supply strictly increasing, uniformly spaced, confirmed closed bars from one instrument and one interval, with positive prices, coherent OHLC and nonnegative volume. Minimum 200 bars is a technical floor, not sufficient evidence of reliability. Gaps, duplicates, mixed intervals, invalid OHLC, future and unclosed candles reject the dataset. Data rights and source are required manifest fields; these fields record operator attestations rather than verifying a license.

From this directory:

```sh
python research.py fetch --symbol BTC-USDT --bar 5m --pages 10 --out datasets/btc-5m.csv
python research.py train --csv datasets/btc-5m.csv --source "OKX public spot history; BTC-USDT 5m" --rights "Record your actual permitted training/retention rights here" --out experiments/btc-v1.json
python -m unittest -v
```

Fetching is optional and separate from training. It uses only the official public OKX history-candles endpoint, selects `confirm=1`, deduplicates, sorts, limits pagination to 50 pages of 100 bars, uses a 15-second timeout and delays between requests. It never retries indefinitely. Geographic restrictions, network failures and provider changes may prevent fetching. Public accessibility does not settle retention or redistribution rights. Forex requires a separate licensed input pipeline; this fetcher is spot crypto only.

## Reproducible evaluation

Four features use closed historical bars only: 1/3/12-bar log returns and 20-bar realized return volatility. Targets predict whether return from **next-bar open** to horizon-bar close is positive. The default horizon is three bars. Feature warmup and future labels remove boundary samples. Three expanding chronological walk-forward evaluations use only the first 80% development segment; the last 20% is a final chronological holdout. Training rows whose labels reach evaluation start are purged. Normalization fits only each fold's training data. Hyperparameters and entry threshold are fixed by CLI, never optimized against the holdout.

Full-batch deterministic gradient descent fits logistic weights with L2 regularization; the intercept is unpenalized. The artifact records scaler parameters, fitted weights, feature names, training prevalence, fold boundaries, Brier/log loss/accuracy, comparison to training-prevalence Brier, and long/cash return proxies with declared round-trip costs. Entry probability threshold defaults to 0.6 and abstains below it. Opportunities are horizon-spaced to prevent overlapping capital reuse; no shorting or leverage is assumed. Metrics include entry count, abstention, drawdown and net win rate, including zero-entry behavior. These are research proxies: next-open fills, fixed costs and terminal close exits omit impact, latency, depth, funding, spread variability and stops. Walk-forward samples are still serially dependent; the worker does not claim significance or calibrated probabilities.

Dataset bytes and worker source get SHA256 hashes; artifact records git revision, Python version, parameters and UTC time. The final artifact hash prints after creation. Deterministic training makes model parameters reproducible; creation timestamps and absolute dataset paths mean complete JSON bytes vary across runs. Outputs use exclusive creation to preserve prior results. Save the CSV, source revision and artifact together. No output silently promotes a Convex candidate, activates a Bee or changes risk limits.

## Fixed candidate tournament

`tournament.py` adds a bounded comparison inspired by the reviewed Qlib, Jesse and execution-engine workflows. It is original OmieBot code, with no upstream engine dependency. Run `python tournament.py --csv datasets/licensed.csv --source "Actual provider and instrument" --rights "Actual training/retention rights basis" --out experiments/new-tournament.json`.

Five fixed candidates compete: three simplified long/cash baselines and two thresholds on the existing logistic model. Training uses the first 60%, selection uses the following 20% at the highest declared cost stress, and only the selected candidate consumes the final 20% holdout. Label overlap is purged. Default round-trip costs are 20, 40 and 80 basis points. Reports record abstention, entries, return/drawdown proxies, buy-and-hold, trial count, source and dataset/code hashes. These simplified baselines are not identical to the production position/stop logic. No output activates execution. Preserve consumed holdouts and obtain a new untouched release period after reviewing results.

## Recurring research batches

`run-batch.ps1` is an **unscheduled deployment template**. Run it on a separate always-on worker after configuring dataset rights and permitted source. It writes immutable timestamped datasets/artifacts, uses a lock directory to prevent concurrent runs, and exits on failure. A deployment operator can use their own scheduler (for example Windows Task Scheduler daily) after confirming capacity and data permissions. Nothing in this repository installs a task or automation. Convex's paper cron is separate and does not run this Python process.

Continuous collection/training creates new challenger artifacts, not automatic performance improvements. Supply new untouched time periods after inspecting holdouts, preserve all failed experiments, control multiple comparisons, compare cost stresses and regime coverage, then run frozen challengers forward on paper. Statistical reliability, signed artifact validation, external model service integration, drift triggers, institutional security, risk acceptance and live execution are further work. Do not promote based on this worker's training completion or a positive return proxy.

Tests use synthetic fixtures solely to verify normalization isolation, future-feature invariance, purging, learned controlled signal, target chronology, cost/abstention accounting and artifact provenance. They are not market performance evidence.
