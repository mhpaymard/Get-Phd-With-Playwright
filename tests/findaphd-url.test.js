const assert = (cond, msg) => { if (!cond) { throw new Error(msg); } };
const { parse, build, classifyToken } = require('../src/findaphd/url');
const { prepare } = require('../src/services/searchOrchestrator');

console.log('Test: classifyToken families');
assert(classifyToken('10M7g0').family === 'discipline', 'discipline token');
assert(classifyToken('30M7g2t1').family === 'subject', 'subject token');
assert(classifyToken('g0w900').family === 'geo', 'geo token');
assert(classifyToken('01M0').family === 'funding', 'funding token');

console.log('Test: parse keyword + funding bare token');
{
  const u = 'https://www.findaphd.com/phds/?01M0&Keywords=machine%20learning';
  const p = parse(u);
  assert(p.keywords === 'machine learning', 'keywords parsed');
  assert(p.families.funding.includes('01M0'), 'funding token parsed');
}

console.log('Test: parse discipline + geo + page');
{
  const u = 'https://www.findaphd.com/phds/computer-science/united-kingdom/?10M7g0&g0w900&PG=3';
  const p = parse(u);
  assert(p.page === 3, 'page parsed');
  assert(p.families.discipline.includes('10M7g0'), 'discipline token parsed');
  assert(p.families.geo.includes('g0w900'), 'geo token parsed');
}

console.log('Test: build URL');
{
  const url = build({
    base: 'https://www.findaphd.com/phds/',
    pathSegments: ['computer-science', 'united-kingdom'],
    keywords: 'machine learning',
    page: 2,
    tokens: ['10M7g0', 'g0w900']
  });
  // Order of params not guaranteed; check essential pieces
  assert(url.startsWith('https://www.findaphd.com/phds/computer-science/united-kingdom/'), 'path ok');
  const parsed = parse(url);
  assert(parsed.keywords === 'machine learning', 'keywords ok');
  assert(url.includes('PG=2'), 'page ok');
  assert(url.includes('10M7g0'), 'discipline token ok');
  assert(url.includes('g0w900'), 'geo token ok');
}

console.log('All tests passed.');

console.log('Test: orchestrator prepare with structured filters');
{
  const prep = prepare({ keywords: 'ai', filters: { disciplineToken: '10M7g0', geoTokens: ['g0w900'] }, page: 1 });
  assert(prep.url.includes('Keywords=ai'), 'orchestrator keywords');
  assert(prep.url.includes('10M7g0'), 'orchestrator discipline token');
  assert(prep.url.includes('g0w900'), 'orchestrator geo token');
}

console.log('Integration tests done.');
