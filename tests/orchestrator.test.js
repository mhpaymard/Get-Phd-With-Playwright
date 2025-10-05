const { prepare } = require('../src/services/searchOrchestrator');

console.log('Test: orchestrator prepare with structured filters');
{
  const r = prepare({ keywords: 'test', filters: { disciplineToken: '10M7g0', geoTokens: ['g0w900'] }, page: 2 });
  if (!r.url.includes('PG=2')) throw new Error('Missing page param');
  if (!r.url.includes('10M7g0')) throw new Error('Discipline token missing');
  if (!r.url.includes('g0w900')) throw new Error('Geo token missing');
}
console.log('Integration tests done.');
