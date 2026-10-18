# Administrator workflow acceptance

The operations dispatcher runs retained-data training and deployment verification in GitHub Actions. Convex stores only bounded job metadata, authorization and scheduling information. No training occurs in a web request or Convex action.

## Verified registration

- Default-branch registration commit: `8e68162bbd60d61431d88be94061466d180b3037`.
- Only `.github/workflows/omiebot-operations.yml` was added to `main`; other main-branch files were preserved.
- GitHub workflow ID: `387920832`, state `active`.
- An authenticated production `workflows:list` query succeeded.
- Unauthenticated production POST to the Convex `/operations/callback` endpoint returned HTTP 401.

## Execution acceptance

Verified on 18 October 2026: authenticated training created job md7et24ka34gygn8375ddrb3sx8ghc7d. An immediate repeated start returned the same ID with existing=true. [GitHub run 39161372546](https://github.com/Omaledanjumaogale/beebots/actions/runs/39161372546) completed successfully; production Convex recorded succeeded and All requested stages completed. This verifies dispatch, runner execution and callback completion. It does not qualify a trading model or prove physical push receipt.

Execution is checked by starting one training job through the production admin-guarded Convex mutation, observing its GitHub run, and reading the final callback state. Successful job orchestration does not establish model profitability, independent model performance or approval for live execution. Retained-data training reports remain shadow evidence.

Sanitized operator evidence is saved outside the repository in `research/workflow-registration.json` and `research/workflow-acceptance.json` under the parent workspace. Credentials and signed JWTs are never written to these reports.

## Runtime safeguards

- Only verified configured administrators may start or list their jobs.
- A repeated start returns the active job instead of queuing another.
- The daily start limit is ten per administrator.
- A job runs training, verification, or training followed by verification.
- External callbacks require a shared bearer secret and a valid existing job ID.
- Terminal callbacks are idempotent; late messages cannot overwrite completed evidence.
- A twenty-minute timeout marks jobs lacking completion evidence as failed and instructs the operator to inspect GitHub before retrying.

## Configuration

Convex requires `GITHUB_WORKFLOW_TOKEN` and `WORKFLOW_CALLBACK_SECRET`. GitHub Actions requires matching `OMIE_WORKFLOW_CALLBACK_SECRET`, the deployment's `OMIE_CONVEX_SITE_URL`, and the existing R2 credentials. The GitHub dispatch target and source ref are fixed in code. Secrets must be configured through secure provider tools, never pasted into an issue or committed file.
