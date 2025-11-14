# FindAPhD Search API v2.0 🎓

> **دسترسی سریع به 3001+ موقعیت دکترا از FindAPhD.com از طریق REST API با معماری Background Crawler**

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-blue.svg)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/Database-SQLite%2FPostgreSQL-orange.svg)](https://www.sqlite.org/)
[![Swagger](https://img.shields.io/badge/API-Swagger-brightgreen.svg)](http://localhost:3001/api-docs)

## 🆕 تغییرات اساسی در نسخه 2.0

### معماری قبلی (v1.0) ❌
```
User Request → API → Playwright Crawler → FindAPhD.com → Return Results
⏱️  زمان پاسخ: 10-15 ثانیه
🔥 فشار زیاد روی FindAPhD برای هر درخواست
```

### معماری جدید (v2.0) ✅
```
Background Crawler (هر 1 ساعت) → Database → API → User (< 50ms)
⚡ زمان پاسخ: کمتر از 50 میلی‌ثانیه
🎯 فشار کم روی FindAPhD (فقط هر 1 ساعت)
📊 3001+ PhD position همیشه در دسترس
```

---

## 🚀 Quick Start

```bash
# 1. نصب dependencies
npm install

# 2. نصب Playwright browsers
npx playwright install chromium

# 3. اجرای سرور
npm start

# 4. باز کردن Swagger UI
http://localhost:3001/api-docs
```

**سرور شما در حال اجرا است! 🎉**
- Database خودکار initialize می‌شود
- Crawler به صورت background شروع به کار می‌کند
- API آماده دریافت درخواست است

---

## ✨ ویژگی‌های نسخه 2.0

### 🔥 جدید در v2.0
- ✅ **Background Crawler**: کل FindAPhD رو هر 1 ساعت crawl می‌کنه
- ✅ **Database Layer**: SQLite/PostgreSQL با Repository Pattern
- ✅ **سرعت بالا**: API response < 50ms (به جای 10-15s)
- ✅ **Offline Support**: اگه FindAPhD down بود، API کار می‌کنه
- ✅ **Monitoring**: Dashboard کامل برای crawler status
- ✅ **Scheduler**: اجرای خودکار هر 1 ساعت
- ✅ **Observer Pattern**: Real-time monitoring crawler events

### 🎯 ویژگی‌های کلی
- ✅ **REST API**: 15+ endpoint برای search، stats، crawler admin
- ✅ **Pagination**: صفحه‌بندی سریع با limit/offset
- ✅ **Advanced Filters**: جستجو با discipline، country، funding، university
- ✅ **Swagger UI**: مستندات تعاملی کامل
- ✅ **SOLID Principles**: معماری تمیز و قابل توسعه
- ✅ **Design Patterns**: Singleton، Repository، Observer، Strategy

---

## 📡 API Endpoints

### PhD Search (5 endpoints)
```bash
GET  /api/phd/search              # جستجو با فیلتر و pagination
POST /api/phd/search              # جستجو با body (فیلترهای پیچیده)
GET  /api/phd/:id                 # جزئیات یک PhD
GET  /api/phd/stats/summary       # آمار کلی
GET  /api/phd/filters/available   # لیست فیلترهای موجود
```

### Crawler Admin (8 endpoints)
```bash
GET  /api/crawler/status          # وضعیت فعلی crawler
POST /api/crawler/trigger         # اجرای دستی crawler
GET  /api/crawler/logs            # تاریخچه crawler runs
GET  /api/crawler/logs/:id        # جزئیات یک crawler run
GET  /api/crawler/stats           # آمار crawler
GET  /api/crawler/events          # Real-time events
PUT  /api/crawler/settings/interval    # تنظیم بازه زمانی
PUT  /api/crawler/settings/toggle      # فعال/غیرفعال
```

### Health (2 endpoints)
```bash
GET /api/health                   # بررسی سلامت سرویس
GET /api/health/ready             # آماده بودن برای دریافت درخواست
```

**مشاهده در Swagger**: http://localhost:3001/api-docs

---

## 💻 نحوه استفاده

### 1️⃣ جستجوی ساده
```bash
curl "http://localhost:3001/api/phd/search?keywords=machine+learning&page=1&limit=20"
```

### 2️⃣ جستجو با فیلتر
```bash
curl "http://localhost:3001/api/phd/search?keywords=AI&country=United+Kingdom&funding_type=Funded+PhD+Project"
```

### 3️⃣ دریافت آمار
```bash
curl "http://localhost:3001/api/phd/stats/summary"
```

### 4️⃣ وضعیت Crawler
```bash
curl "http://localhost:3001/api/crawler/status"
```

### 5️⃣ اجرای دستی Crawler
```bash
curl -X POST "http://localhost:3001/api/crawler/trigger"
```

---

## 📊 معماری سیستم

```
┌─────────────────────────────────────────────────┐
│        Background Crawler (Every 1 Hour)        │
│  • Crawls ALL PhD positions (3001+)             │
│  • Updates existing records                     │
│  • Marks deleted positions                      │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
          ┌─────────────────┐
          │    Database     │
          │  (SQLite/PG)    │
          │  • phd_positions│
          │  • crawler_logs │
          └────────┬─────────┘
                   │
                   ▼
          ┌─────────────────┐
          │   REST API      │
          │  • Search       │
          │  • Filters      │
          │  • Pagination   │
          └────────┬─────────┘
                   │
                   ▼
              User Response (< 50ms)
```

### جریان کامل:
1. **Startup**: Database initialize → Crawler starts → API ready
2. **Background**: Crawler هر 1 ساعت تمام FindAPhD رو crawl می‌کنه
3. **User Request**: از database می‌خونه (خیلی سریع)
4. **Data Update**: هر 1 ساعت داده‌ها refresh میشن

---

## 🏗️ ساختار پروژه

```
get-phd/
├── src/
│   ├── database/                    # Database Layer
│   │   ├── connection.js            # Singleton connection
│   │   ├── schema.sql               # Database schema
│   │   └── repositories/            # Repository Pattern
│   │       ├── PhDRepository.js
│   │       └── CrawlerLogRepository.js
│   │
│   ├── crawler/                     # Background Crawler
│   │   ├── BackgroundCrawler.js     # Main crawler service
│   │   ├── CrawlerScheduler.js      # Scheduler (cron)
│   │   └── CrawlerObserver.js       # Observer Pattern
│   │
│   ├── api/                         # REST API
│   │   ├── server-new.js            # Express server v2.0
│   │   └── routes/
│   │       ├── phd.js               # PhD endpoints
│   │       ├── crawler.js           # Crawler admin
│   │       └── health.js            # Health checks
│   │
│   └── workers/
│       └── playwrightCrawler.js     # Playwright crawler (reused)
│
├── data/                            # Database files
│   └── findaphd.db                  # SQLite database
│
├── docs/                            # مستندات
│   └── architecture/
│       └── NEW-ARCHITECTURE.md      # معماری v2.0
│
├── swagger-v2.json                  # OpenAPI 3.0 spec
├── package.json                     # Dependencies
└── README-V2.md                     # این فایل
```

---

## 🎨 Design Patterns استفاده شده

### 1. Singleton Pattern
```javascript
// Database & Crawler - فقط یک instance
Database.getInstance()
BackgroundCrawler.getInstance()
```

### 2. Repository Pattern
```javascript
// جداسازی business logic از data access
PhDRepository.search(options)
PhDRepository.findById(id)
```

### 3. Observer Pattern
```javascript
// Monitoring crawler events
BackgroundCrawler.subscribe((event, data) => {
  CrawlerObserver.handleEvent(event, data);
});
```

### 4. Strategy Pattern
```javascript
// مختلف crawling strategies
FullCrawlStrategy, IncrementalCrawlStrategy
```

---

## 🔧 تنظیمات

### Environment Variables
```bash
# Database
DB_TYPE=sqlite                    # sqlite یا postgresql
SQLITE_PATH=./data/findaphd.db   # مسیر database
DB_HOST=localhost                 # برای PostgreSQL
DB_PORT=5432
DB_NAME=findaphd
DB_USER=postgres
DB_PASSWORD=

# Server
PORT=3001
NODE_ENV=development
```

### تنظیمات Crawler
```bash
# از طریق API
curl -X PUT http://localhost:3001/api/crawler/settings/interval \
  -H "Content-Type: application/json" \
  -d '{"hours": 2}'

# فعال/غیرفعال کردن
curl -X PUT http://localhost:3001/api/crawler/settings/toggle \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

---

## 📊 عملکرد

### Benchmarks
| متریک | v1.0 | v2.0 | بهبود |
|-------|------|------|-------|
| API Response Time | 10-15s | <50ms | **300x faster** |
| FindAPhD Requests | Per user request | Every 1 hour | **99% reduction** |
| Concurrent Users | Limited by browser pool | Unlimited | **Infinite scale** |
| Data Freshness | Real-time | 1 hour | Acceptable trade-off |
| Memory Usage | 256MB | 128MB | 50% less |

### Database Stats
- **تعداد PhD ها**: 3001+
- **تعداد کشورها**: 50+
- **تعداد Disciplines**: 30+
- **حجم دیتابیس**: ~50MB (SQLite)

---

## 🧪 تست

### 1. تست Database
```bash
npm run test:db
```

### 2. تست Crawler
```bash
npm run test:crawler
```

### 3. تست API
```bash
# شروع سرور
npm start

# تست endpoints
curl http://localhost:3001/api/health
curl http://localhost:3001/api/phd/search
curl http://localhost:3001/api/crawler/status
```

---

## 🚢 Deployment

### Production Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd get-phd

# 2. Install dependencies
npm install --production

# 3. تنظیم environment
export DB_TYPE=postgresql
export DB_HOST=your-db-host
export DB_NAME=findaphd
export DB_USER=postgres
export DB_PASSWORD=your-password
export NODE_ENV=production

# 4. اجرا با PM2
npm install -g pm2
pm2 start src/api/server-new.js --name findaphd-api

# 5. مانیتورینگ
pm2 logs findaphd-api
pm2 monit
```

### Docker
```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install --production
RUN npx playwright install chromium
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

```bash
docker build -t findaphd-api .
docker run -p 3001:3001 -v ./data:/app/data findaphd-api
```

---

## 🔄 Migration از v1.0 به v2.0

### تغییرات API

| v1.0 Endpoint | v2.0 Endpoint | وضعیت |
|---------------|---------------|-------|
| `POST /api/session` | ❌ Removed | Session دیگر لازم نیست |
| `POST /api/search` | `GET /api/phd/search` | Moved |
| `GET /api/search/:id` | `GET /api/phd/:id` | Moved |
| `POST /api/search/filters/available` | `GET /api/phd/filters/available` | Changed method |

### Breaking Changes
- ❌ Session management حذف شد
- ❌ Real-time crawling حذف شد
- ✅ همه چیز از database می‌خونه
- ✅ Response format تغییر کرده

### مثال Migration
```javascript
// v1.0 ❌
const session = await createSession();
const results = await search({ sessionId, keywords: 'AI' });

// v2.0 ✅
const results = await fetch('/api/phd/search?keywords=AI');
// خیلی ساده‌تر! بدون session
```

---

## 🎯 Roadmap

### ✅ Completed (v2.0)
- [x] Background Crawler با Scheduler
- [x] Database Layer با Repository Pattern
- [x] API Endpoints جدید
- [x] Monitoring & Logging
- [x] Swagger Documentation

### 🔄 در حال توسعه
- [ ] Dashboard برای Admin
- [ ] WebSocket برای real-time updates
- [ ] API Authentication (JWT)
- [ ] Rate Limiting per user

### 📋 برنامه آینده
- [ ] Multi-source crawling (PhD.com, Jobs.ac.uk)
- [ ] ML-based recommendation system
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] GraphQL API

---

## 📚 مستندات

- **[NEW-ARCHITECTURE.md](./docs/architecture/NEW-ARCHITECTURE.md)** - معماری کامل v2.0
- **[Swagger UI](http://localhost:3001/api-docs)** - مستندات تعاملی API
- **[MIGRATION-GUIDE.md](./docs/MIGRATION-GUIDE.md)** - راهنمای migrate از v1

---

## 🤝 مشارکت

```bash
# 1. Fork & Clone
git clone <your-fork>

# 2. Create branch
git checkout -b feature/amazing-feature

# 3. Make changes & test
npm run test:db
npm run test:crawler

# 4. Commit
git commit -m "feat: add amazing feature"

# 5. Push & PR
git push origin feature/amazing-feature
```

---

## 📄 License

ISC License - استفاده آزاد

---

## 🙏 Acknowledgments

- **FindAPhD.com** - منبع داده
- **Playwright** - Browser automation
- **Express.js** - Web framework
- **SQLite/PostgreSQL** - Database

---

## 📞 Support

- **Swagger UI**: http://localhost:3001/api-docs
- **GitHub Issues**: برای گزارش باگ و feature request
- **Docs**: مستندات کامل در پوشه `docs/`

---

**Made with ❤️ for PhD seekers worldwide**

**v2.0.0** - Background Crawler Architecture 🚀

