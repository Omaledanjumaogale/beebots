# OmieBot managed-investment structure — DRAFT FOR PROFESSIONAL REVIEW

Confirmed16October2026: Nigeria-based operator; adult18+ users; intended worldwide reach subject to approved country list;10% withdrawal deduction on principal; non-guaranteed ROI targets; distributions only from realized net profit.

## Launch boundary

The deployed investor workspace is a simulation, not a public investment solicitation. No deposit, escrow, live pooling, automated matching or payout connector exists. Numeric ROI targets remain unset until substantiated forward results and approved disclosures exist. No assertion of SEC registration or custody authorization is made.

## Proposed legal/commercial terms

Operator: legal entity, registered address and SEC status TO BE VERIFIED. Investor: verified adult identity, country residency, tax residence and permitted investor category. Country eligibility is deny-by-default for live funding until local solicitation and product permissions are reviewed. Screening must include KYC, AML, sanctions and source-of-funds controls; agent confidence cannot substitute for these checks.

Mandate: specify supported venues, assets, leverage restrictions, maximum drawdown, concentration and liquidity limits. Automated bots may abstain. Model or venue failure, gaps, slippage, insolvency and complete loss remain possible. No daily income, principal protection or guaranteed ROI. Marketing must not suggest an assured income source for vulnerable users or students.

Custody: independent custodian/trustee and segregated client accounts must be identified. Idle escrow balances and capital transferred to permitted trading custody must reconcile separately. An escrow label cannot make actively traded assets risk-free. No withdrawal-capable API credentials belong to model agents. Trading authority and money-movement authority must be separate, with human approval and beneficiary verification.

Participation: individual segregated account, opt-in squad or legally constituted pool. Pool entry/exit should use independently reconciled NAV and participatory units, currency/FX rules and fee equalization. Pro-rata profits AND losses apply to units held during the relevant economic period. Deposits after a gain cannot claim prior gains; withdrawals cannot shift losses to remaining investors. Do not distribute deposits as profits. Matching can suggest compatible opt-in groups but cannot enroll or transfer funds without explicit consent and legal eligibility.

Fee:10% of principal actually redeemed at withdrawal, excluding gains, deducted once per redeemed portion. Deposit itself has no10% deduction. Proposed loss allocation basis: redeemable principal=min(original unredeemed principal, current redemption value). Thus1000principal+100profit gives100fee and1000net;500value after losses gives50fee and450net. Partial redemptions, loss recovery, taxes, rounding and whether this fee is permitted must be finalized in the live documents. No second fee on the same principal.

Redemption: request, liquidity reservation, close/reduce exposure, reconcile venue settlement, NAV confirmation, fee calculation, independent approval, custodian payout and bank confirmation.3–7working days is a service target following a complete eligible request, not a guarantee. Relevant holidays, cutoff timezone, gates, suspensions, failed bank transfers and insolvency must be specified. Partial or zero redemption is possible after losses. Never promise return of original principal independently of account value.

Distribution: reconcile realized trading profits after transaction costs, losses, accrued liabilities and approved expenses. Unit allocation and exact minor-unit rounding conserve the total. An independent accounting ledger must journal both sides of every movement and reconcile custody/broker/bank balances. The current simulation is not a live double-entry general ledger. Proposed profit-sharing percentages require explicit plan approval; no unconfirmed platform performance fee is assumed.

Agreement package: client mandate, risk disclosure, fee schedule, custody/trust documentation, pool deed where applicable, execution policy, complaints process, privacy/international transfer notice, tax reporting rules, business continuity and insolvency treatment, governing law and dispute resolution. Counsel must verify enforceability and any mandatory consumer rights. Liability wording cannot waive fraud, statutory duties or rights that law protects. Record signed version, document hash, user identity, timestamp and complete audit evidence; a checkbox alone is not legal approval of the business.

## Technical delivery

/invest is an authenticated private simulated dashboard with one-time10000USD test credits, bounded allocations, interest-only squad/pool selection, simulated withdrawal requests, indicative business-day dates, fee preview, cancellation and journal. Convex enforces ownership and atomic balances. Real funding is hard-disabled. The simulator never creates fictitious realized trading profit or settles an imaginary payout.

## Sources

Nigeria SEC public notice8May2026: https://sec.gov.ng/for-investors/keep-track-of-circulars/public-notice-unregistered-online-investment-schemes/
ISA2025 collective investment sections150–152: https://home.sec.gov.ng/documents/1326/INVESTMENT-AND-SECURITIES-ACT-NIGERIA-2025_1.pdf
Laya runtime: https://github.com/receptron/laya
Laya model limitations: https://huggingface.co/convaiinnovations/laya

## Product terminology update —16October2026

Trading Pool: multiple participants combine trading capital, sharing realized net profit and losses according to eligible participatory stake. Trading Squad: two or more participants agree a term and recurring distribution interval. Single-Folder Trading: separately accounted individual capital. Users may organize their own group, opt into platform suggestions or request pairing. No matching may enroll participants or allocate money without each participant approving the group mandate.

The simulation persists optional pairing preference, proposed30/60/90day term and7/14/30day distribution cadence. These do not create a real group, enforce a live lock, guarantee distributions or authorize managed trading. Existing records retain their internal individual/squad/pool IDs. Legal classification depends on actual activity rather than branding.
