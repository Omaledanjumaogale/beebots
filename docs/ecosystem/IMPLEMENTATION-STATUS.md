# OmieBot ecosystem adoption ledger

17 October 2026. Objective: accessible autonomous trading with attributable decisions, controlled risk and evidence of actual outcomes. ROI is a measured result, never a promised effect of installing an agent.

## Implemented in this change

- Original offline fixed-candidate tournament in `research-engine/tournament.py`: purged chronological 60/20/20 partitions, validation selection under the highest cost stress, single selected final holdout, buy-and-hold comparison, abstention and immutable hashed artifacts. Inspired by research/execution workflow boundaries; no upstream engine code copied.
- Daily edge trainer rejects malformed, unordered, duplicated, gapped and unclosed five-minute bars. Long/cash evaluation now matches the current execution direction. Training prevalence replaces the arbitrary 0.25 probability baseline. Results explicitly remain development screens without execution approval.
- `/research` displays runtime training reports through a public server projection that excludes weights, datasets and service configuration. Terminal and Hive navigation link to it. Repository catalogue and evaluation workflow describe what is available versus reviewed.
- Source review of 18 screenshot references in EXECUTION-RESEARCH.md and AI-DATA-RESEARCH.md. Licenses and actual identities corrected before selecting dependencies.
- Actual REA 6.4.0 static analysis of the published CCXT 4.5.88 base-module subtree, with retained full evidence outside the product repository and a checked-in compact manifest. 60 files parsed, 112,304 AST nodes visited, zero parse failures. Application and semantic coverage are explicitly partial; resource limits prevent a complete call-graph claim. No exchange adapter or broker runtime verified by this analysis.

## Not established by this change

No market tournament run, profitable strategy, Laya weight fine-tuning, live customer funds, independent forward-paper acceptance, customer custody or live broker execution is established. No complete licensed training corpus was verified in the reviewed repos. Examples and fixtures are not promoted into market evidence. Existing recorded reports retain their original evaluation method; code changes do not rewrite historic evidence.

## Next integration boundaries

1. Acquire permitted instrument-specific data with exchange/provider terms recorded; keep all failed and successful trials. Training completion alone does not clear a release gate.
2. Trial one pinned CCXT adapter in a separate server process against actual read-only market and sandbox capabilities, checking precision, minimum size, rate limits and reconciliation before execution.
3. Freeze selected candidates and run forward paper with attribution, costs, stale-data abstention and risk caps. Require new untouched periods after looking at holdouts.
4. Choose one external execution engine for any expansion beyond the current runtime. LEAN/Nautilus, Python ML stacks and desktop terminals are separate compute deployments, not Cloudflare Worker imports.
5. Integrate structured research proposals and independent deterministic risk authorization before any broader agent authority. Retain broker and customer-funding acceptance boundaries.

REA skill applied: C:/Users/OMALE DANJUMA OGALE/.agents/skills/reverse-engineer-anything/SKILL.md. Source-repository review and packaged-artifact evidence are deliberately identified separately.
