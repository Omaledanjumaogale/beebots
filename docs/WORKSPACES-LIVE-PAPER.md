# Live and Paper Workspace delivery record

17 October 2026, Africa/Lagos. Live execution remains incomplete and disabled. This document separates implemented behavior from market, account and execution acceptance.

## Workspace boundaries

`/paper` is the shared research fleet, with simulated starting capital of 10,000 USD per baseline Bee. This is not a customer's wallet or broker balance. `/live` uses only the authenticated profile's linked OKX account records. `/connect/okx` verifies and encrypts that account connection. The legacy local-browser trading interface remains at `/terminal`. The public Hive now projects the new paper fleet rather than the stale OKX paper feed.

Live and paper do not share capital, positions, order ledgers or credential sets. Alpaca BTC/USD observations do not become executable OKX BTC-USDT prices. No customer money is accepted, moved, pooled, paid out or traded by this change.

## Productive paper pipeline

- Dedicated Durable Object namespace `paper-alpaca-btc-usd-v1`, isolated from the legacy OKX namespace and BTC-USDT history.
- One verified current five-minute BTC/USD closed-bar evaluation every five minutes. Five spot pairs have a separate operator-authorized bid/ask view with a 60-second shared cache. This is polling, not a tick WebSocket service, and not all global markets.
- Conservative local provider ceilings of six requests per minute and 3,000 per day, shared reservations before calls, and upstream backoff. The actual authenticated market response returned `X-RateLimit-Limit: 200`; application budgets retain headroom rather than consuming that full minute entitlement. A continuously open quote view plus five-minute evaluation fits inside the application day budget. These ceilings are not a claim about other subscriptions or purchased data rights.
- OHLCV integrity, timestamp alignment, duplicate, closed-bar and freshness checks. Missing historical intervals cause explicit latest-contiguous-segment selection. Source gaps are recorded and the fetched gap-containing source window retained privately; no candles are imputed. A short/stale recent segment abstains.
- R2 retention includes full OHLCV, provider/venue/instrument/interval identity, time range and SHA256. Older OKX bars are never merged into it. Raw Alpaca data is not exposed through the public API; operator market-data access remains separate from future customer entitlements.
- Three deterministic long/cash rules execute only simulated fills with declared fee/slippage assumptions. There are no invented historical fills. A non-signal remains hold. Learned probabilities cannot override coded execution rules.
- Daily fitting at 04:00 Africa/Lagos and an operator manual trigger. It fits numerical logistic weights for the existing three-feature method. The same fitting method/data currently serves three Bee shadow channels; identical fitted models do not imply three independent alpha discoveries.
- Reports retain training sample counts, ten epochs, dataset hash, development metrics and baseline comparisons. Timestamped history and latest pointers are separate. This is a development screen, not independent release approval or Laya weight fine-tuning.
- Predictions are recorded before their next observed bar is scored. Forward shadow counts, Brier sum and costed long-entry proxies exclude same-bar results and duplicate evaluations. The aggregate may span model updates and is explicitly labelled a proxy, not a frozen-model promotion test.

## Verified production run

At 14:38 WAT, bootstrap succeeded with 1,819 uninterrupted closed BTC/USD bars. Two older missing intervals were identified and 180 earlier bars excluded from the fitted segment. Dataset SHA256: `0da016d7dedb9ab0af616701b7cf425f16ad4f5145925d651bccea7b3b6da798`.

All three actual fitting jobs completed and were rejected: development Brier 0.2500946817 versus training-prevalence baseline 0.2499067434; 540 evaluation samples; zero confidence-qualified long entries. No strategy edge, return or promotion is established. Three paper account records were created and the initial fresh evaluation produced zero fills. Subsequent cycle activity must be verified separately.

Five fresh spot quotes were verified for BTC/USD, ETH/USD, SOL/USD, LTC/USD and DOGE/USD. A quote response does not prove an actual fill or a subscription covering other instruments.

