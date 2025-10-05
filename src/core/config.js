// Central configuration with sensible defaults and env overrides.
module.exports = {
  userAgent: process.env.FAPHD_UA || 'GetPhDBot/0.1 (+contact: you@example.com)',
  baseUrl: 'https://www.findaphd.com/phds/',
  request: {
    timeoutMs: Number(process.env.FAPHD_TIMEOUT_MS || 15000)
  },
  rateLimit: {
    maxRPS: Number(process.env.FAPHD_MAX_RPS || 1),
    burst: Number(process.env.FAPHD_BURST || 2)
  },
  cache: {
    ttlSeconds: Number(process.env.FAPHD_CACHE_TTL || 900)
  },
  discovery: {
    scheduleCron: process.env.FAPHD_DISCOVERY_CRON || '0 3 * * *' // daily 03:00
  }
};
