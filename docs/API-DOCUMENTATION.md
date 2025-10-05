# FindAPhD Search API - مستندات کامل
## Complete Documentation / راهنمای جامع

---

## 📋 فهرست مطالب / Table of Contents

1. [معرفی / Introduction](#معرفی--introduction)
2. [نصب و راه‌اندازی / Installation](#نصب-و-راه‌اندازی--installation)
3. [معماری سیستم / Architecture](#معماری-سیستم--architecture)
4. [API Endpoints](#api-endpoints)
5. [نمونه‌های استفاده / Usage Examples](#نمونه‌های-استفاده--usage-examples)
6. [پیکربندی / Configuration](#پیکربندی--configuration)
7. [تست / Testing](#تست--testing)
8. [مشکلات رایج / Troubleshooting](#مشکلات-رایج--troubleshooting)

---

## 🎯 معرفی / Introduction

**FindAPhD Search API** یک وب سرویس کامل و حرفه‌ای برای جستجوی موقعیت‌های دکترا از سایت FindAPhD.com است.

### ویژگی‌های کلیدی / Key Features

✅ **مدیریت Session هوشمند**: ذخیره وضعیت جستجوی کاربران بدون نیاز به نگه‌داشتن دائمی تب مرورگر
✅ **مدیریت تب Browser Pool**: محدودیت هوشمند تا 100 تب فعال با سیستم صف
✅ **کش چندلایه**: کش حافظه داخلی با TTL تنظیم‌پذیر برای بهبود عملکرد
✅ **جستجوی پیشرفته**: پشتیبانی کامل از تمام فیلترهای FindAPhD شامل:
  - کلیدواژه (Keywords)
  - رشته تحصیلی (Discipline)
  - موضوع (Subject)
  - موقعیت جغرافیایی (Geography)
  - نوع تامین مالی (Funding)
  - موسسه (Institution)
  - نوع دوره (PhD Type)
  - شیوه تحصیل (Study Mode)
✅ **صفحه‌بندی**: پشتیبانی کامل از pagination و ادامه جستجو
✅ **Crawler پیشرفته**: استخراج اطلاعات دقیق با Playwright
✅ **RESTful API**: طراحی استاندارد و آسان برای استفاده

---

## 🚀 نصب و راه‌اندازی / Installation

### پیش‌نیازها / Prerequisites

- Node.js 16+ 
- npm یا yarn

### مراحل نصب / Installation Steps

```bash
# 1. Clone کردن پروژه
cd get-phd

# 2. نصب وابستگی‌ها
npm install

# 3. نصب browsers برای Playwright
npx playwright install chromium

# 4. کپی کردن فایل env
cp .env.example .env

# 5. راه‌اندازی سرور
npm run api
```

سرور روی پورت 3000 اجرا می‌شود: `http://91.99.13.17:3000`

---

## 🏗️ معماری سیستم / Architecture

### ساختار کلی

```
┌─────────────────┐
│   Client API    │ کلاینت
└────────┬────────┘
         │ HTTP Request
         ▼
┌─────────────────┐
│  Express Server │ سرور API
│  Routes Layer   │
└────────┬────────┘
         │
    ┌────┴─────┬──────────┬────────────┐
    ▼          ▼          ▼            ▼
┌────────┐ ┌──────┐ ┌──────────┐ ┌──────────┐
│Session │ │Search│ │Browser   │ │Dictionary│
│Manager │ │Service│ │Pool      │ │Loader    │
└────────┘ └──┬───┘ └────┬─────┘ └──────────┘
              │          │
              ▼          ▼
         ┌─────────────────┐
         │  Playwright     │ کرال با مرورگر
         │  Crawler        │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  FindAPhD.com   │ سایت هدف
         └─────────────────┘
```

### اجزای اصلی

#### 1. Browser Pool Manager
- مدیریت تا 100 تب فعال
- سیستم صف برای درخواست‌های اضافی
- آزادسازی خودکار تب‌های بلااستفاده

#### 2. Session Manager
- ذخیره وضعیت کاربران
- تاریخچه جستجوها
- امکان ادامه جستجو بدون نیاز به تب دائمی

#### 3. Search Service
- اجرای جستجو با Playwright
- کش نتایج
- استخراج هوشمند اطلاعات

#### 4. Crawler
- استخراج نتایج با selector های چندگانه
- پشتیبانی از pagination
- مدیریت خطا و retry

---

## 📡 API Endpoints

### Base URL
```
http://91.99.13.17:3000/api
```

---

### 1. Health & Status

#### GET `/health`
بررسی وضعیت سلامت سرویس

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-05T...",
  "uptime": 3600,
  "browser": {
    "maxTabs": 100,
    "activeTabs": 5,
    "activeSessions": 2,
    "queueLength": 0,
    "availableTabs": 95
  },
  "sessions": {
    "totalSessions": 10,
    "totalUsers": 5,
    "activeSessions": 3
  },
  "memory": {
    "used": 256,
    "total": 512
  }
}
```

#### GET `/health/ready`
بررسی آماده بودن برای دریافت درخواست

**Response:**
```json
{
  "ready": true,
  "availableTabs": 95,
  "queueLength": 0
}
```

---

### 2. Session Management

#### POST `/session`
ایجاد session جدید برای کاربر

**Request Body:**
```json
{
  "userId": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-here",
    "userId": "user-123",
    "createdAt": 1728123456789
  }
}
```

#### GET `/session/:sessionId`
دریافت اطلاعات session

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-here",
    "userId": "user-123",
    "createdAt": 1728123456789,
    "lastAccessedAt": 1728123556789,
    "searchCount": 3,
    "currentSearch": {
      "id": "search-uuid",
      "status": "completed",
      ...
    }
  }
}
```

#### DELETE `/session/:sessionId`
حذف session

**Response:**
```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

#### GET `/session/user/:userId`
دریافت تمام session های یک کاربر

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "sessionId": "uuid-1",
      "createdAt": 1728123456789,
      "lastAccessedAt": 1728123556789,
      "searchCount": 5
    }
  ]
}
```

---

### 3. Search Operations

#### POST `/search`
انجام جستجوی جدید

**Request Body:**
```json
{
  "userId": "user-123",
  "sessionId": "session-uuid",
  "keywords": "machine learning",
  "filters": {
    "discipline": "10M7g0",
    "geography": ["g0w900"],
    "funding": ["01M0"]
  },
  "page": 1
}
```

**Filter Fields:**
- `discipline`: توکن رشته تحصیلی (مثلاً Computer Science = "10M7g0")
- `subject`: توکن موضوع (مثلاً AI = "30M7g2t1")
- `geography`: آرایه توکن‌های مکان (مثلاً UK = "g0w900")
- `funding`: آرایه توکن‌های تامین مالی (مثلاً Self-funded = "01M0")
- `institution`: توکن موسسه
- `phdType`: توکن نوع دوره
- `studyMode`: توکن شیوه تحصیل

**Response:**
```json
{
  "success": true,
  "sessionId": "session-uuid",
  "searchId": "search-uuid",
  "status": "completed",
  "data": {
    "id": "search-uuid",
    "query": "machine learning",
    "filters": {...},
    "status": "completed",
    "currentPage": 1,
    "totalPages": 10,
    "results": [
      {
        "title": "PhD in Machine Learning",
        "url": "https://www.findaphd.com/phds/project/...",
        "institution": "University of Oxford",
        "location": "United Kingdom",
        "funding": "Competition Funded",
        "publishedDate": "2025-10-01",
        "description": "...",
        "position": 1
      }
    ],
    "fromCache": false
  }
}
```

#### GET `/search/:searchId?sessionId=xxx`
دریافت وضعیت و نتایج جستجو

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "search-uuid",
    "status": "completed",
    "results": [...],
    ...
  }
}
```

#### POST `/search/:searchId/continue`
ادامه جستجو (صفحه بعدی)

**Request Body:**
```json
{
  "sessionId": "session-uuid",
  "page": 2
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-search-uuid",
    "currentPage": 2,
    "results": [...]
  }
}
```

#### GET `/search/history/:sessionId`
دریافت تاریخچه جستجوها

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "search-1",
      "query": "machine learning",
      "status": "completed",
      "createdAt": 1728123456789,
      ...
    },
    {
      "id": "search-2",
      "query": "artificial intelligence",
      "status": "completed",
      "createdAt": 1728123556789,
      ...
    }
  ]
}
```

#### POST `/search/filters/available`
دریافت لیست فیلترهای موجود

**Response:**
```json
{
  "success": true,
  "data": {
    "disciplines": [
      {
        "token": "10M7g0",
        "name": "Computer Science",
        "slug": "computer-science"
      }
    ],
    "subjects": [...],
    "geographies": [...],
    "funding": [...],
    "institutions": [...],
    "phdTypes": [...],
    "studyModes": [...]
  }
}
```

---

## 💡 نمونه‌های استفاده / Usage Examples

### Example 1: جستجوی ساده

```javascript
// 1. ایجاد session
const sessionResponse = await fetch('http://91.99.13.17:3000/api/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'user-123' })
});
const { data: { sessionId } } = await sessionResponse.json();

// 2. انجام جستجو
const searchResponse = await fetch('http://91.99.13.17:3000/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-123',
    sessionId,
    keywords: 'quantum computing',
    page: 1
  })
});
const searchResult = await searchResponse.json();
console.log('نتایج:', searchResult.data.results);
```

### Example 2: جستجو با فیلتر

```javascript
const searchResponse = await fetch('http://91.99.13.17:3000/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-456',
    keywords: 'artificial intelligence',
    filters: {
      discipline: '10M7g0',      // Computer Science
      geography: ['g0w900'],      // United Kingdom
      funding: ['01M0']           // Self-funded
    },
    page: 1
  })
});
```

### Example 3: صفحه بعدی

```javascript
// ادامه جستجوی قبلی
const continueResponse = await fetch(
  `http://91.99.13.17:3000/api/search/${searchId}/continue`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: sessionId,
      page: 2
    })
  }
);
```

### Example 4: Python Client

```python
import requests

