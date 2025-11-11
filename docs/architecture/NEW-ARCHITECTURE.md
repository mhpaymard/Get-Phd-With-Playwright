# 🏗️ معماری جدید پروژه FindAPhD (Background Crawler Architecture)

## 📊 تغییرات اساسی

### معماری قبلی (On-Demand):
```
User Request → API → Playwright Crawler → FindAPhD.com → Return Results
```
**مشکل:** هر درخواست 10-15 ثانیه طول می‌کشه، فشار زیاد روی FindAPhD

### معماری جدید (Background Crawler + Database):
```
┌─────────────────────────────────────────────────────────┐
│         Background Crawler (Every 1 Hour)               │
│  • Crawls ALL PhD positions (3000+)                     │
│  • Updates existing records                             │
│  • Marks deleted positions                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
        ┌──────────────────┐
        │    Database      │
        │  (PostgreSQL)    │
        │  • phd_positions │
        │  • crawl_logs    │
        └─────────┬────────┘
                  │
                  ▼
        ┌──────────────────┐
        │   REST API       │
        │  • Search        │
        │  • Filters       │
        │  • Pagination    │
        └──────────────────┘
                  │
                  ▼
              User Response (< 50ms)
```

---

## 🎯 اجزای اصلی

### 1. Database Layer (Repository Pattern)
```javascript
PhDRepository
├── insert(phdData)           // افزودن PhD جدید
├── update(id, phdData)       // آپدیت PhD موجود
├── findById(id)              // جستجو با ID
├── search(query, filters)    // جستجو با فیلتر
├── paginate(page, limit)     // Pagination
└── markAsDeleted(id)         // علامت‌گذاری حذف شده
```

**Schema:**
```sql
CREATE TABLE phd_positions (
  id                SERIAL PRIMARY KEY,
  external_id       VARCHAR(255) UNIQUE,    -- ID از FindAPhD
  title             TEXT NOT NULL,
  description       TEXT,
  university        VARCHAR(500),
  location          VARCHAR(500),
  country           VARCHAR(100),
  funding_type      VARCHAR(100),
  deadline          DATE,
  url               TEXT,
  discipline        VARCHAR(255),
  subject           VARCHAR(255),
  
  -- Metadata
  is_active         BOOLEAN DEFAULT true,
  first_seen_at     TIMESTAMP DEFAULT NOW(),
  last_seen_at      TIMESTAMP DEFAULT NOW(),
  last_updated_at   TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_title ON phd_positions(title);
CREATE INDEX idx_university ON phd_positions(university);
CREATE INDEX idx_discipline ON phd_positions(discipline);
CREATE INDEX idx_is_active ON phd_positions(is_active);
CREATE INDEX idx_deadline ON phd_positions(deadline);

-- Crawler logs
CREATE TABLE crawler_logs (
  id                SERIAL PRIMARY KEY,
  started_at        TIMESTAMP NOT NULL,
  completed_at      TIMESTAMP,
  status            VARCHAR(50),        -- running, completed, failed
  total_found       INTEGER,
  total_new         INTEGER,
  total_updated     INTEGER,
  total_deleted     INTEGER,
  error_message     TEXT,
  duration_seconds  INTEGER
);
```

---

### 2. Background Crawler Service

```javascript
class BackgroundCrawlerService {
  constructor(repository, playwrightCrawler) {
    this.repository = repository;
    this.crawler = playwrightCrawler;
    this.isRunning = false;
    this.currentStats = {
      found: 0,
      new: 0,
      updated: 0,
      deleted: 0
    };
  }

  // شروع crawl کامل
  async startFullCrawl() {
    // 1. Crawl تمام صفحات (با keywords خالی "")
    // 2. Extract تمام PhD positions
    // 3. مقایسه با database
    // 4. Insert/Update/Delete
  }

  // Scheduler - هر 1 ساعت
  startScheduler() {
    setInterval(() => {
      this.startFullCrawl();
    }, 3600000); // 1 hour
  }
}
```

**Crawling Strategy:**
1. ابتدا تمام disciplines رو crawl می‌کنه
2. برای هر discipline، تمام صفحات رو می‌گرده
3. برای هر PhD، یک `external_id` منحصر به فرد ذخیره می‌کنه
4. اگه PhD قبلاً وجود داشته → UPDATE
5. اگه PhD جدیده → INSERT
6. اگه PhD در سایت نبود → `is_active = false`

---

### 3. Refactored API Layer

**قبلی:** `/api/search` → Crawler اجرا می‌شد  
**جدید:** `/api/search` → جستجو از Database

```javascript
// GET /api/phd/search
{
  "keywords": "machine learning",      // optional
  "filters": {
    "discipline": "Computer Science",  // optional
    "country": "United Kingdom",       // optional
    "funding": "Funded"                // optional
  },
  "page": 1,
  "limit": 20
}

// Response (< 50ms)
{
  "success": true,
  "data": {
    "results": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3420,
      "totalPages": 171
    },
    "lastCrawlAt": "2025-11-11T12:00:00Z"
  }
}
```

