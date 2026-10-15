import { cronJobs, makeFunctionReference } from 'convex/server';
const crons = cronJobs();
if(process.env.ENABLE_CONVEX_MARKET_POLL==='true')crons.interval('paper-market-cycle', { minutes: 1 }, makeFunctionReference<'action'>('market:poll'));
export default crons;
