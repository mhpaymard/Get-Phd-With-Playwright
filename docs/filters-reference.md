# Filters Reference (Summary)

Related: `api.md` | `findaphd-search-spec.md` | `../README.md`

## TOC
1. Table
2. Mapping Process
3. Examples
4. Warnings
5. Future Enhancements
6. Edge Cases
7. Integration Points

Structured filter keys → token families used in FindAPhD listing URLs.
See full exploration: `docs/findaphd-search-spec.md`.

| Structured Key | Description | Token Family / Pattern | Example Value | Notes |
|----------------|-------------|------------------------|---------------|-------|
| discipline | Broad academic area | 10* | Computer Science | One allowed ideally |
| subject | Narrow subject(s) | 30* | Artificial Intelligence | Multiple allowed |
| geography | Country / region | g* | United Kingdom | Multi-valued |
| funding | Funding category | 01* | Competition Funded Project | Multi-valued |
| keywords | Free text | query param Keywords | machine learning | URL-encoded + => space |
| page | Pagination index (1-based) | PG= | 2 | Omit if 1 |

## Mapping Process (Current)
`filterMapper` performs naive string normalization & placeholder matching.
Future discovery worker will populate canonical dictionary with (name -> token) pairs.

## Examples
### Single Discipline + Keyword
Input:
```js
{ keywords: 'quantum', filters: { discipline: 'Physics' } }
```
Output tokens (sample placeholder): `["10PHYS"]`
URL (shape): `...?Keywords=quantum&10PHYS`

### Subject + Geography + Funding
```js
{
  filters: {
    subject: ['Data Science'],
    geography: ['United Kingdom','Germany'],
    funding: ['Competition Funded Project']
  }
}
```
Tokens sample: `["30DATASCI","gUK","gDE","0101CFP"]`

### Mixed Discipline & Subject Warning
When both discipline and a subject from a different area appear mapping may add warning:
```
warnings: ["Multiple discipline-like tokens detected"]
```

## Warnings Catalog
- `Multiple discipline-like tokens detected`: بیش از یک توکن خانواده 10* شناسایی شده.
- (Reserved) `Unknown filter value`: زمانی که dictionary واقعی اضافه شود.

## Future Enhancements
- فازی‌سازی ورودی کاربر (Levenshtein) برای subject.
- پشتیبانی institution، studyMode، phdType پس از discovery.
- Version tagging: افزودن dictionaryVersion در canonical key.

## Edge Cases
- Keywords length > 200: باید truncate (هنوز پیاده نشده).
- Empty filter arrays: نادیده گرفته می‌شود.
- Duplicate structured values: dedupe قبل از map.

## Integration Points
- Used by `prepare()` در `searchOrchestrator`.
- Tokens passed to URL builder (`build`).

---
Short reference keeps runtime mapping logic شفاف؛ برای جزئیات به spec کامل مراجعه کنید.