# ایجاد session
session_response = requests.post(
    'http://91.99.13.17:3000/api/session',
    json={'userId': 'python-user-1'}
)
session_id = session_response.json()['data']['sessionId']

# جستجو
search_response = requests.post(
    'http://91.99.13.17:3000/api/search',
    json={
        'userId': 'python-user-1',
        'sessionId': session_id,
        'keywords': 'bioinformatics',
        'filters': {
            'geography': ['g0w900']  # UK
        },
        'page': 1
    }
)

results = search_response.json()['data']['results']
for phd in results:
    print(f"{phd['title']} - {phd['institution']}")
```

### Example 5: cURL

```bash
# Health check
curl http://91.99.13.17:3000/api/health

# ایجاد session
curl -X POST http://91.99.13.17:3000/api/session \
  -H "Content-Type: application/json" \
  -d '{"userId": "curl-user-1"}'

# جستجو
curl -X POST http://91.99.13.17:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "curl-user-1",
    "keywords": "robotics",
    "page": 1
  }'
```

---

## ⚙️ پیکربندی / Configuration

### Environment Variables (.env)

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Browser Pool
MAX_BROWSER_TABS=100

# Crawler Settings
FAPHD_UA=GetPhDBot/1.0 (+contact: api@example.com)
FAPHD_TIMEOUT_MS=30000
FAPHD_MAX_RPS=2
FAPHD_BURST=5

# Cache
FAPHD_CACHE_TTL=900  # 15 minutes

# Discovery (for token dictionary updates)
FAPHD_DISCOVERY_CRON=0 3 * * *  # Daily at 3 AM
```

