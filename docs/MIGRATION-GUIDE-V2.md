# راهنمای Migration از v1.0 به v2.0

این راهنما به شما کمک می‌کنه که از نسخه 1.0 (On-Demand Crawling) به نسخه 2.0 (Background Crawler + Database) مهاجرت کنید.

---

## 🎯 تغییرات اصلی

### معماری
- **v1.0**: On-demand crawling (درخواست → Crawl → Response)
- **v2.0**: Background crawler + Database (Scheduled Crawl → Database → Instant Response)

### Performance
- **v1.0**: Response time: 10-15s
- **v2.0**: Response time: <50ms

### Scalability
- **v1.0**: محدود به browser pool (100 تب)
- **v2.0**: نامحدود (database-backed)

---

## 📋 Checklist مهاجرت

### ✅ قبل از شروع
- [ ] Backup از کد v1.0
- [ ] آماده‌سازی database (SQLite/PostgreSQL)
- [ ] نصب dependencies جدید
- [ ] مطالعه تغییرات API

### ✅ در حین مهاجرت
- [ ] آپدیت package.json
- [ ] تغییر endpoints در کد client
- [ ] حذف session management
- [ ] تست API های جدید

### ✅ بعد از مهاجرت
- [ ] Monitoring crawler
- [ ] چک کردن database size
- [ ] تنظیم crawler interval
- [ ] Performance testing

---

## 🔄 تغییرات API

### 1. Session Management (حذف شده ❌)

**v1.0:**
```javascript
// ایجاد session
POST /api/session
{
  "userId": "user-123"
}

// استفاده از session برای جستجو
POST /api/search
{
  "userId": "user-123",
  "sessionId": "sess-abc",
  "keywords": "machine learning"
}
```

**v2.0:**
```javascript
// Session دیگر لازم نیست!
GET /api/phd/search?keywords=machine+learning

// یا با POST
POST /api/phd/search
{
  "keywords": "machine learning"
}
```

**چرا؟** چون تمام داده‌ها از database می‌خونه، نیازی به نگه‌داری state نیست.

---

### 2. Search Endpoints (تغییر یافته 🔄)

**v1.0:**
```javascript
POST /api/search
{
  "userId": "user-123",
  "sessionId": "sess-abc",
  "keywords": "machine learning",
  "filters": {
    "discipline": "10M7g0"  // Token format
  },
  "page": 1
}

Response:
{
  "status": "success",
  "data": {
    "searchId": "search-123",
    "results": [...],
    "pagination": {...},
    "cached": false
  }
}
```

**v2.0:**
```javascript
// GET method (ساده‌تر)
GET /api/phd/search?keywords=machine+learning&discipline=Computer+Science&page=1&limit=20

// یا POST با body
POST /api/phd/search
{
  "keywords": "machine learning",
  "discipline": "Computer Science",  // Human-readable
  "country": "United Kingdom",
  "page": 1,
  "limit": 20
}

Response:
{
  "success": true,
  "data": {
    "results": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3420,
      "totalPages": 171,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {...}
  },
  "timestamp": "2025-11-11T12:00:00Z"
}
```

**تفاوت‌ها:**
- ✅ فیلترها حالا human-readable هستند (نه token)
- ✅ GET و POST هر دو پشتیبانی می‌شوند
- ✅ `searchId` دیگر وجود نداره
- ✅ Response سریع‌تر (<50ms)

---

### 3. Get Results (تغییر یافته 🔄)

**v1.0:**
```javascript
GET /api/search/:searchId

Response:
{
  "status": "success",
  "data": {
    "results": [...],
    "pagination": {...}
  }
}
```

**v2.0:**
```javascript
// دیگر searchId وجود نداره
// مستقیماً از PhD ID استفاده کن

GET /api/phd/:id

Response:
{
  "success": true,
  "data": {
    "id": 123,
    "external_id": "phds/project/...",
    "title": "PhD in Machine Learning",
    "description": "...",
    "university": "Oxford University",
    // ... تمام فیلدها
  }
}
```

---

### 4. Continue Search (حذف شده ❌)

**v1.0:**
```javascript
POST /api/search/:searchId/continue
{
  "page": 2
}
```

**v2.0:**
```javascript
// فقط page parameter رو تغییر بده
GET /api/phd/search?keywords=AI&page=2&limit=20

// خیلی ساده‌تر!
```

---

### 5. Available Filters (تغییر یافته 🔄)

