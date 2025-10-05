# FindAPhD Search API 🎓

> **دسترسی کامل به جستجوی موقعیت‌های دکترا از FindAPhD.com از طریق RESTful API**

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-blue.svg)](https://expressjs.com/)
[![Playwright](https://img.shields.io/badge/Playwright-1.55.1-red.svg)](https://playwright.dev/)
[![Swagger](https://img.shields.io/badge/API-Swagger-brightgreen.svg)](http://localhost:3000/api-docs)

## 🚀 Quick Start

```bash
# نصب Dependencies
npm install

# اجرای سرور API
npm start

# دسترسی به Swagger UI
# باز کردن مرورگر: http://localhost:3000/api-docs
```

**تبریک! API شما در حال اجرا است! 🎉**

---

## فهرست مطالب / Table of Contents
1. [Quick Start](#quick-start)
2. [Features](#features)
3. [API Endpoints](#api-endpoints)
4. [Commands](#commands)
5. [Documentation](#documentation)
6. [Architecture Summary](#architecture-summary)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Development Workflow](#development-workflow)

---

## ✨ Features

- ✅ **REST API کامل**: 11 endpoint برای جستجو، session و health check
- ✅ **Swagger UI**: مستندات تعاملی و تست API
- ✅ **Browser Pool**: مدیریت تا 100 تب همزمان با Playwright
- ✅ **Session Management**: مدیریت state و تاریخچه جستجو
- ✅ **Caching**: کش 15 دقیقه‌ای برای جستجوهای مشابه
- ✅ **Filter Support**: پشتیبانی کامل از فیلترهای FindAPhD
- ✅ **Pagination**: صفحه‌بندی خودکار نتایج
- ✅ **Graceful Shutdown**: خاموش شدن ایمن سرویس
- ✅ **Error Handling**: مدیریت خطا با Request ID
- ✅ **CORS Support**: دسترسی از هر Domain

---

## 🎨 برای Frontend Developers

**راهنمای کامل اتصال به API:**

- 📘 **[FRONTEND-GUIDE.md](./FRONTEND-GUIDE.md)** - راهنمای کامل قدم‌به‌قدم با کد React
- 📊 **[FRONTEND-FLOWCHART.md](./FRONTEND-FLOWCHART.md)** - فلوچارت‌های دقیق و کامل
- 🎯 **[FRONTEND-SIMPLE-FLOW.md](./FRONTEND-SIMPLE-FLOW.md)** - فلوچارت ساده برای توضیح سریع

**شامل:**
- ✅ Context API برای State Management
- ✅ Session Management کامل با localStorage
- ✅ مدیریت خطاها و Retry Logic
- ✅ Infinite Scroll و Pagination
- ✅ کدهای آماده React, Vue, Angular
- ✅ فلوچارت‌های بصری

---

## 📡 API Endpoints

### Health (2 endpoints)
- `GET /api/health` - بررسی وضعیت کلی سرویس
- `GET /api/health/ready` - بررسی آماده بودن

### Session (4 endpoints)
- `POST /api/session` - ایجاد session جدید
- `GET /api/session/:id` - دریافت اطلاعات session
- `DELETE /api/session/:id` - حذف session
- `GET /api/session/user/:userId` - لیست session های کاربر

### Search (5 endpoints)
- `POST /api/search` - انجام جستجوی جدید
- `GET /api/search/:id` - دریافت نتایج جستجو
- `POST /api/search/:id/continue` - ادامه جستجو (صفحه بعدی)
- `GET /api/search/history/:sessionId` - تاریخچه جستجوها
- `POST /api/search/filters/available` - دریافت فیلترهای موجود

**مشاهده در Swagger**: http://localhost:3000/api-docs

---

## 💻 Commands

### اجرای سرویس
```bash
npm start              # اجرای سرور API
npm run dev            # Development mode با auto-restart
npm run api            # اجرای سرور (مشابه start)
```

### تست
```bash
npm run test:full      # تست کامل (11 تست)
npm run test:real      # تست جستجوی واقعی
npm run test:api       # تست API (قدیمی)
npm test               # تست‌های unit
```

### دموها
```bash
npm run demo:crawl     # دمو crawl اولیه
npm run docs           # باز کردن Swagger UI
```

**راهنمای کامل**: [COMMANDS.md](./COMMANDS.md)

---

## 📚 Documentation

> **📋 [فهرست کامل مستندات →](./DOCUMENTATION-INDEX.md)** - راهنمای پیدا کردن مستند مورد نیاز

### 🚀 راهنماهای شروع سریع
- **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** ⚡ - **3 قدم تا جستجو** (سریع‌ترین راه!)
- **[STEP-BY-STEP-GUIDE.md](./STEP-BY-STEP-GUIDE.md)** 📖 - **راهنمای گام‌به‌گام کامل**
- **[SWAGGER-QUICKSTART.md](./SWAGGER-QUICKSTART.md)** - شروع 30 ثانیه‌ای با Swagger
- **[COMMANDS.md](./COMMANDS.md)** - راهنمای کامل دستورات اجرا
- **[CHEATSHEET.md](./CHEATSHEET.md)** - خلاصه تمام دستورات

### 📖 راهنماهای پیشرفته
- **[docs/SWAGGER-GUIDE.md](./docs/SWAGGER-GUIDE.md)** - راهنمای جامع Swagger و تولید Client
- **[QUICK-START.md](./QUICK-START.md)** - راهنمای شروع سریع API

### مستندات فنی
- **[docs/API-DOCUMENTATION.md](./docs/API-DOCUMENTATION.md)** - مستندات کامل API (فارسی/English)
- **[docs/DEVELOPMENT-REPORT.md](./docs/DEVELOPMENT-REPORT.md)** - گزارش توسعه و تست‌ها
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - راهنمای استقرار Production
- **[swagger.json](./swagger.json)** - OpenAPI 3.0 Specification

### مستندات معماری
- **[docs/architecture/overview.md](./docs/architecture/overview.md)** - نمای کلی معماری
- **[docs/architecture/data-model.md](./docs/architecture/data-model.md)** - مدل داده
- **[docs/architecture/operations.md](./docs/architecture/operations.md)** - عملیات سیستم
- **[docs/architecture/roadmap.md](./docs/architecture/roadmap.md)** - نقشه راه

### مستندات فیلترها
- **[docs/findaphd-search-spec.md](./docs/findaphd-search-spec.md)** - مشخصات کامل فیلترها
- **[docs/filters-reference.md](./docs/filters-reference.md)** - خلاصه فیلترها و مثال‌ها
- **[docs/api.md](./docs/api.md)** - توضیح ماژول‌های prepare/parse

---

## Architecture Summary
لایه‌ها: Orchestrator (ساخت URL + canonical key) → Queue → Crawl Worker → (آینده: Enrichment + Persist).
مستند کامل: `docs/architecture/overview.md` | مدل داده: `docs/architecture/data-model.md` | عملیات: `docs/architecture/operations.md` | نقشه راه: `docs/architecture/roadmap.md`.

## Filters & API Usage
نمونه استفاده از `prepare()`:
```js
const { prepare } = require('./src/services/searchOrchestrator');
const r = prepare({
	keywords: 'machine learning',
	filters: {
		discipline: 'Computer Science',
		geography: ['United Kingdom'],
		funding: ['Competition Funded Project']
	},
	page: 1
});
console.log(r.url);      // URL نهایی
console.log(r.tokens);   // آرایه توکن‌ها
console.log(r.warnings); // هشدارهای map
```
خلاصه خانواده توکن‌ها:
- discipline: پیشوند 10…
- subject: پیشوند 30…
- geography: g…
- funding: 01…
جزئیات کامل: `docs/findaphd-search-spec.md` | خلاصه: `docs/filters-reference.md` | API Doc: `docs/api.md`.

## Development Workflow
1. ساخت branch جدید: feature/<name>
2. افزودن یا بروزرسانی تست مربوط.
3. اجرای `npm test` تا سبز.
4. به‌روزرسانی README / docs در صورت تغییر رفتار.
5. (آینده) Pull Request با توضیح مختصر و لینک به issue.

## 🧪 Testing

### تست خودکار API
```bash
npm run test:full
```
**11 تست کامل:**
- ✅ Root endpoint
- ✅ Health check & Ready check
- ✅ Session management (Create/Get/Delete)
- ✅ Search operations (Create/Get/Continue)
- ✅ Filter & History endpoints

**نتیجه:** 100% success rate (11/11 passed)

### تست جستجوی واقعی
```bash
npm run test:real
```
**نتیجه:** 170 PhD positions found in 17 pages (~13.6s)

### تست‌های Unit
```bash
npm test
```
تست‌های موجود:
- URL parsing/build: `tests/findaphd-url.test.js`
- Orchestrator (prepare): `tests/orchestrator.test.js`
- Filter mapping: `tests/filter-mapper.test.js`
- Integration: `tests/integration.test.js`

---

## 🚢 Deployment

### Production Setup
راهنمای کامل: [DEPLOYMENT.md](./DEPLOYMENT.md)

```bash
# نصب برای Production
npm install --production

# اجرا با PM2
pm2 start src/api/server.js --name findaphd-api

# یا با Docker
docker build -t findaphd-api .
docker run -p 3000:3000 findaphd-api
```

### Environment Variables
```bash
PORT=3000                    # پورت سرور
NODE_ENV=production          # محیط اجرا
MAX_BROWSER_TABS=100         # حداکثر تب‌های همزمان
SESSION_TIMEOUT=86400000     # timeout session (24h)
```

---

## 🛠️ Development Workflow

### مراحل توسعه
1. **Fork & Clone**: کلون کردن ریپازیتوری
   ```bash
   git clone <repo-url>
   cd get-phd
   npm install
   ```

2. **Development Mode**: اجرا با auto-restart
   ```bash
   npm run dev
   ```

3. **تست تغییرات**: قبل از commit
   ```bash
   npm run test:full
   ```

4. **Swagger UI**: تست API در مرورگر
   ```
   http://localhost:3000/api-docs
   ```

5. **Commit & Push**: ارسال تغییرات
   ```bash
   git add .
   git commit -m "feat: your feature"
   git push
   ```

### ساختار پروژه
```
get-phd/
├── src/
│   ├── api/                 # REST API
│   │   ├── server.js        # Express server
│   │   ├── browserPool.js   # Browser pool manager
│   │   ├── sessionManager.js # Session manager
│   │   ├── routes/          # API routes
│   │   │   ├── health.js
│   │   │   ├── session.js
│   │   │   └── search.js
│   │   └── services/
│   │       └── searchService.js
│   ├── workers/
│   │   └── playwrightCrawler.js
│   ├── services/            # Core services
│   │   ├── filterMapper.js
│   │   └── searchOrchestrator.js
│   ├── core/                # Core modules
│   │   ├── config.js
│   │   ├── dictionary.js
│   │   └── queue.js
│   └── demo/
│       └── crawl.js
├── tests/                   # Test files
├── docs/                    # Documentation
├── swagger.json             # OpenAPI spec
└── package.json
```

---

## 🔍 Example Usage

### JavaScript/Node.js
```javascript
const fetch = require('node-fetch');

async function searchPhD(keywords) {
  // ایجاد session
  const session = await fetch('http://localhost:3000/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'user-123' })
  }).then(r => r.json());

  // جستجو
  const result = await fetch('http://localhost:3000/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'user-123',
      sessionId: session.data.sessionId,
      keywords: keywords,
      filters: { discipline: '10M7g0' }
    })
  }).then(r => r.json());

  return result.data.results;
}

searchPhD('machine learning').then(results => {
  console.log(`Found ${results.length} PhD positions`);
});
```

### Python
```python
import requests

def search_phd(keywords):
    # ایجاد session
    session = requests.post('http://localhost:3000/api/session', 
                           json={'userId': 'user-123'}).json()
    
    # جستجو
    result = requests.post('http://localhost:3000/api/search', json={
        'userId': 'user-123',
        'sessionId': session['data']['sessionId'],
        'keywords': keywords,
        'filters': {'discipline': '10M7g0'}
    }).json()
    
    return result['data']['results']

results = search_phd('artificial intelligence')
print(f"Found {len(results)} PhD positions")
```

### cURL
```bash
# ایجاد session
curl -X POST http://localhost:3000/api/session \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123"}'

# جستجو
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "sessionId": "your-session-id",
    "keywords": "deep learning",
    "filters": {"discipline": "10M7g0"}
  }'
```

---

## 🎯 Roadmap & Next Steps

### ✅ Completed (v1.0.0)
- [x] REST API با 11 endpoint
- [x] Browser Pool با محدودیت 100 تب
- [x] Session Management
- [x] Playwright Integration
- [x] Swagger Documentation
- [x] Comprehensive Testing
- [x] Production Deployment Guide

### 🔄 In Progress
- [ ] Redis Caching
- [ ] Rate Limiting
- [ ] JWT Authentication
- [ ] WebSocket Support for Real-time

### 📋 Planned
- [ ] Multi-source Search (PhD.com, Jobs.ac.uk)
- [ ] ML-based Result Ranking
- [ ] User Dashboard
- [ ] Email Notifications
- [ ] Advanced Analytics

**جزئیات بیشتر**: [docs/architecture/roadmap.md](./docs/architecture/roadmap.md)

## 🔒 Security Notes

⚠️ **Important**: این نسخه برای توسعه طراحی شده است.

### در نسخه فعلی موجود نیست:
- ❌ Authentication/Authorization (JWT)
- ❌ Rate Limiting
- ❌ Input Validation (XSS/SQL Injection)
- ❌ API Key Management
- ❌ HTTPS/SSL

### برای Production:
1. فعال کردن HTTPS
2. اضافه کردن JWT Authentication
3. پیاده‌سازی Rate Limiting
4. استفاده از Nginx Reverse Proxy
5. فعال کردن CORS محدود

**راهنمای Security**: [DEPLOYMENT.md](./DEPLOYMENT.md#security)

---

## 🌍 Internationalization

مستندات به دو زبان **فارسی** و **English** نوشته شده است:
- کد و API: English
- مستندات: Bilingual (فارسی/English)
- Comments: Mixed

---

## 📊 Performance

### Current Metrics
- **Startup Time**: ~2 seconds
- **Search Response**: ~8-15 seconds (first page)
- **Cached Search**: <100ms
- **Memory Usage**: ~256MB (idle)
- **Concurrent Searches**: Up to 100

### Optimization Tips
- استفاده از Cache برای جستجوهای مشابه
- Reuse session برای جستجوهای متعدد
- Pagination به جای دریافت همه صفحات
- Close session وقتی کار تمام شد

---

## 🐛 Troubleshooting

### سرور start نمی‌شه
```bash
# چک کردن پورت
netstat -ano | findstr :3000

# نصب مجدد
npm install
```

### خطای Playwright
```bash
npx playwright install
```

### نتیجه‌ای برنمی‌گرده
- چک کنید سرور در حال اجرا باشد: `curl http://localhost:3000/api/health`
- Swagger UI رو چک کنید: http://localhost:3000/api-docs
- لاگ‌های سرور رو بررسی کنید

### 503 Service Unavailable
- تمام 100 تب استفاده شده
- چند ثانیه صبر کنید یا session های قدیمی رو close کنید

---

## 📝 Contributing

### چگونه مشارکت کنیم:
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes & test: `npm run test:full`
4. Commit: `git commit -m 'feat: add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open Pull Request

### Commit Convention
- `feat:` ویژگی جدید
- `fix:` رفع باگ
- `docs:` تغییرات مستندات
- `test:` اضافه کردن تست
- `refactor:` بازنویسی کد

---

## 📄 License

ISC License - برای استفاده آزاد

---

## 🙏 Acknowledgments

- **FindAPhD.com** - منبع داده
- **Playwright** - Browser automation
- **Express.js** - Web framework
- **Swagger UI** - API documentation

---

## 📞 Support

- **Documentation**: مستندات کامل در پوشه `docs/`
- **Examples**: کدهای نمونه در `tests/`
- **Swagger UI**: http://localhost:3000/api-docs
- **Issues**: GitHub Issues

---

## 🎉 Quick Links

| لینک | توضیح |
|------|-------|
| [COMMANDS.md](./COMMANDS.md) | راهنمای کامل دستورات |
| [SWAGGER-QUICKSTART.md](./SWAGGER-QUICKSTART.md) | شروع سریع 30 ثانیه‌ای |
| [API Docs](./docs/API-DOCUMENTATION.md) | مستندات کامل API |
| [Swagger UI](http://localhost:3000/api-docs) | مستندات تعاملی |
| [Deployment](./DEPLOYMENT.md) | راهنمای استقرار |

---

**Made with ❤️ for PhD seekers worldwide**
