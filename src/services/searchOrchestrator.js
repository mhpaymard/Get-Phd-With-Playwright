// Orchestrates building URLs and queueing crawl jobs.
const { build, parse } = require('../findaphd/url');
const { mapFilters } = require('./filterMapper');

function canonicalKey(req) {
  const { keywords, tokens = [], page = 1 } = req;
  const sorted = [...tokens].sort();
  return JSON.stringify({ k: keywords || '', t: sorted, p: page });
}

function buildSearchUrl(request) {
  return build({
    base: 'https://www.findaphd.com/phds/',
    pathSegments: request.pathSegments || [],
    keywords: request.keywords,
    page: request.page,
    tokens: request.tokens || []
  });
}

function prepare(request) {
  if (request.filters && !request.tokens) {
    const mapped = mapFilters(request.filters);
    request.tokens = mapped.tokens;
    request._warnings = mapped.warnings;
  }
  const url = buildSearchUrl(request);
  return { url, key: canonicalKey(request), tokens: request.tokens || [], warnings: request._warnings || [] };
}

module.exports = { prepare, buildSearchUrl, canonicalKey, parse };
