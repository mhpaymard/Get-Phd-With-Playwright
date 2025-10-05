# Contributing Guide

## Branching
- feature/<short-name>
- fix/<short-name>

## Commit Style
Imperative, short, English preferred (mixed OK):
```
feat: add discovery worker skeleton
fix: handle 403 in integration test
```

## Workflow
1. Fork / Branch
2. Implement change
3. Add / update tests
4. Run `npm test`
5. Update docs if behavior changes
6. Open PR (template TBD)

## Tests Required
- New token family: add unit test in `tests/filter-mapper.test.js`
- URL behavior change: update `tests/findaphd-url.test.js`
- Workflow path: consider integration test

## Code Style
- Node core first; no deps مگر نیاز واضح
- Small functions, pure where possible
- Avoid silent failures; return warnings array

## Performance Considerations
- Avoid synchronous large I/O
- Batch future network fetches (design doc references)

## Adding Filters
1. Update `filterMapper`
2. Update `filters-reference.md`
3. Add mapping test

## Documentation
- Persian+English dual segments allowed
- Keep high-level docs in `docs/architecture`

## Versioning (Future)
- Semantic versioning once public API exposed

## Security
- Never commit secrets
- Use placeholders in examples

## Reporting Issues
Provide: reproduction steps, expected, actual, logs (short), environment.

## License
Pending (add before public release)
