import { cronJobs } from 'convex/server';
// Market ingestion runs in the Cloudflare Worker; never schedule it in Convex.
export default cronJobs();
