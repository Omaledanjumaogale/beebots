# E-WIN ecosystem discovery audit

Reviewed 17 October 2026. This report distinguishes inspected source, public HTTP observations and unverified application behavior. Public links support discovery; they do not establish shared authentication, paid access, cash settlement or availability.

## Verified source and production registry

The active Git checkout is `C:/Users/OMALE DANJUMA OGALE/Downloads/NEW BUSINESSES/EWIN Project Ecosystem/artifacts/private/github-checkout`, remote `https://github.com/Omaledanjumaogale/E_WIN_Project_Ecosystem.git`, initial inspected base `0c6d0ccc8370d93561e530a6660544ed2e0848c9`, then rebased onto current origin/main `73609cdd7045e588c09d0a172db8130f8662a198` after Cloudflare metadata confirmed that deployed Git revision. The parent folder itself is not a Git checkout and has an older 19-workspace manifest. The consolidated application registry is `src/lib/shared/ecosystemApplications.ts`; production `https://ewinproject.org/llms.txt` matches its 13 pre-change destinations.

| Application | Registered destination |
| --- | --- |
| BusineXense | https://businexense.ewinproject.org |
| SchoolXense | https://schoolxense.ewinproject.org |
| HalalMatch | https://halalmatch.ewinproject.org |
| Alt_Akademy | https://altakademy.ewinproject.org |
| DealXHire | https://dealxhire.ewinproject.org |
| ProFileX | https://profilex.ewinproject.org |
| HealthCareOS | https://healthcareos.ewinproject.org |
| AuditorX | https://auditorx.ewinproject.org |
| NewxTrade | https://newxtrade.ewinproject.org |
| Omie OmniMarketer | https://omieomnimarketer.ewinproject.org |
| BabaAgent | https://babaagent.ewinproject.org |
| VantagePoint | https://vantagepoint.ewinproject.org |
| PulseOdds | https://pulseodds.ewinproject.org |

The local patch adds OmieBot Trading, https://omiebot.ewinproject.org, as the fourteenth application without assigning a historical central workspace or changing subscriptions or ledger routing. Its description explicitly identifies paper results as simulated and does not promise live trading or returns.

## Production HTTP observations before this patch

These are direct unauthenticated GET observations, not browser UX acceptance or assurances about the future state.

| Mother route | HTTP | Body bytes |
| --- | --- | --- |
| `/` | 404 | 9 |
| `/ecosystem` | 404 | 9 |
| `/robots.txt` | 200 | 975 |
| `/llms.txt` | 200 | 2,394 |
| `/llms-full.txt` | 200 | 12,943 |
| `/sitemap.xml` | 200 | 5,909 |
| `/ecosystem-sitemaps.xml` | 200 | 338 |
| `/.well-known/ai-agent-manifest.json` | 200 | 8,690 |

None contained an Error 1027 body. The cause of the two 404 responses was not established. OmieBot's pre-change sitemap returned 404; reciprocal registration requires the OmieBot discovery deployment. Sister domains above are verified registry entries, not individually certified healthy services.

## Existing mother implementation

Source already includes a SvelteKit metadata factory and typed SEO head component, schema factories and graph serialization, server metadata loading, an ecosystem ItemList with application WebSite entities, explicit AI crawler rules and private route exclusions. The mother URL sitemap correctly contains mother-domain pages; a separate sitemap index links independently hosted sitemap owners. The generated manifest is informational, not an authentication or execution protocol.

README and dependencies also describe an existing Convex Workflow component and device push enrollment. Their source/configuration presence does not prove current end-to-end workflow, browser push delivery, cross-platform authorization or payments. No new wallet or referral synchronization was inferred or added.

## Isolated mother patch

Clean worktree: `C:/Users/OMALE DANJUMA OGALE/Documents/ChatGPT/Omie TradingBot/research/ewin-discovery-worktree`, branch `codex/omiebot-ecosystem-discovery`.

Changed exactly these discovery files:

