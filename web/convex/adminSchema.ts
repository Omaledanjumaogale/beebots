import { defineTable } from 'convex/server';
import {v} from 'convex/values';
export const adminTables = {
 users:defineTable({subject:v.string(),email:v.string(),name:v.string(),status:v.string(),createdAt:v.number(),updatedAt:v.number()}).index('email',['email']).index('subject',['subject']),
 applications:defineTable({name:v.string(),email:v.string(),type:v.string(),status:v.string(),notes:v.string(),createdAt:v.number(),updatedAt:v.number()}).index('status',['status']),
 referrals:defineTable({code:v.string(),email:v.string(),referredBy:v.string(),status:v.string(),createdAt:v.number(),updatedAt:v.number()}).index('code',['code']),
 financial:defineTable({reference:v.string(),type:v.string(),amount:v.number(),currency:v.string(),status:v.string(),notes:v.string(),createdAt:v.number(),updatedAt:v.number()}).index('reference',['reference']),
 settings:defineTable({key:v.string(),value:v.string(),description:v.string(),createdAt:v.number(),updatedAt:v.number()}).index('key',['key']),
 adminAudit:defineTable({actor:v.string(),action:v.string(),section:v.string(),recordId:v.string(),at:v.number()}).index('at',['at'])
};
