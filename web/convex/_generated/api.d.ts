/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminSchema from "../adminSchema.js";
import type * as crons from "../crons.js";
import type * as hive from "../hive.js";
import type * as investmentMath from "../investmentMath.js";
import type * as investmentSchema from "../investmentSchema.js";
import type * as investments from "../investments.js";
import type * as market from "../market.js";
import type * as risk from "../risk.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminSchema: typeof adminSchema;
  crons: typeof crons;
  hive: typeof hive;
  investmentMath: typeof investmentMath;
  investmentSchema: typeof investmentSchema;
  investments: typeof investments;
  market: typeof market;
  risk: typeof risk;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
