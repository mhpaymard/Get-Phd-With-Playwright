const { mapFilters } = require('../src/services/filterMapper');

console.log('Test: map basic filters to tokens');
{
  const r = mapFilters({ disciplineToken: '10M7g0', geoTokens: ['g0w900'], fundingTokens: ['01M0'] });
  if (r.tokens.length !== 3) throw new Error('Expected 3 tokens');
  if (r.warnings.length) throw new Error('Did not expect warnings');
}

console.log('Test: multi discipline warning (using two discipline-like tokens)');
{
  const r = mapFilters({ disciplineToken: '10AAA', subjectToken: '10BBB' });
  if (!r.warnings.length) throw new Error('Expected warning');
}

console.log('All filter-mapper tests passed.');
