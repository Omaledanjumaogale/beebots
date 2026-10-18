import { internalActionGeneric as action, internalMutationGeneric as mutation } from 'convex/server';
import {v} from 'convex/values';
// Compatibility endpoints fail closed without reading or writing trading data.
export const poll=action({args:{},handler:async()=>({status:'retired',workspace:'/paper'})});
export const tick=mutation({args:{symbol:v.string(),bid:v.number(),ask:v.number(),sourceAt:v.number()},handler:async()=>({status:'retired',workspace:'/paper'})});
