# API Usage (Internal Module Layer)

## TOC
1. prepare
2. canonicalKey
3. buildSearchUrl
4. parse
5. Error Handling
6. Future Endpoints
7. Versioning

Related docs: `../README.md` | `filters-reference.md` | `findaphd-search-spec.md`.

## prepare(request)
Input:
```js
{
  keywords?: string,
  filters?: {
    discipline?: string,
    subject?: string|string[],
    geography?: string|string[],
    funding?: string|string[]
  },
  tokens?: string[], // اگر tokens داده شود filters نادیده گرفته می‌شود
  page?: number
}
```
Output:
```js
{
  url: string,
  key: string,      // canonical json key
  tokens: string[],
  warnings: string[]
}
```
Notes:
- اگر همزمان filters و tokens وجود داشته باشد، tokens اولویت دارد.
- warnings شامل مشکلات بالقوه (مانند چند discipline) است.

Example:
```js
const { prepare } = require('../src/services/searchOrchestrator');
const r = prepare({
  keywords: 'ai ethics',
  filters: { discipline: 'Computer Science', geography: 'United Kingdom' },
  page: 2
});
// r.url => https://www.findaphd.com/phds/?Keywords=ai+ethics&PG=2&gXXXX&10YYYY
```

## canonicalKey(request)
Deterministic key برای cache و dedupe.

## buildSearchUrl(parts)
ساخت مستقیم URL از اجزای خام (معمولاً داخل prepare استفاده می‌شود).

## parse(url)
خروجی:
```js
{ base, keywords, page, tokens: string[] }
```

## Error Handling Philosophy
- prepare هیچ exception پرتاب نمی‌کند مگر ورودی غیرقابل پردازش.
- mapping مشکلات را در warnings برمی‌گرداند.

## Future Endpoints (Planned HTTP Layer)
- POST /search/prepare (wrap prepare)
- POST /search/queue (enqueue job + returns job id)
- GET /jobs/:id (status)
- GET /projects/:id (enriched data)

## Versioning Strategy
هنگام تغییر رفتار mapping یا token dictionary: افزایش internal dictionary version و اضافه به canonicalKey.