**New Endpoints:**
```
GET  /api/phd/search              - جستجو با فیلتر
GET  /api/phd/:id                 - جزئیات یک PhD
GET  /api/phd/stats               - آمار کلی (تعداد، disciplines، ...)
GET  /api/crawler/status          - وضعیت crawler
GET  /api/crawler/logs            - تاریخچه crawl ها
POST /api/crawler/trigger         - اجرای دستی crawler (admin)
```

---

## 🎨 Design Patterns استفاده شده

### 1. Repository Pattern
```javascript
// Abstraction برای database operations
class PhDRepository {
  constructor(db) {
    this.db = db;
  }
  
  async search(query) {
    // SQL queries
  }
}
```

### 2. Singleton Pattern
```javascript
// فقط یک instance از database connection
class Database {
  static instance = null;
  
  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}
```

### 3. Observer Pattern
```javascript
// Monitoring crawler progress
class CrawlerObserver {
  onStart() { /* notify */ }
  onProgress(stats) { /* update UI */ }
  onComplete(result) { /* log */ }
  onError(error) { /* alert */ }
}
```

### 4. Strategy Pattern
```javascript
// مختلف strategies برای crawling
class FullCrawlStrategy { /* crawl همه */ }
class IncrementalCrawlStrategy { /* فقط تغییرات */ }
class DisciplineCrawlStrategy { /* یک discipline */ }
```

### 5. Factory Pattern
```javascript
// ساخت crawler با config مختلف
class CrawlerFactory {
  createCrawler(type) {
    switch(type) {
      case 'full': return new FullCrawler();
      case 'incremental': return new IncrementalCrawler();
    }
  }
}
```

---

## 📁 ساختار فایل‌های جدید

```
src/
├── database/
│   ├── connection.js           // Database connection (Singleton)
│   ├── schema.sql              // Database schema
│   ├── migrations/             // Migration files
│   └── repositories/
│       ├── PhDRepository.js    // Repository Pattern
│       └── CrawlerLogRepository.js
│
├── crawler/
│   ├── BackgroundCrawler.js    // Main crawler service
│   ├── CrawlerScheduler.js     // Scheduler (every 1 hour)
│   ├── CrawlerStrategy.js      // Strategy Pattern
│   └── CrawlerObserver.js      // Observer Pattern
│
├── services/
│   ├── PhDService.js           // Business logic
│   └── SearchService.js        // Search logic
│
├── api/
│   ├── server.js               // Express server
│   └── routes/
│       ├── phd.js              // PhD endpoints
│       └── crawler.js          // Crawler admin endpoints
│
└── workers/
    └── playwrightCrawler.js    // همون Playwright crawler (reuse)
```

---

## 🔄 جریان کامل سیستم

### هنگام استارت برنامه:
```javascript
1. Database.initialize()
2. BackgroundCrawler.startFullCrawl()
   ├── Crawl page 1, 2, 3, ... (تا آخر)
   ├── Extract 3000+ PhD positions
   ├── Save to database
   └── Complete (~ 30-60 minutes)
3. CrawlerScheduler.start()
   └── هر 1 ساعت: startFullCrawl()
4. API Server.listen()
```

### هنگام درخواست کاربر:
```javascript
User → GET /api/phd/search?keywords=AI&discipline=CS
     → PhDService.search(params)
     → PhDRepository.search(query)
     → SQL Query (< 50ms)
     → Return Results
```

---

## ✅ مزایای معماری جدید

1. **سرعت بالا:** API response < 50ms (به جای 10-15s)
2. **بار کمتر:** فقط هر 1 ساعت یکبار crawl می‌شه
3. **Scalability:** می‌تونیم هزاران user همزمان داشته باشیم
4. **Reliability:** اگه FindAPhD down بود، API ما کار می‌کنه
5. **Analytics:** می‌تونیم روی داده‌ها analytics بزنیم
6. **Caching:** خود database یه cache طبیعی هست

---

## 🚀 مراحل پیاده‌سازی

1. ✅ طراحی Database Schema
2. ⏳ پیاده‌سازی Database Layer + Repository
3. ⏳ Refactor Crawler به Background Service
4. ⏳ پیاده‌سازی Scheduler
5. ⏳ Refactor API endpoints
6. ⏳ تست کامل
7. ⏳ آپدیت مستندات
8. ⏳ حذف فایل‌های قدیمی

---

## 🎯 SOLID Principles

- **S (Single Responsibility):** هر class یک وظیفه (Repository, Service, Controller)
- **O (Open/Closed):** Strategy pattern برای extend کردن crawler
- **L (Liskov Substitution):** Repository interface قابل جایگزینی
- **I (Interface Segregation):** Interfaces کوچک و specific
- **D (Dependency Injection):** Dependencies از بیرون inject می‌شن

---

**تاریخ:** 2025-11-11  
**نسخه:** 2.0.0  
**وضعیت:** 🚧 در حال توسعه