**v1.0:**
```javascript
POST /api/search/filters/available

Response:
{
  "filters": {
    "disciplines": ["10M7g0", "10M7g1", ...],  // Tokens
    "geography": ["g0w900", ...]
  }
}
```

**v2.0:**
```javascript
GET /api/phd/filters/available

Response:
{
  "success": true,
  "data": {
    "disciplines": [
      { "discipline": "Computer Science", "count": 245 },
      { "discipline": "Engineering", "count": 189 }
    ],
    "countries": [
      { "country": "United Kingdom", "count": 1234 },
      { "country": "United States", "count": 567 }
    ],
    "fundingTypes": [
      { "funding_type": "Funded PhD Project", "count": 890 }
    ]
  }
}
```

**تفاوت‌ها:**
- ✅ نام‌های human-readable (نه token)
- ✅ شامل count هر فیلتر
- ✅ GET method به جای POST

---

### 6. Search History (حذف شده ❌)

**v1.0:**
```javascript
GET /api/search/history/:sessionId
```

**v2.0:**
```javascript
// History دیگر وجود نداره
// اگه نیازه، باید در سمت client ذخیره بشه
```

---

## 🆕 Endpoints جدید در v2.0

### 1. PhD Statistics
```javascript
GET /api/phd/stats/summary

Response:
{
  "success": true,
  "data": {
    "total": 3420,
    "active": 3250,
    "deleted": 170,
    "byCountry": [...],
    "byDiscipline": [...],
    "byFunding": [...],
    "latest": [...]
  }
}
```

### 2. Crawler Status
```javascript
GET /api/crawler/status

Response:
{
  "success": true,
  "data": {
    "crawler": {
      "isRunning": false,
      "currentLogId": 123,
      "stats": {...}
    },
    "scheduler": {
      "isRunning": true,
      "intervalHours": 1,
      "nextRun": "2025-11-11T13:00:00Z"
    },
    "latestRun": {
      "id": 123,
      "started_at": "...",
      "completed_at": "...",
      "total_found": 3420,
      "duration_seconds": 1850
    }
  }
}
```

### 3. Crawler Admin
```javascript
// اجرای دستی crawler
POST /api/crawler/trigger

// تغییر interval
PUT /api/crawler/settings/interval
{
  "hours": 2
}

// فعال/غیرفعال کردن
PUT /api/crawler/settings/toggle
{
  "enabled": false
}

// لاگ‌های crawler
GET /api/crawler/logs
GET /api/crawler/logs/:id

// آمار crawler
GET /api/crawler/stats

// Events real-time
GET /api/crawler/events
```

---

## 💻 مثال‌های Migration کد

### React/JavaScript

**v1.0:**
```javascript
// کد قدیمی
class PhDSearch {
  async search(keywords) {
    // 1. ایجاد session
    const sessionRes = await fetch('/api/session', {
      method: 'POST',
      body: JSON.stringify({ userId: this.userId })
    });
    const { data: { sessionId } } = await sessionRes.json();
    
    // 2. جستجو
    const searchRes = await fetch('/api/search', {
      method: 'POST',
      body: JSON.stringify({
        userId: this.userId,
        sessionId,
        keywords,
        filters: { discipline: '10M7g0' }  // Token!
      })
    });
    const { data } = await searchRes.json();
    
    return data.results;
  }
}
```

**v2.0:**
```javascript
// کد جدید (خیلی ساده‌تر!)
class PhDSearch {
  async search(keywords, filters = {}) {
    const params = new URLSearchParams({
      keywords,
      ...filters,
      page: 1,
      limit: 20
    });
    
    const res = await fetch(`/api/phd/search?${params}`);
    const { data } = await res.json();
    
    return data.results;
  }
}

// استفاده
const search = new PhDSearch();
const results = await search.search('machine learning', {
  discipline: 'Computer Science',  // Human-readable!
  country: 'United Kingdom'
});
```

---

### Python

**v1.0:**
```python
# کد قدیمی
import requests

class PhDSearch:
    def search(self, keywords):
        # ایجاد session
        session_res = requests.post('http://api/session', json={
            'userId': self.user_id
        })
        session_id = session_res.json()['data']['sessionId']
        
        # جستجو
        search_res = requests.post('http://api/search', json={
            'userId': self.user_id,
            'sessionId': session_id,
            'keywords': keywords,
            'filters': {'discipline': '10M7g0'}
        })
        
        return search_res.json()['data']['results']
```

