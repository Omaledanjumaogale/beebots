import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const fail = message => { throw new Error(message); };
const manifest = JSON.parse(readFileSync('ewin.platform.json','utf8'));
if (manifest.version !== 1 || manifest.policyVersion !== 'naira-v3.1' ||
    manifest.moneyAuthority !== 'ewin-hub' || manifest.currency !== 'NGN' ||
    manifest.amountUnit !== 'kobo' || !/^[a-z0-9-]+$/.test(manifest.platformId)) fail('Invalid E-WIN contract.');
if (!/^[-A-Za-z0-9_]+\/[-A-Za-z0-9_.]+$/.test(manifest.repository)) fail('Invalid repository binding.');
if (manifest.sdk.path !== 'packages/ewin-wallet-sdk/index.ts') fail('Use the reviewed SDK path.');
const sdk = readFileSync(manifest.sdk.path);
if (createHash('sha256').update(sdk).digest('hex') !== manifest.sdk.sha256) fail('SDK content differs from the reviewed manifest.');
for (const source of manifest.legacyFinancialSources) {
  if (source.includes('..') || source.startsWith('/') || !existsSync(source)) fail('Update the legacy source inventory: ' + source);
}
for (const [name, module] of Object.entries(manifest.sharedModules)) {
  if (!['wallet','bounties','squads'].includes(name) ||
      module.url !== 'https://ewinproject.org/' + name || module.implementation !== 'hub') fail('Invalid shared module route.');
}
if (!['not_started','mapped','migrated','verified'].includes(manifest.rollout.status)) fail('Invalid rollout state.');
if (manifest.rollout.nativeCheckoutEnabled || manifest.rollout.status === 'verified') {
  if (manifest.rollout.status !== 'verified' || Object.values(manifest.migration).some(value => value !== true)) fail('Native cutover needs completed migration evidence.');
  if (manifest.legacyFinancialSources.length) fail('Parallel financial sources still require replacement or historical-only review.');
  if (!manifest.billableActions.length) fail('Register the native billable actions before activation.');
}
const actions = new Set();
for (const action of manifest.billableActions) {
  if (!/^[a-z_]+\.[a-z0-9_.-]+$/.test(action.actionKey) || actions.has(action.actionKey) ||
      !['feature','gig','bounty','squad'].includes(action.chargeModel)) fail('Invalid or duplicate billable action.');
  actions.add(action.actionKey);
}
console.log(manifest.platformId + ': E-WIN contract valid (' + manifest.rollout.status + ').');
