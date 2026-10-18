# OmieBot AEO, discovery and enterprise implementation

Editorial release: 17 October 2026. This report covers the OmieBot source implementation and the separately verified E-WIN mother discovery patch. It does not certify every sister service, search ranking, AI citation, physical-device delivery or live trading execution. See [the full source package](IMPLEMENTATION-PACKAGE.md) for complete file contents and [the ecosystem audit](ECOSYSTEM-DISCOVERY-AUDIT.md) for point-in-time production evidence.

Release evidence: OmieBot deployment b19fd341 served all five public discovery pages with one parseable JSON-LD graph and a canonical link each. The exact homepage banner, robots, llms/full, sitemap, RSS and manifest were verified over HTTP. The social PNG measured 1200 by 630 pixels; the admin shell returned noindex. Local suites passed 37 web and 36 runtime tests. On 18 October, authenticated workflow run 39161372546 succeeded and its callback completed in Convex; immediate duplicate starts returned the same job. Protected API checks previously failed during the shared Cloudflare quota outage, and an 18 October recheck encountered a connection timeout. Neither result establishes API recovery. Browser interaction, physical push receipt, translated content, Search Console submission, measured Core Web Vitals and sister-wide recovery remain unverified or incomplete.

## Section 1 — Technical configuration files

Implemented `web/static/robots.txt`, `llms.txt`, `llms-full.txt` and `.well-known/ai-agent-manifest.json`. Named AI crawlers share public allow rules and private-route exclusions. Robots rules are indexing preferences; session and role checks enforce private access. The manifest is informational and is not a universal agent authorization standard.

The sitemap and RSS use SvelteKit `+server.ts` handlers with `prerender = true`. Their public route registry is the build-time source of truth, so generated XML is directly served as a static asset without a Convex query. The sitemap contains this host's canonical public URLs only. Robots references the independently owned mother sitemap; the mother's ecosystem sitemap index links OmieBot. No public blog, docs topic, glossary or FAQ route existed to scan, so none was fabricated.

`hooks.server.ts` and generated Pages `_headers` apply private/no-store/noindex protections, content-type sniffing protection and discovery caching. Static headers matter because static Pages responses bypass request hooks. Static page rendering remains free of request-time database work. API and credential routes are excluded from offline caches.

## Section 2 — SEO head and metadata layer

Typed `PageSEO`, Open Graph, Twitter and schema interfaces support `buildMeta()` and the reusable Svelte 5 `SEO.svelte` head component. Universal metadata defaults come from the layout server load, with page server-load overrides for the landing page and ecosystem directory. The prerendered output contains metadata and public content before hydration.

The head includes title, description, same-host canonical, robots, Open Graph, Twitter and a safely serialized JSON-LD graph. Canonicals omit query strings and fragments. Shared 1200×630 artwork is a local generated social asset. Private static shells contain no account records and are marked noindex; authenticated data loads retain backend authorization.

Dates identify editorial revisions, not market freshness. The current language is `en-NG`; no nonexistent translated URLs, hreflang variants or translated content are advertised. No claim is made that crawl signals can guarantee discovery or citation.

## Section 3 — Schema markup system

`web/src/lib/schema/` provides organization, website, person, breadcrumb, article, FAQ, HowTo and service factories. `buildPageGraph()` merges entity IDs and escapes script delimiters before rendering one JSON-LD graph through `<svelte:head>`. Public page schemas originate in load data. The landing FAQ schema must match visible FAQ answers.

OmieBot references the E-WIN parent organization and the owner-supplied founder profile. The local logo uses the actual favicon URL, not the mother's homepage as an image. No investment credential, proven model profitability, offer price, aggregate review, guaranteed ROI or nonexistent SearchAction is inserted. Organization and website nodes use appropriate entity properties; article publication dates are supplied only when an actual article exists.

<!-- MANUAL STEP --> Validate the final production source in Google Rich Results Test and Schema.org Validator. Valid Schema.org markup does not establish eligibility for a search engine's restricted FAQ presentation or other rich results.

## Section 4 — Content structure templates