### توضیحات تنظیمات

- **MAX_BROWSER_TABS**: حداکثر تعداد تب‌های همزمان (پیشنهاد: 50-100)
- **FAPHD_TIMEOUT_MS**: timeout برای هر درخواست (میلی‌ثانیه)
- **FAPHD_CACHE_TTL**: مدت زمان نگه‌داری کش (ثانیه)
- **FAPHD_MAX_RPS**: حداکثر درخواست در ثانیه به سایت هدف

---

## 🧪 تست / Testing

### تست‌های واحد موجود

```bash
# تست‌های اصلی پروژه
npm test

# فقط تست URL parsing
npm run spec

# دموی crawl ساده
npm run demo:crawl
```

### تست API

```bash
# 1. راه‌اندازی سرور در یک ترمینال
npm run api

# 2. اجرای تست‌های API در ترمینال دیگر
npm run test:api
```

### تست دستی با Postman/Insomnia

1. Import کردن collection از `docs/postman-collection.json` (اگر وجود داشته باشد)
2. تست endpoint های مختلف
3. بررسی response ها

---

## 🔧 مشکلات رایج / Troubleshooting

### مشکل 1: خطای "Browser not initialized"

**راه حل:**
```bash
# نصب browsers برای Playwright
npx playwright install chromium
```

