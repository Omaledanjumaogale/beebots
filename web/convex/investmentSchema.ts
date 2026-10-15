import {defineTable} from 'convex/server';
import {v} from 'convex/values';
export const investmentTables={
 investorWallets:defineTable({owner:v.string(),cashCents:v.number(),testCreditClaimed:v.boolean(),createdAt:v.number()}).index('owner',['owner']),
 investmentPositions:defineTable({owner:v.string(),plan:v.string(),funding:v.string(),principalCents:v.number(),valueCents:v.number(),status:v.string(),consentVersion:v.string(),createdAt:v.number()}).index('owner',['owner']),
 investmentWithdrawals:defineTable({owner:v.string(),positionId:v.id('investmentPositions'),grossCents:v.number(),feeCents:v.number(),netCents:v.number(),status:v.string(),earliest:v.string(),targetLatest:v.string(),requestedAt:v.number()}).index('owner',['owner']),
 investmentJournal:defineTable({owner:v.string(),type:v.string(),cashDeltaCents:v.number(),reference:v.string(),at:v.number()}).index('owner',['owner']),
};