Reusable `TLDRBlock`, `AuthorCard`, `FAQSection`, `RelatedLinks` and `PageTemplate` components provide answer-first text, accessible native FAQ disclosure, semantic article sections, author attribution, editorial dates, references and related destinations. Public workspaces receive a concise server-rendered summary; the dynamic ledger remains explicitly timestamped. Landing headings and links receive stable deep-link IDs where integrated.

The mandatory landing banner states exactly: “A platform under the Elite Workforce Impact Nigeria (E-WIN) Project Ecosystem”. It has Organization microdata, a parent link, responsive wrapping and reduced-motion handling. The founder card does not invent a photograph, professional certification or social profile.

No Markdown content pipeline was present. Adding mdsvex solely to wrap existing Svelte pages would add maintenance without a real content source, so it was not installed. Future Markdown must be sanitized and rendered into semantic HTML at build/server time, with typed frontmatter and editorial review.

Global reactive toasts replace duplicate feedback blocks in touched workspaces; the provider uses semantic live regions and dismissal. A focusable tooltip component explains complex actions without requiring a hover-only device. This is targeted implementation, not a claim that every legacy control has passed device/browser interaction testing.

## Section 5 — Optimized pages and enterprise workflows

The landing page retains the yellow/black bee visual identity while exposing paper-mode boundaries, FAQs, parent relationship and sources. `/ecosystem` links the parent and registered sisters, with explicit separate-account and separate-ledger boundaries. `/paper`, `/hive` and `/research` have static summaries and public discovery metadata. `/live`, `/terminal`, `/invest`, `/admin`, `/login` and `/connect/okx` remain excluded from indexing.

There are no new blog, docs, team, standalone FAQ or glossary routes. Existing route functionality and ownership checks are preserved. A platform relationship does not imply shared login, subscription access, referral credit, wallet balance, payment settlement or authority to trade user funds.

The administrator workflow manager writes bounded job metadata in Convex and dispatches expensive fitting to GitHub Actions. Training, verification and sequential training-plus-verification are explicit job types. Duplicate active starts, daily start limits, authenticated callbacks, terminal-state idempotency and timeout handling protect the dispatcher. See [workflow acceptance](WORKFLOW-ACCEPTANCE.md) for registered workflow IDs and execution evidence. A successful orchestration run is not successful model qualification.

Device notification enrollment is explicit and uses PushManager with VAPID. Subscriptions are scoped to the authenticated owner, stored through the private runtime and bounded per owner. Provider endpoints are allowlisted; delivery requests have timeouts and reject redirects. Callback-triggered notifications contain generic workflow text rather than account details. A provider accepting a push request does not prove physical device receipt.

<!-- MANUAL STEP --> Device permission and a real supported browser/device are required to verify push delivery. Check current VAPID/provider configuration and subscription enrollment before claiming production delivery. No silent automatic permission prompt is used.

## Section 6 — Integration roadmap and validation

1. **Foundation:** review static crawler assets, local brand asset, layout metadata and Pages routing/header contract. Existing dependencies come from `cd web` then `npm ci --legacy-peer-deps`; there is no new SEO parser dependency. Web Push uses `@block65/webcrypto-web-push`, recorded in the lockfile; reproduce its exact version with the lockfile rather than an unpinned installation.
2. **Schemas:** use typed factories in load functions and compare the rendered graph against visible claims. Run source trust-boundary tests and inspect built HTML for a single graph, canonical and noindex boundaries.
3. **Content:** integrate reusable answer-first, FAQ, author and reference components into actual pages. Preserve clear stale/abstain states and separate editorial dates from quote timestamps.
4. **Discovery:** build and inspect generated sitemap, RSS, robots, llms and agent metadata. Reciprocal mother discovery is deployed separately as described below; validate both owners rather than listing cross-domain URLs in one ordinary sitemap.
5. **Enterprise:** verify administrator dispatch, callback authentication, terminal job evidence, push enrollment and private-data isolation. Expensive training remains outside requests and Convex.
6. **Release:** run `npm run check`, `npm test`, `npm run build`, runtime checks and `npm run verify:deployment`. Run the compiled source/header/routing checks after build. HTTP static checks cannot replace authenticated APIs or interactive browser acceptance.
7. **External acceptance:** submit the sitemap using authorized Search Console access; validate schema externally; measure mobile Lighthouse/PageSpeed, LCP, CLS and INP; inspect actual AI referral/citation behavior. These actions are not proved by source presence.

