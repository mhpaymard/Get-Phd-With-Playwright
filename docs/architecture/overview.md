# معماری سیستم جستجوی FindAPhD (اجرای داخلی)

این سند مکمل `findaphd-search-spec.md` است و اجزای سیستم، جریان داده، و نحوهٔ توسعه/نگهداری را توضیح می‌دهد.

## اهداف کلیدی
- Latency پایین برای کوئری‌های تکراری (کش چندلایه)
- قابلیت توسعه (جداسازی Discovery / Crawling / Orchestration)
- پایداری در برابر تغییر ساختار HTML (Parser ماژولار + snapshot)
- رعایت نرخ مناسب درخواست (Rate Limiting)

## اجزا
- Search API / Orchestrator (ماژول `searchOrchestrator.js`)
- Queue (در حال حاضر ساده؛ در تولید Redis/RabbitMQ)
- Crawl Worker (`crawlWorker.js`)
- Token Dictionary (`core/dictionary.js`)
- Config (`core/config.js`)

## جریان کوئری
1. دریافت درخواست از کلاینت → ساخت کلید کش → تولید URL
2. اگر نتیجه موجود نبود → enqueue job
3. Worker صفحه را می‌گیرد، پروژه‌ها را استخراج می‌کند، ساختار استاندارد تولید می‌شود.
4. ذخیره و بازگشت به کلاینت (در MVP می‌توان polling ساده داشت).

## واژه‌نامه توکن‌ها
- JSON ذخیره می‌شود (`data/token-dictionary.json`)
- نسخه‌بندی با فیلد `version`

## توسعه بعدی
- افزودن کش Redis، نرخ محدود، Playwright برای Discovery، تست قرارداد Parser.

## تست
- تست‌های واحد در پوشه `tests/` (گسترش یابد برای orchestrator + worker mocking)

## کارایی و Rate Limiting
- L1 Cache: درون‌حافظه (Map با LRU) برای ۵ دقیقه.
- L2 Cache: Redis با TTL تطبیقی (محبوب ۱۵ دقیقه، long-tail ۵ دقیقه).
- Canonical Key: JSON({keywords, sortedTokens, page}).
- Request Budget: TokenBucket(global) + per-user counter.
- Backoff: تصاعدی با jitter برای 429/503.
- همگرایی درخواست‌ها: اگر همان کلید در حال پردازش است، Promise join.
- Dedupe Crawl: URL درون Set «inFlight». بعد از اتمام حذف.

متریک‌ها:
- cache_hit_ratio، avg_fetch_ms، p95_latency، in_flight_jobs، external_error_rate.

## امنیت و چندکاربره
- Auth: JWT (short-lived) + refresh یا کلیدهای API داخلی.
- Quota per user: جدول rate_usage + enforcement در gateway.
- Abuse Detection: الگوی کوئری با تعداد صفحه غیرعادی → throttle.
- Isolation: Job metadata شامل user_id برای ردیابی مصرف.
- Input Sanitization: محدودیت طول keywords، حذف کنترل کاراکترها.
- Observability Security: log ساختارمند (user_id, request_id, canonical_key).
- Least Privilege: Worker دسترسی فقط به queue + fetch؛ DB write از سرویس ingest.

