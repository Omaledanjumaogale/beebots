import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import {adminTables} from './adminSchema';
import {investmentTables} from './investmentSchema';
export default defineSchema({ ...adminTables,...investmentTables,
  portfolios: defineTable({ owner: v.string(), cash: v.number(), killed: v.boolean(), createdAt: v.number() }).index('owner', ['owner']),
  bees: defineTable({ owner: v.string(), name: v.string(), strategy: v.string(), symbol: v.string(), active: v.boolean(), quantity: v.number(), lastDecision: v.optional(v.string()) }).index('owner', ['owner']).index('active', ['active']).index('active_symbol', ['active','symbol']),
  quotes: defineTable({ symbol: v.string(), bid: v.number(), ask: v.number(), sourceAt: v.number(), receivedAt: v.number(), source: v.string() }).index('symbol', ['symbol']),
  fills: defineTable({ owner: v.string(), beeId: v.id('bees'), key: v.string(), side: v.string(), quantity: v.number(), price: v.number(), fee: v.number(), cashDelta: v.number(), at: v.number(), quoteAt: v.number(), source: v.string() }).index('owner', ['owner']).index('key', ['key']),
  candidates: defineTable({ owner: v.string(), name: v.string(), artifactHash: v.string(), datasetHash: v.string(), state: v.string(), createdAt: v.number() }).index('owner', ['owner']),
  evidence: defineTable({ owner: v.string(), candidateId: v.id('candidates'), from: v.string(), to: v.string(), report: v.string(), at: v.number() }).index('candidate', ['candidateId']),
  evaluations: defineTable({ candidateId:v.id('candidates'), artifactHash:v.string(), datasetHash:v.string(), target:v.string(), report:v.string(), independentSamples:v.number(), durationDays:v.number(), passed:v.boolean(), evaluator:v.string(), recordedAt:v.number() }).index('candidate_target',['candidateId','target']),
  evaluationUses: defineTable({ evaluationId:v.id('evaluations'), candidateId:v.id('candidates'), at:v.number() }).index('evaluation',['evaluationId']),
});