- `src/lib/shared/ecosystemApplications.ts`: adds OmieBot with no central billing workspace mapping; existing directory UI and schema consume this registry.
- `scripts/generate-discovery.mjs`: updates the extraction guard to fourteen consolidated apps.
- `static/llms.txt`, `static/llms-full.txt`, `static/.well-known/ai-agent-manifest.json`: regenerated from the registry.
- `src/routes/ecosystem-sitemaps.xml/+server.ts`: adds the OmieBot sitemap reference.
- `tests/unit/ecosystemApplications.test.ts`: updates the registry size expectation while preserving uniqueness and historical mapping checks.

The original mother's unrelated dirty translations, package, README and version changes were preserved. The seven discovery edits also remain in that original checkout; release only the isolated worktree. No sister repositories or customer records were modified by this audit. The isolated change was committed and pushed as `6229f080f11a5c24eb62d0b583b088dede9088ff` on `codex/omiebot-ecosystem-discovery`, then deployed after the successful build and bundle checks. No pull request was created and the branch was not merged into main.

Cloudflare configuration: project `e-win-project-ecosystem`, adapter output `.svelte-kit/cloudflare`, production origin `https://ewinproject.org`. Preserve configured Convex URLs and server-side secrets.

## Release acceptance and manual boundaries

`git diff --check` passed in the isolated worktree. The two targeted registry tests passed, as did the initial type check, lint, security scan and full single-worker suite. After rebasing onto the latest mother source, enterprise tests, the production build and final type check passed. The first isolated build failed because required public Convex environment exports were absent; the next build uses only public wrangler values in process environment, without copying secret files. Run the mother AGENTS-required check, lint, unit/security/enterprise tests, build, bundle and relevant browser checks in the isolated worktree; do not silently skip secrets-dependent acceptance. Install dependencies from the lockfile rather than borrowing a dirty generated build.

After a reviewed deployment, verify the public directory and server-rendered graph include OmieBot, regenerate and fetch all three discovery assets, parse the sitemap index and confirm reciprocal sitemap HTTP 200, and recheck private headers and authorization. Investigate the observed mother page 404 separately. Do not interpret a static discovery response as full mother application recovery.

Search Console submission, Rich Results/Schema.org validation, measured mobile Core Web Vitals, physical-device Web Push and actual AI citations remain manual/external acceptance. No crawl signal guarantees citation or ranking. Do not invent multilingual alternate URLs, original statistics, credentials or live-investment performance.

## Sister homepage availability sample

A bounded unauthenticated HTTP sample returned OmieBot 200 and PulseOdds 200 (the latter included JSON-LD). BusineXense, SchoolXense, HalalMatch, Alt_Akademy and HealthCareOS returned 404. DealXHire, ProFileX and VantagePoint returned 429. AuditorX, NewxTrade, Omie OmniMarketer and BabaAgent failed to fetch. This is a point-in-time observation, not a provider outage diagnosis or complete browser audit. The exact sanitized results are in `research/ecosystem-health-2026-10-17.json` outside the repository.

## Deployed discovery acceptance

Cloudflare Pages production deployment `6a128632-89e9-4228-bbfb-a484750a0631` succeeded at `https://6a128632.e-win-project-ecosystem.pages.dev`, built from the clean seven-file patch on current origin/main. Public production checks at https://ewinproject.org returned:

| Route | HTTP | Body bytes | OmieBot present |
| --- | --- | --- | --- |
| `/llms.txt` | 200 | 2,619 | Yes |
| `/llms-full.txt` | 200 | 13,168 | Yes |
| `/.well-known/ai-agent-manifest.json` | 200 | 8,988 | Yes |
| `/ecosystem-sitemaps.xml` | 200 | 411 | Yes |
| `/robots.txt` | 200 | 975 | Referenced index |
| `/sitemap.xml` | 200 | 5,909 | Mother-domain URLs only |

The production homepage, ecosystem HTML page and unauthenticated admin-health endpoint still returned 404 with a 9-byte body and `Cache-Control: no-store`, matching their pre-release behavior. Consequently the deployed static directory is verified, while server-rendered directory/schema visibility and private-route HTTP acceptance remain unavailable. The deployment did not solve or diagnose this preexisting dynamic-route failure.

The build, bundle checks and compiled presence checks passed; enterprise tests after rebase passed. Initial full tests, check, lint and security checks passed. The final post-rebase type check passed. Production release evidence is saved in `research/mother-discovery-release-2026-10-17.json` outside the OmieBot repository. No customer-record or money mutation was performed.