**v2.0:**
```python
# کد جدید
import requests

class PhDSearch:
    def search(self, keywords, **filters):
        params = {
            'keywords': keywords,
            'page': 1,
            'limit': 20,
            **filters
        }
        
        res = requests.get('http://api/phd/search', params=params)
        return res.json()['data']['results']

# استفاده
search = PhDSearch()
results = search.search('machine learning', 
                       discipline='Computer Science',
                       country='United Kingdom')
```

---

## 🔧 تغییرات Backend

### نصب Dependencies جدید
```bash
npm install better-sqlite3 pg node-cron
```

### تغییر در package.json
```json
{
  "version": "2.0.0",
  "main": "src/api/server-new.js",
  "scripts": {
    "start": "node src/api/server-new.js",
    "dev": "nodemon src/api/server-new.js"
  }
}
```

### Environment Variables
```bash
# جدید در v2.0
DB_TYPE=sqlite
SQLITE_PATH=./data/findaphd.db
CRAWLER_INTERVAL_HOURS=1
```

---

## ⚠️ Breaking Changes

### 1. Session Management حذف شده
- **تأثیر**: تمام کدهایی که از session استفاده می‌کردند باید تغییر کنند
- **راه‌حل**: حذف کدهای مربوط به session

### 2. Token-based Filters حذف شده
- **تأثیر**: فیلترهای با format `10M7g0` دیگر کار نمی‌کنند
- **راه‌حل**: استفاده از نام‌های human-readable مثل `"Computer Science"`

### 3. searchId دیگر وجود نداره
- **تأثیر**: نمی‌تونید با searchId نتایج رو دوباره بگیرید
- **راه‌حل**: استفاده از PhD ID برای دریافت جزئیات

### 4. Real-time Crawling حذف شده
- **تأثیر**: داده‌ها تا 1 ساعت قدیمی می‌تونن باشن
- **راه‌حل**: اگه نیاز به real-time هست، crawler interval رو کاهش بدین

---

## 🎯 Migration Step by Step

### مرحله 1: نصب نسخه جدید
```bash
git checkout v2.0
npm install
```

### مرحله 2: اجرای تست‌ها
```bash
npm run test:db
npm run test:crawler
```

### مرحله 3: اجرای سرور
```bash
npm start
```

### مرحله 4: تست API ها
```bash
# تست health
curl http://localhost:3000/api/health

# تست search
curl "http://localhost:3000/api/phd/search?keywords=AI"

# تست crawler status
curl http://localhost:3000/api/crawler/status
```

### مرحله 5: آپدیت کد Client
- حذف session management
- تغییر endpoints
- تغییر filter format

### مرحله 6: Monitoring
- چک کردن crawler logs
- مانیتور کردن database size
- بررسی performance

---

## 📊 Comparison Table

| ویژگی | v1.0 | v2.0 |
|-------|------|------|
| Response Time | 10-15s | <50ms |
| Concurrent Users | Limited (100) | Unlimited |
| Data Freshness | Real-time | 1 hour |
| Session Management | Required | Not needed |
| Filter Format | Tokens | Human-readable |
| Database | None | SQLite/PostgreSQL |
| Crawler | On-demand | Background scheduled |
| Memory Usage | 256MB | 128MB |
| Complexity | Medium | High |

---

## 🆘 Troubleshooting

### مشکل: API خطای 301 میده
```
"This endpoint has moved"
```
**راه‌حل**: endpoints رو به فرمت جدید تغییر بدین (`/api/phd/search` به جای `/api/search`)

### مشکل: فیلترها کار نمی‌کنن
**راه‌حل**: از نام‌های human-readable استفاده کنین نه token ها

### مشکل: داده‌ها قدیمی هستند
**راه‌حل**: 
```bash
# اجرای دستی crawler
curl -X POST http://localhost:3000/api/crawler/trigger
```

### مشکل: Database خالی است
**راه‌حل**: صبر کنید تا crawler اولین بار اجرا بشه (ممکنه 30-60 دقیقه طول بکشه)

---

## 📚 منابع

- [README-V2.md](../README-V2.md) - راهنمای کامل v2.0
- [NEW-ARCHITECTURE.md](./architecture/NEW-ARCHITECTURE.md) - جزئیات معماری
- [Swagger UI](http://localhost:3000/api-docs) - مستندات API

---

**موفق باشید! 🚀**