The first actual-market offline tournament also ran on 1,819 actual bars with the original five-candidate pipeline. Validation selected the simplified Breaker baseline. Its final holdout had eight entries and negative return proxies of -1.42%, -2.99% and -6.06% at 20, 40 and 80 basis-point round-trip cost assumptions respectively. These are historical research proxies, not investor ROI or actual broker fills. The consumed holdout and all losing scenarios are retained; no automatic activation occurred. A compact derived-metrics artifact is included in the workspace, while raw observations remain private.

At 14:46 WAT, an independent read verified scheduled evaluations at 14:40 and 14:45 WAT after the bootstrap. The retained dataset had grown to 1,821 bars, each Bee had three recorded equity observations, and one previously recorded forecast had been scored against the subsequent closed bar. The latest learned probability was 0.5136184 and each baseline held; there were zero simulated fills. This establishes an operating forward observation loop, not profitability or sufficient promotion evidence.

## OKX connection and proposed live policy

The user selected OKX and authorized discretionary starting limits, a minimum allocation equivalent to 100 dollars, and a user-chosen upper allocation. The implemented quote-currency minimum is **100 USDT**, not a guaranteed USD peg. A user cannot allocate more than their verified available trading-account USDT. The numerical accounting guard is 100 million USDT; this is an implementation ceiling, not approval to deploy that amount.

The stored starting policy is: spot only; no leverage; per order at most 5% of the allocation capped at 25 USDT; total exposure at most 20%; daily loss pause threshold 2%; four new entries per day. These values are **recorded defaults for a future executor**, not currently enforced live trading behavior. A daily threshold cannot guarantee a maximum loss during gaps, liquidity events or outages.

Connection security:

- An existing authenticated OmieBot session determines the owner server-side. Browser-supplied owner IDs and execution permissions are ignored. Connection writes require same-origin requests.
- The trusted Pages-to-Worker bridge verifies account balances, account identity and existing spot order records directly against allowlisted OKX origins with authenticated V5 GET signatures and `x-simulated-trading: 0`.
- API keys with withdrawal permission are rejected. Trade permission is recorded but never treated as execution acceptance.
- AES-256-GCM encryption uses a separate server-only vault key, random nonce and profile-bound authenticated data. Credentials never appear in public responses or database-readable plaintext. Revocation remains available at OKX; replacing a connection requires re-verification.
- A serialized owner registry prevents one OKX account from being assigned to another OmieBot profile. Private account reads have a short server cache, and link attempts are limited to five per 15 minutes per profile.
- The user must confirm adulthood, account ownership and risk. Linking does not move funds, accept provider agreements or activate orders.

No real OKX credentials were available during implementation. Live API signatures, encryption, account separation, rejection paths and response shapes have fixture tests; an actual OKX connection, funded account and live execution are unverified. No synthetic broker fixture is presented as an actual account.

## Remaining live acceptance work

1. User links their own funded OKX account through the authenticated form. Verify correct regional endpoint, API permissions, account eligibility and actual available USDT without showing account data publicly.
2. Verify OKX-native market data from the deployed runtime, instrument tick/lot/minimum rules, fees, buying power and venue state. Resolve the earlier OKX feed failures.
3. Implement and independently validate actual spot order submission, acknowledgement versus fill state, client-order idempotency, unknown-outcome reconciliation, partial fills, fees in different currencies, and protective exits. This release intentionally contains no OKX order POST path.
4. Enforce the recorded per-owner capital/exposure/daily-loss policy against the attributable broker fill ledger, with kill switch and account reconciliation. Account-wide equity changes must not be mistaken for strategy P&L.
5. Obtain frozen-model forward-paper evidence, live activation acceptance, customer-specific account/entitlement mapping and applicable provider/legal acceptance. Shared simulated fleet results and a funding-screen number do not establish these.

Primary implementation references: [Alpaca crypto bars](https://docs.alpaca.markets/us/reference/cryptobars-1), [Alpaca authentication](https://docs.alpaca.markets/us/docs/authentication), [OKX V5 API guide](https://www.okx.com/docs-v5/en/). Their API descriptions establish interfaces, not this application's provider acceptance or profitability.
