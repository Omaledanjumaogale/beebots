# OmieBot Laya decision service

Installed @receptron/laya0.1.2 with pinned ONNX revision68f27dfe5a27a54fb2b1fefc432f43f972e90868. Model weights are local ignored files; installed manifest hashes record exact artifacts. Runtime wrapper MIT; original model Apache2.0 (verify model distribution notices before redistribution).

Run npm ci, npm run install:model, npm test. For actual inference set OMIE_LAYA_INPUT to a chronological closed BTC-USDT JSON export and npm run smoke. Model requires about1.7GB weights and substantial native process RAM. It cannot run inside a Cloudflare Pages/Workers isolate. A separately hosted persistent Node inference service is required for production; no public unauthenticated model endpoint is enabled.

policy.mjs compacts state and creates typed action/coach questions. Both outputs remain proposals. Model advice cannot bypass code risk limits, modify balances, move funds, approve a challenger or activate live mode. Laya classifies typed answers and does not author new rule prose. Its probabilities require domain calibration; benchmark numbers in upstream docs do not prove trading edge.

The installed base weights are pretrained, not fine-tuned on OmieBot trades. The current daily edge logistic trainer does not fine-tune Laya. Laya weight training requires labeled historical decision outcomes, a chronological train/calibration/test manifest, adequate compute and the upstream training implementation (the Node package provides inference/export, not weight-training). No labeled OmieBot corpus or GPU trainer was supplied; do not claim completed trading fine-tuning. Zero API charges does not mean zero compute cost.

`npm start` runs an authenticated single-flight shadow endpoint bound to127.0.0.1:8789. Set OMIE_DECISION_TOKEN to a random secret of at least32characters. POST /decision accepts only compact validated BTC-USDT baseline evidence; GET /health also requires authorization. The service never sends broker orders. Hosting and authenticated edge connectivity are pending.
