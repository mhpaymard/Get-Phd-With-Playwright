// Lightweight URL parser/builder for FindAPhD filters based on observed patterns.
// No external dependencies.

const FAMILY_PREFIX = {
  discipline: /^10/i,
  subject: /^30/i,
  geo: /^g/i,
  funding: /^01/i,
};

function classifyToken(token) {
  if (FAMILY_PREFIX.discipline.test(token)) return { family: 'discipline', token };
  if (FAMILY_PREFIX.subject.test(token)) return { family: 'subject', token };
  if (FAMILY_PREFIX.geo.test(token)) return { family: 'geo', token };
  if (FAMILY_PREFIX.funding.test(token)) return { family: 'funding', token };
  return { family: 'unknown', token };
}

function parse(url) {
  const u = new URL(url);
  const result = {
    base: `${u.origin}${u.pathname}`,
    keywords: u.searchParams.get('Keywords') || undefined,
    page: u.searchParams.get('PG') ? Number(u.searchParams.get('PG')) : undefined,
    tokens: [],
    families: { discipline: [], subject: [], geo: [], funding: [], unknown: [] },
  };

  // Collect unnamed tokens: they appear as bare query segments like ?10M7g0&g0w900
  // URLSearchParams ignores those; reconstruct from raw query.
  const raw = u.search.replace(/^\?/, '');
  if (raw) {
    raw.split('&').forEach(pair => {
      if (!pair) return;
      if (pair.includes('=')) return; // named param
      const token = decodeURIComponent(pair);
      const cls = classifyToken(token);
      result.tokens.push(token);
      result.families[cls.family]?.push(token);
    });
  }

  return result;
}

function build({
  base = 'https://www.findaphd.com/phds/',
  pathSegments = [], // e.g., ['computer-science', 'united-kingdom']
  keywords,
  page,
  tokens = [], // array of raw tokens like '10M7g0', 'g0w900', '01M0'
} = {}) {
  const path = base.replace(/\/?$/, '/') + pathSegments.map(s => encodeURIComponent(String(s))).join('/') + (pathSegments.length ? '/' : '');
  const params = new URLSearchParams();
  if (keywords) params.set('Keywords', keywords);
  if (page && Number.isFinite(page)) params.set('PG', String(page));

  let query = params.toString();
  const bare = tokens.map(encodeURIComponent).join('&');
  if (bare && query) query = `${query}&${bare}`;
  else if (bare) query = bare;

  return query ? `${path}?${query}` : path;
}

module.exports = { parse, build, classifyToken };