For an existing checkout without the updated lockfile, the manifest additions are installed from `web` with the following exact command. Prefer `npm ci --legacy-peer-deps` when using this release's committed lockfile.

```powershell
# web/package.json dependency additions
npm install --legacy-peer-deps "@block65/webcrypto-web-push@^2.0.0" "bits-ui@^2.19.5" "clsx@^2.1.1" "tailwind-merge@^3.7.0" "tailwind-variants@^3.3.1" "@internationalized/date@^3.12.4"
```

Copyable checklist:

- [ ] Production robots and both llms resources return correct content.
- [ ] Sitemap and RSS parse and include only supported public routes.
- [ ] Public HTML contains canonical, description and JSON-LD before hydration.
- [ ] Private shells and authenticated responses have noindex/no-store where appropriate.
- [ ] Public graph and visible text agree on paper-only status.
- [ ] Social artwork returns a valid 1200×630 image.
- [ ] Required author attribution and editorial dates are visible.
- [ ] Workflow callback completes an actual job and rejects unauthorized requests.
- [ ] Push enrollment/removal and physical-device receipt pass.
- [ ] Mobile LCP <2.5 s, CLS <0.1 and INP <200 ms are measured.
- [ ] Authorized Search Console submission and schema validation are recorded.
- [ ] Sister directory relationships are distinguished from verified service health.

The mother discovery patch `6229f080f11a5c24eb62d0b583b088dede9088ff` was deployed from an isolated worktree, with unrelated source changes preserved. Production deployment `6a128632-89e9-4228-bbfb-a484750a0631` returned HTTP 200 for mother llms, extended llms, manifest, ecosystem sitemap index, robots and sitemap, with OmieBot in the relevant registry assets. Mother root and ecosystem HTML still returned their preexisting 404 responses, so server-rendered mother directory acceptance remains unavailable. Other sister health observations and response limitations are recorded in the ecosystem audit; no sister-wide certification is made.

## Section 7 — Bonus enhancements and honest operational limits

**Localization:** Paraglide and translated public pages are deferred until actual reviewed translations, locale URLs and publishing ownership exist. Adding hreflang for missing content would mislead crawlers. Protect credentials and private personal data from translation pipelines.

**Edge efficiency:** discovery output is built statically, protected data stays private, bulk artifacts remain in R2 and expensive fitting runs externally. KV is unnecessary for the current bounded static registry. Regenerate discovery when reviewed source content changes; do not rewrite editorial dates for every market tick.

**Authority clusters:** use home → paper → hive for trading literacy; home → research → timestamped evidence for model literacy; home → ecosystem → parent/founder for identity. The RSS feed announces editorial resources rather than pretending to be a live signal feed. Glossary pages should be added only with reviewed definitions and actual navigation.

**Entity identity:** maintain consistent public organization and author URLs. Wikipedia/Wikidata entries require independent notability and their own editorial rules; a schema deployment is not a Knowledge Panel qualification. Do not fabricate citations, awards or credentials.

**Original statistics:** publish only reproducible, dated evidence with sample size, fees, slippage, rejection criteria and paper/live distinctions. Existing failed or rejected candidates are valid evidence and must not be replaced by invented winning performance. Neither backtests nor simulated returns establish real investment ROI.

<!-- MANUAL STEP --> Real-money OKX order execution remains incomplete and disabled. The separate live account connection workspace is not authorization to claim active customer-money trading or live enforcement of every recorded limit.

## Quick Wins Checklist

- [x] Publish direct static crawl and AI-discovery resources without database scans.
- [x] Add canonical metadata and safe server-rendered JSON-LD with truthful paper boundaries.
- [x] Expose the exact E-WIN banner and reciprocal parent discovery relationship.
- [x] Add answer-first summaries, accessible feedback and reusable explanatory controls.
- [x] Keep costly training external and expose authenticated workflow evidence rather than optimistic success labels.

These are the highest-impact bounded improvements implemented in this release. Full browser/device, external indexing and live-money acceptance remain separate checks.