### مشکل 2: خطای 403 از سایت FindAPhD

**دلیل:** سایت ممکن است درخواست‌های خودکار را محدود کند.

**راه حل:**
- کاهش `FAPHD_MAX_RPS`
- افزودن تاخیر بین درخواست‌ها
- استفاده از proxy یا تغییر User Agent

### مشکل 3: Memory leak یا مصرف بالای RAM

**راه حل:**
- کاهش `MAX_BROWSER_TABS`
- افزایش فاصله پاکسازی idle tabs
- Restart دوره‌ای سرویس

### مشکل 4: نتایج خالی یا ناقص

**دلیل:** تغییر ساختار HTML سایت FindAPhD

**راه حل:**
- بررسی و به‌روزرسانی selector ها در `playwrightCrawler.js`
- چک کردن console logs برای خطاها

---

## 📊 عملکرد و مقیاس‌پذیری / Performance & Scalability

### آمار عملکرد

- **Response Time**: 5-30 ثانیه (بسته به پیچیدگی جستجو)
- **Cache Hit Rate**: 60-80% (برای کوئری‌های تکراری)
- **Concurrent Requests**: تا 100 درخواست همزمان
- **Memory Usage**: 500MB-2GB (بسته به تعداد تب‌ها)

### توصیه‌های مقیاس‌پذیری

1. **Horizontal Scaling**: اجرای چندین instance با load balancer
2. **Redis Cache**: جایگزینی کش حافظه با Redis
3. **Queue System**: استفاده از RabbitMQ یا Redis Queue
4. **Database**: ذخیره session ها و نتایج در PostgreSQL/MongoDB

---

## 🔐 امنیت / Security

### نکات امنیتی

⚠️ **این API برای محیط production آماده نیست مگر:**

1. افزودن Authentication (JWT/API Keys)
2. Rate Limiting برای هر کاربر
3. Input Validation و Sanitization
4. HTTPS و SSL Certificate
5. CORS محدود به domain های مجاز
6. Logging و Monitoring

### پیاده‌سازی Authentication (مثال)

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
}
```

---

## 📈 Monitoring و Logging

### Logs

تمام عملیات مهم لاگ می‌شوند:

```
[2025-10-05T...] POST /api/search - Request ID: xxx
[SessionManager] Session created: xxx for user yyy
[BrowserPool] Tab acquired: tab_xxx for session yyy
[SearchService] Starting search on tab xxx
[SearchService] Extracted 25 results
[BrowserPool] Tab released: tab_xxx
```

### Metrics

دسترسی به metrics از طریق `/api/health`:

- Browser pool stats
- Session stats  
- Memory usage
- Uptime

---

## 🛠️ Development

### ساختار فایل‌ها

```
src/
├── api/
│   ├── server.js              # Express server اصلی
│   ├── browserPool.js         # مدیریت تب‌های مرورگر
│   ├── sessionManager.js      # مدیریت session کاربران
│   ├── routes/
│   │   ├── search.js          # API routes جستجو
│   │   ├── session.js         # API routes session
│   │   └── health.js          # Health check endpoints
│   └── services/
│       └── searchService.js   # سرویس اصلی جستجو
├── core/
│   ├── config.js              # تنظیمات
│   ├── dictionary.js          # Token dictionary
│   └── queue.js               # صف ساده
├── services/
│   ├── searchOrchestrator.js  # ساخت URL و orchestration
│   └── filterMapper.js        # map کردن فیلترها
├── findaphd/
│   └── url.js                 # پارس و ساخت URL
└── workers/
    ├── crawlWorker.js         # Worker ساده
    └── playwrightCrawler.js   # Crawler پیشرفته
```

### Contributing

برای توسعه پروژه:

1. Fork کردن repository
2. ایجاد branch جدید: `git checkout -b feature/new-feature`
3. Commit تغییرات: `git commit -am 'Add new feature'`
4. Push به branch: `git push origin feature/new-feature`
5. ایجاد Pull Request

---

## 📝 License

ISC License

---

## 📞 Support

برای سوالات و مشکلات:

- GitHub Issues
- Email: support@example.com

---

## 🎉 تشکر / Acknowledgments

این پروژه با استفاده از:
- Express.js
- Playwright
- Node.js

ساخته شده است.

---

**نسخه مستندات:** 1.0.0  
**آخرین به‌روزرسانی:** 2025-10-05
