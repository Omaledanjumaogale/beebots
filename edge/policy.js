export const PROVIDERS = {
  okx: { minute: 6, day: 3000, endpoints: ['candles','ticker','tickers'], base: 'https://www.okx.com/api/v5/market/' },
  twelvedata: { key: 'TWELVEDATA_API_KEY', minute: 8, day: 800, endpoints: ['price', 'time_series'], base: 'https://api.twelvedata.com/' },
  alphavantage: { key: 'ALPHAVANTAGE_API_KEY', minute: 1, day: 25, endpoints: ['TIME_SERIES_DAILY'], base: 'https://www.alphavantage.co/query' },
  finnhub: { key: 'FINNHUB_API_KEY', minute: 0, day: 0, endpoints: ['quote'], base: 'https://finnhub.io/api/v1/' },
  massive: { key: 'MASSIVE_API_KEY', minute: 0, day: 0, endpoints: ['previous'], base: 'https://api.massive.com/' },
  marketstack: { key: 'MARKETSTACK_API_KEY', minute: 1, month: 100, endpoints: ['eod'], base: 'https://api.marketstack.com/v2/' },
  fmp: { key: 'FINANCIALMODELINGPREP_API_KEY', minute: 1, day: 250, bytes30d: 512000000, endpoints: ['quote', 'historical-price-eod/full'], base: 'https://financialmodelingprep.com/stable/' },
  agnes: { key: 'AGNES_AI_KEY', minute: 0, day: 0, endpoints: [], base: 'https://apihub.agnes-ai.com/v1/' },
  workersai: { key: 'WORKERS_AI_TOKEN', minute: 0, day: 0, endpoints: [], base: 'https://api.cloudflare.com/client/v4/' }
};
export const BEE_NAMES = ['Drift', 'Rebound', 'Breaker', 'Compass', 'Volta', 'Carry', 'Pulse', 'Surface', 'Macro', 'Newswire', 'Scout', 'Archivist', 'Sentinel', 'Candle', 'Calibrator', 'Weaver', 'Auditor', 'Guardian', 'Pilot', 'Beekeeper'];
export const bees = () => BEE_NAMES.map((name,i) => ({ id:name.toLowerCase(), name:`${name} Bee`, executable:i<3, status:i<3?'paper-ready':'research', model:i<3?'baseline-v1':'untrained', enabled:false }));
export function marketOpen(assetClass, now = new Date()) {
  if (assetClass === 'crypto') return true;
  if (assetClass !== 'forex') return false;
  const d=now.getUTCDay(), h=now.getUTCHours();
  // Conservatively exclude Sunday and Friday rollover; venue holidays still require adapter checks.
  return d>=1 && d<=5 && !(d===5 && h>=20);
}
export function buckets(now = Date.now()) {
  const iso=new Date(now).toISOString();
  return {minute:iso.slice(0,16), day:iso.slice(0,10), month:iso.slice(0,7)};
}
export function validateMarket(provider, endpoint, symbol) {
  return !!PROVIDERS[provider]?.endpoints.includes(endpoint) && /^[A-Z0-9./:_-]{1,24}$/.test(symbol || '');
}
