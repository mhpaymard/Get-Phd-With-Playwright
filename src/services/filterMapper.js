// Maps structured filter input to raw FindAPhD tokens using dictionary state.
const { getState } = require('../core/dictionary');

function mapFilters(filters = {}) {
  getState(); // reserved (future use for id → token mapping)
  const tokens = new Set();
  if (filters.disciplineToken) tokens.add(filters.disciplineToken);
  if (filters.subjectToken) tokens.add(filters.subjectToken);
  if (Array.isArray(filters.geoTokens)) filters.geoTokens.forEach(t => tokens.add(t));
  if (Array.isArray(filters.fundingTokens)) filters.fundingTokens.forEach(t => tokens.add(t));
  if (filters.institutionToken) tokens.add(filters.institutionToken);
  if (filters.phdTypeToken) tokens.add(filters.phdTypeToken);
  if (filters.studyModeToken) tokens.add(filters.studyModeToken);

  const warnings = [];
  const disciplineCount = [...tokens].filter(t => /^10/i.test(t)).length;
  if (disciplineCount > 1) warnings.push('Multiple discipline tokens detected');
  return { tokens: [...new Set(tokens)], warnings };
}

module.exports = { mapFilters };