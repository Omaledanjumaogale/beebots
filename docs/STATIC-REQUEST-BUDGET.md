# Static delivery and request budget — 17 October 2026

## Routes and deployment contract

Static HTML shells: `/`, `/terminal`, `/paper`, `/live`, `/hive`, `/research`, `/invest`, `/invest/terms`, `/admin`, `/login`, `/connect/okx`.

Only `/api/*` and `/.well-known/*` are included in the adapter-generated `_routes.json`. Static files and prerendered pages are explicitly excluded. The adapter configuration owns this file; a competing file in `static/` is deliberately avoided. All account data, authentication/OAuth callbacks, credentials, account mutations and operator data stay on protected APIs. A static `/admin` shell contains no records and grants no admin authority.

`static-routes.mjs` is the route inventory used by the adapter and build verifier. `npm run build` fails if any expected HTML shell, exclusion, service worker or recovery page is missing. Its postbuild script replaces the adapter's plaintext `404.html` with the yellow/black recovery document and adds exact-route `X-Omie-Shell: static-v2` headers. `npm run verify:deployment` checks HTML, markers, recovery status and anonymous API rejection. `npm run deploy` and the local production deployment helper run this verification after publishing; an unavailable protected API fails acceptance.

## Request audit and reductions

There are no `+page.server.ts`, `+layout.server.ts` or server load functions in the app. Public landing rendering makes no API calls. Earlier SSR navigation consumed one Function request per page; the preceding release had already added prerendering. This release narrows the remaining `/*` catch-all so unknown public paths and arbitrary static assets also avoid Functions.

Before these changes, each visible Paper Workspace could refresh every 30 seconds and check a session on mount. A signed-in member also attempted the operator-only market endpoint repeatedly, receiving 403 responses. A live view requested paper, live-account and market state on the same timer. The terminal automatically fetched chart and market data every minute, including in hidden tabs. The hive polled every minute. These patterns multiply across tabs and users even if provider lookups are cached.

Now:

- Pure static navigation: **zero page-rendering Function invocations**, a reduction of one per navigation relative to SSR. Relative to the immediately preceding prerender release, known-page rendering was already zero; this release adds API-only routing, static markers, recovery and enforcement.
- Paper and Hive public projections: one initial read, then at most one every five minutes while visible and online: approximately 12/hour versus Paper's 120/hour (90% fewer scheduled reads) or Hive's 60/hour (80% fewer). These are client cadence estimates, not billing-meter measurements.
- Public page loads never automatically request live balances or operator markets. Live-account loading is explicit. Optional private auto-refresh is off by default and runs at most once/minute after account loading. Market reads are explicit and operator-only. The terminal starts with clearly marked synthetic preview data and performs no automatic provider requests; choosing a market/interval or placing an explicit simulated order can request authenticated fresh data.
- Concurrent identical browser reads share one promise. Public projections reuse a 60-second in-memory snapshot; private account responses are never retained in that cache. Service failures trigger cooldown and polling backs off up to 15 minutes. Hidden/offline tabs skip polling; cleanup clears timers. Link hover data prefetching is disabled.
- The authenticated gateway stamps a hashed owner read identity; the Worker enforces a separate 12/minute and 240/day read budget per verified owner. It never trusts a browser-supplied owner. Operator market endpoints now verify admin identity and return private/no-store responses. Existing provider request budgets remain in force. Rate limiting cannot undo the initial Pages invocation, so it bounds upstream work, not all edge billing.
- Numerical fitting is removed from Worker request handlers and cron. `/admin/paper/train` and the internal train action fail closed with an external-workflow instruction. Daily training reads and writes R2 directly from Node in GitHub Actions. The five-minute paper market cycle remains in the Worker; no external AI service replaces routing, authentication or storage.

## Offline and query handling

The service worker caches only immutable build assets and public shells (`/`, `/paper`, `/hive`, `/research`, `/terminal`) plus `/offline.html`. API/discovery paths, POSTs, credentials, balances, private snapshots and private page shells are never intercepted or cached. Public navigations try the network first and fall back to a cached shell on failed requests. Old caches are removed on activation. A new visitor still needs a network connection for the first install. Physical-browser offline acceptance is pending because browser tools are disabled in this session.

The terminal reads `symbol` and `bar` only inside `onMount`, using allowlists. Example: `/terminal?symbol=ETH-USDT&bar=1H`. Sign-in's `returnTo` is resolved after a successful explicit login and accepts only local paths; protocol-relative URLs and backslashes are rejected. There is no server query-dependent prerender state.

## External training

`edge/train-batch.mjs` reads bounded retained datasets through the Cloudflare R2 REST API, fits the existing numerical model outside Workers, and stores hash/revision-addressed reports plus latest pointers. Identical inputs and training revision produce no writes. It does not submit broker orders, promote models or publish raw datasets.

The runner's account-level R2 Storage Read/Write token is separate from the deployment token and configured as GitHub secrets `OMIE_CF_ACCOUNT_ID` and `OMIE_R2_API_TOKEN`. The token can access account R2 storage; bucket-level permission tightening is a remaining credential improvement. No broker/Pages signing credentials are supplied to Actions. Workflow logs print only sample counts, status and hashes. Training is serialized and capped at ten minutes. The scheduled workflow must exist on the default branch; it checks out the production-equivalent branch explicitly so scheduling does not depend on merging the wider draft PR.

Actual external execution: first acceptance run used 1,883 retained Alpaca bars for three paper candidates, all rejected. Three older legacy datasets had 631 samples and were skipped. A second run made **zero writes across all six jobs**. A later run with the dedicated token read 1,885 Alpaca bars and wrote three updated rejected reports. These results do not establish profitability or live approval.

## Production verification and limits

The deployed static check verified all 11 routes as HTTP 200 HTML with `X-Omie-Shell: static-v2`. An unknown public path returned HTTP 404 with “Service temporarily limited” and recovery navigation. Protected endpoint probes returned HTTP 404 during shared Cloudflare quota exhaustion, **not the expected 401**. The verifier exits nonzero for these failures. Local gateway tests prove owner/admin guards, but deployed authorization acceptance remains pending while Functions are unavailable.

The generated route rules plus successful static delivery during the quota outage support zero Function rendering for these pages. No per-request production invocation-log correlation was available; do not claim an independently measured account-wide percentage reduction. Other Workers/Pages projects share the allowance and can still exhaust it. This app cannot guarantee account-wide headroom.

## Operator checklist

1. Run `cd web; npm run build`; expect the 11-shell contract to pass.
2. After publish run `npm run verify:deployment`; require every check to pass before calling the full backend release accepted.
3. Request `/paper`, `/live`, `/admin` directly and confirm static marker + HTML. Request an unknown public URL and confirm the recovery page with status 404.
4. Once Functions are available, verify anonymous private APIs return 401, ordinary members receive 403 for admin/operator data, and owner data stays isolated.
5. In a browser, load a public page once, go offline and revisit it. Confirm no API/credential/private response exists in Cache Storage. Reconnect and refresh evidence before trusting current markets.
6. Open the terminal query example and confirm ETH/1H initializes without a server request. Watch a hidden Paper tab for no scheduled API calls and a visible one for the five-minute cadence.
7. Check the retained-data training workflow on GitHub, verify daily scheduling and repeat unchanged input with zero writes. Review account-wide Worker request analytics separately from OmieBot's cadence estimates.

Rollback: restore the prior Pages/Worker versions while keeping private R2 data. Do not restore request-handler training or the legacy minute Convex ingestion loop. The API-only route include list must expand deliberately if a future protected route is added outside `/api/`.
