# E-WIN Hub integration contract - OmieBot Trading

This file is additive. It does not change the running application. It records the
contract this application must implement to share identity, wallet and the
opportunity graph with the central E-WIN Hub.

Hub: https://ewinproject.org
Convex HTTP actions: https://affable-dragon-883.eu-west-1.convex.site
Platform id: `omiebot`

## 1. Single sign-on (shared login)

Members sign up once on the central Hub. This application keeps its own login page,
but adds a **Sign in with E-WIN** button that starts the Hub flow:

1. Link to `https://ewinproject.org/api/sso/start?platform=omiebot&return=<this app callback URL>`.
2. The Hub requires an authenticated, approved member session, then redirects back with
   `?ewin_ticket=...&ewin_platform=omiebot`.
3. This application's server exchanges the ticket exactly once:

POST https://affable-dragon-883.eu-west-1.convex.site/sso/redeem
Content-Type: application/json

{ "version": 1, "platformId": "omiebot", "ticket": "<ewin_ticket>" }

Response: { "ok": true, "identity": { "subject", "email", "name", "handle", "referralCode", "platformId" } }

4. Find or create a local user keyed by `ewinUserId = identity.subject`, then create the
   normal local session. Never store the ticket, never redeem it twice, and never
   accept identity from the browser without this server-side exchange.

Rules:
- Tickets expire in 5 minutes and are bound to this platform id.
- A replay returns 401 with `ticket_used`.
- Do not share Hub session cookies or Better Auth tokens with this application.
- Keep the existing local login for users without a linked E-WIN account.

## 2. Wallet and fees (server-to-server only)

The Hub owns the ledger. This application never stores or computes balances.
Use `packages/ewin-wallet-sdk` from the Hub repository and a private
`EWIN_WALLET_KEY_OMIEBOT`. Every call carries an
idempotency key. Front-ends never call money endpoints directly.

- Quote and hold fees through the Hub; show the returned quote in the mandatory
  confirmation dialog before any charge.
- Platform fee: flat NGN 100 per billable action (catalog-controlled).
- Service user fee: priced per feature or by the client's gig budget.
- Release only on verified completion and approval; refund on verified cancellation.

## 3. Shared marketplace projection

If (and only if) this application already has a gig/service marketplace, it may display
the shared opportunity graph:

GET https://affable-dragon-883.eu-west-1.convex.site/marketplace/feed?platform=omiebot&limit=20

The response is public and read-only: open gigs, approved services and funded bounties
with `originPlatformId`. It contains no buyer email, NIN, bank details or ledger data.
Displaying an opportunity never copies money or balances into this app.
Bounties and squad opportunities are shared on every platform; do not build a
marketplace where this application does not already have one.

## 4. Commission harmonization (mandatory)

Inventory every commission, referral, affiliate, revenue-share and subscription rule.
Map each to the Hub model, replace local payout logic with Hub calls, and record the
result in `ewin.platform.json`. Local commission code must not run beside the Hub.

## 5. Security checklist

- Keep Hub service keys server-side only; never in a PUBLIC_ variable or the bundle.
- Verify webhooks by signature and re-query the Hub before granting value.
- Do not import cash balances, passwords, sessions, NIN, CVs or bank details.
- Add a health endpoint that reports configuration booleans, not secrets.
- Run this application's checks, lint, tests and build before merging.

## 6. Definition of done

- [ ] Sign in with E-WIN creates or links a local user via `ewinUserId`.
- [ ] Billable actions quote and confirm through the Hub.
- [ ] `ewin.platform.json` lists real actions, capabilities and status.
- [ ] Commission harmonization report attached to the integration PR.
- [ ] Native CI green; no secrets or member data in commits.
