# 📚 راهنمای کامل Swagger و استفاده از API

## فهرست محتوا
1. [مقدمه](#مقدمه)
2. [دسترسی به Swagger UI](#دسترسی-به-swagger-ui)
3. [راهنمای استفاده از Swagger UI](#راهنمای-استفاده-از-swagger-ui)
4. [نحوه تست API از طریق Swagger](#نحوه-تست-api-از-طریق-swagger)
5. [فایل JSON کانفیگ](#فایل-json-کانفیگ)
6. [مثال‌های عملی](#مثالهای-عملی)
7. [استفاده از OpenAPI Spec](#استفاده-از-openapi-spec)
8. [تولید کد Client](#تولید-کد-client)

---

## مقدمه

### Swagger چیست؟
**Swagger** یک ابزار قدرتمند برای مستندسازی، تست و توسعه API است که بر اساس استاندارد **OpenAPI Specification 3.0** کار می‌کند.

### مزایای استفاده از Swagger:
- ✅ **مستندسازی خودکار**: نیازی به نوشتن مستندات جداگانه نیست
- ✅ **تست تعاملی**: می‌توانید مستقیماً از داخل مرورگر API را تست کنید
- ✅ **تولید کد**: امکان تولید کد Client در زبان‌های مختلف
- ✅ **استاندارد جهانی**: قابل استفاده در تمام ابزارهای OpenAPI
- ✅ **مشاهده Schema**: دیدن دقیق ساختار Request/Response

---

## دسترسی به Swagger UI

### 1. راه‌اندازی سرور

```bash
# نصب Dependencies (اگر قبلاً نصب نکرده‌اید)
npm install

# اجرای سرور
node src/api/server.js
```

خروجی موفق:
```
============================================================
✓ FindAPhD API Server running on port 3001
✓ Browser pool initialized with max 100 tabs

📚 Documentation URLs:
   • Swagger UI:    http://91.99.13.17/api-docs
   • API Info:      http://91.99.13.17/
   • Health Check:  http://91.99.13.17/api/health
============================================================
```

### 2. باز کردن Swagger UI

مرورگر خود را باز کنید و به آدرس زیر بروید:

```
http://91.99.13.17/api-docs
```

شما یک رابط کاربری زیبا خواهید دید که تمام endpoint های API را نمایش می‌دهد.

---

## راهنمای استفاده از Swagger UI

### نمای کلی Swagger UI

```
┌─────────────────────────────────────────────────────────┐
│  FindAPhD Search API                            v1.0.0  │
├─────────────────────────────────────────────────────────┤
│  دسترسی کامل به جستجوی موقعیت‌های دکترا از             │
│  FindAPhD.com از طریق RESTful API                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Servers:                                               │
│  ▼ http://91.99.13.17/api  [Development Server]     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [ Health ] وضعیت و سلامت سرویس                        │
│  ▼ GET  /health       بررسی وضعیت کلی سرویس            │
│  ▼ GET  /health/ready بررسی آماده بودن                │
├─────────────────────────────────────────────────────────┤
│  [ Session ] مدیریت Session کاربران                   │
│  ▼ POST   /session                ایجاد session جدید   │
│  ▼ GET    /session/{sessionId}    دریافت اطلاعات       │
│  ▼ DELETE /session/{sessionId}    حذف session          │
│  ▼ GET    /session/user/{userId}  لیست sessions        │
├─────────────────────────────────────────────────────────┤
│  [ Search ] عملیات جستجو و دریافت نتایج               │
│  ▼ POST /search                   جستجوی جدید          │
│  ▼ GET  /search/{searchId}        دریافت نتایج         │
│  ▼ POST /search/{searchId}/continue  ادامه جستجو       │
│  ▼ GET  /search/history/{sessionId}  تاریخچه           │
│  ▼ POST /search/filters/available    لیست فیلترها      │
└─────────────────────────────────────────────────────────┘
```

### المان‌های کلیدی

1. **Tag Groups**: دسته‌بندی endpoint ها (Health, Session, Search)
2. **HTTP Method**: نوع درخواست (GET, POST, DELETE)
3. **Endpoint Path**: مسیر API
4. **Try it out**: دکمه برای تست تعاملی
5. **Parameters**: پارامترهای ورودی
6. **Request Body**: بدنه درخواست (برای POST)
7. **Responses**: نمونه پاسخ‌های ممکن

---

## نحوه تست API از طریق Swagger

### مثال 1: بررسی وضعیت سلامت سرویس

#### گام 1: انتخاب Endpoint
کلیک روی `GET /health` در بخش **Health**

#### گام 2: باز کردن جزئیات
روی endpoint کلیک کنید تا باز شود:

```
▼ GET /health
  بررسی وضعیت کلی سرویس
  
  دریافت اطلاعات کامل وضعیت سرویس، browser pool، 
  sessions و مصرف حافظه
```

#### گام 3: اجرای تست
1. روی دکمه **"Try it out"** کلیک کنید
2. روی دکمه آبی **"Execute"** کلیک کنید

#### گام 4: مشاهده نتیجه

**Request URL:**
```
http://91.99.13.17/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-05T12:00:00.000Z",
  "uptime": 3600,
  "browser": {
    "maxTabs": 100,
    "activeTabs": 0,
    "activeSessions": 0,
    "queueLength": 0,
    "availableTabs": 100
  },
  "sessions": {
    "totalSessions": 0,
    "totalUsers": 0,
    "activeSessions": 0
  },
  "memory": {
    "used": 256,
    "total": 512
  }
}
```

---

### مثال 2: ایجاد Session جدید

#### گام 1: باز کردن Endpoint
`POST /session` در بخش **Session**

#### گام 2: تنظیم Request Body
1. کلیک روی **"Try it out"**
2. در قسمت **Request Body** کد زیر را وارد کنید:

```json
{
  "userId": "user-123-test"
}
```

#### گام 3: اجرا
کلیک روی **"Execute"**

#### گام 4: ذخیره sessionId
از پاسخ دریافتی، `sessionId` را کپی کنید:

```json
{
  "success": true,
  "data": {
    "sessionId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
    "userId": "user-123-test",
    "createdAt": 1696512000000
  }
}
```

---

### مثال 3: انجام جستجو

#### گام 1: باز کردن Endpoint
`POST /search` در بخش **Search**

#### گام 2: انتخاب Example
Swagger UI سه مثال آماده دارد:

**1. Simple (جستجوی ساده):**
```json
{
  "userId": "user-123",
  "keywords": "artificial intelligence",
  "page": 1
}
```

**2. With Filters (با فیلتر):**
```json
{
  "userId": "user-123",
  "sessionId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
  "keywords": "machine learning",
  "filters": {
    "discipline": "10M7g0",
    "geography": ["g0w900"],
    "funding": ["01M0"]
  },
  "page": 1
}
```

**3. Complex Search (جستجوی پیشرفته):**
```json
{
  "userId": "user-123",
  "sessionId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
  "keywords": "quantum computing",
  "filters": {
    "discipline": "10M7g0",
    "subject": "30M7g2t1",
    "geography": ["g0w900", "g0Mw00"],
    "funding": ["01M0", "0100"]
  },
  "page": 1
}
```

#### گام 3: اجرا و دریافت نتیجه
```json
{
  "success": true,
  "sessionId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
  "searchId": "search-x1y2z3",
  "status": "completed",
  "data": {
    "id": "search-x1y2z3",
    "query": "machine learning",
    "filters": {
      "discipline": "10M7g0",
      "geography": ["g0w900"],
      "funding": ["01M0"]
    },
    "status": "completed",
    "currentPage": 1,
    "totalPages": 15,
    "results": [
      {
        "title": "PhD in Deep Learning for Healthcare",
        "url": "https://findaphd.com/...",
        "institution": "University of Oxford",
        "location": "Oxford, UK",
        "discipline": "Computer Science",
        "funding": "Fully Funded",
        "publishedDate": "2025-10-01",
        "description": "...",
        "position": 1
      }
      // ... more results
    ],
    "fromCache": false,
    "createdAt": 1696512100000,
    "updatedAt": 1696512115000
  }
}
```

---

### مثال 4: دریافت صفحه بعدی

#### استفاده از Continue
`POST /search/{searchId}/continue`

**Parameters:**
- `searchId`: شناسه جستجوی قبلی

**Request Body:**
```json
{
  "sessionId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
  "page": 2
}
```

---

## فایل JSON کانفیگ

### مکان فایل
```
get-phd/
└── swagger.json
```

### محتوای فایل کانفیگ

فایل `swagger.json` شامل کل مشخصات OpenAPI 3.0.0 است:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "FindAPhD Search API",
    "version": "1.0.0",
    "description": "دسترسی کامل به جستجوی موقعیت‌های دکترا",
    "contact": {
      "name": "API Support",
      "email": "support@example.com"
    }
  },
  "servers": [
    {
      "url": "http://91.99.13.17/api",
      "description": "Development Server"
    },
    {
      "url": "https://api.yourdomain.com/api",
      "description": "Production Server"
    }
  ],
  "paths": { ... },
  "components": {
    "schemas": { ... }
  }
}
```

### کاربردهای فایل JSON

#### 1. استفاده در Postman
```bash
# وارد کردن در Postman:
1. باز کردن Postman
2. Import → Upload Files
3. انتخاب swagger.json
4. تبدیل به Postman Collection
```

#### 2. تولید کد Client
```bash
# نصب Swagger Codegen
npm install -g swagger-codegen

# تولید کد JavaScript
swagger-codegen generate -i swagger.json -l javascript -o ./client

# تولید کد Python
swagger-codegen generate -i swagger.json -l python -o ./python-client

# تولید کد Java
swagger-codegen generate -i swagger.json -l java -o ./java-client
```

#### 3. استفاده در Swagger Editor
1. باز کردن https://editor.swagger.io/
2. File → Import file
3. انتخاب `swagger.json`
4. ویرایش آنلاین و مشاهده تغییرات

#### 4. استفاده در VSCode
```bash
# نصب Extension
1. باز کردن VSCode
2. Extensions → جستجوی "OpenAPI (Swagger) Editor"
3. نصب extension
4. باز کردن swagger.json
5. مشاهده پیش‌نمایش با Ctrl+Shift+P → "OpenAPI: Show Preview"
```

---

## مثال‌های عملی

### جستجوی کامل با JavaScript

```javascript
// 1. ایجاد Session
async function createSession(userId) {
  const response = await fetch('http://91.99.13.17/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  const data = await response.json();
  return data.data.sessionId;
}

// 2. انجام جستجو
async function performSearch(sessionId, keywords, filters = {}) {
  const response = await fetch('http://91.99.13.17/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'user-123',
      sessionId,
      keywords,
      filters,
      page: 1
    })
  });
  const data = await response.json();
  return data;
}

// 3. دریافت صفحات بعدی
async function getNextPage(searchId, sessionId, page) {
  const response = await fetch(
    `http://91.99.13.17/api/search/${searchId}/continue`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, page })
    }
  );
  return await response.json();
}

// استفاده:
async function main() {
  // ایجاد session
  const sessionId = await createSession('user-123');
  console.log('Session created:', sessionId);

  // جستجو
  const searchResult = await performSearch(
    sessionId,
    'artificial intelligence',
    {
      discipline: '10M7g0',
      geography: ['g0w900'],
      funding: ['01M0']
    }
  );
  
  console.log(`Found ${searchResult.data.results.length} results`);
  console.log(`Total pages: ${searchResult.data.totalPages}`);

  // دریافت صفحه 2
  if (searchResult.data.totalPages > 1) {
    const page2 = await getNextPage(
      searchResult.searchId,
      sessionId,
      2
    );
    console.log(`Page 2 has ${page2.data.results.length} results`);
  }
}

main();
```

---

### استفاده با Python

```python
import requests
import json

BASE_URL = 'http://91.99.13.17/api'

class FindAPhDClient:
    def __init__(self, user_id):
        self.user_id = user_id
        self.session_id = None
        self.base_url = BASE_URL
    
    def create_session(self):
        """ایجاد session جدید"""
        response = requests.post(
            f'{self.base_url}/session',
            json={'userId': self.user_id}
        )
        data = response.json()
        self.session_id = data['data']['sessionId']
        return self.session_id
    
    def search(self, keywords, filters=None, page=1):
        """انجام جستجو"""
        payload = {
            'userId': self.user_id,
            'sessionId': self.session_id,
            'keywords': keywords,
            'page': page
        }
        if filters:
            payload['filters'] = filters
        
        response = requests.post(
            f'{self.base_url}/search',
            json=payload
        )
        return response.json()
    
    def continue_search(self, search_id, page):
        """ادامه جستجو (صفحه بعدی)"""
        response = requests.post(
            f'{self.base_url}/search/{search_id}/continue',
            json={
                'sessionId': self.session_id,
                'page': page
            }
        )
        return response.json()
    
    def get_history(self):
        """دریافت تاریخچه جستجوها"""
        response = requests.get(
            f'{self.base_url}/search/history/{self.session_id}'
        )
        return response.json()

# استفاده:
if __name__ == '__main__':
    # ایجاد client
    client = FindAPhDClient('user-python-test')
    
    # ایجاد session
    session_id = client.create_session()
    print(f'Session created: {session_id}')
    
    # جستجو
    result = client.search(
        keywords='machine learning',
        filters={
            'discipline': '10M7g0',
            'geography': ['g0w900']
        }
    )
    
    print(f"Found {len(result['data']['results'])} results")
    print(f"Total pages: {result['data']['totalPages']}")
    
    # نمایش اولین نتیجه
    if result['data']['results']:
        first = result['data']['results'][0]
        print(f"\nFirst result:")
        print(f"  Title: {first['title']}")
        print(f"  Institution: {first['institution']}")
        print(f"  Location: {first['location']}")
        print(f"  URL: {first['url']}")
```

---

### استفاده با cURL

```bash
# 1. ایجاد Session
curl -X POST http://91.99.13.17/api/session \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-curl-test"}'

# پاسخ:
# {
#   "success": true,
#   "data": {
#     "sessionId": "abc-123-def-456",
#     "userId": "user-curl-test",
#     "createdAt": 1696512000000
#   }
# }

# 2. جستجو
SESSION_ID="abc-123-def-456"

curl -X POST http://91.99.13.17/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-curl-test",
    "sessionId": "'$SESSION_ID'",
    "keywords": "deep learning",
    "filters": {
      "discipline": "10M7g0",
      "geography": ["g0w900"]
    },
    "page": 1
  }'

# 3. دریافت نتیجه
SEARCH_ID="search-xyz-789"

curl "http://91.99.13.17/api/search/${SEARCH_ID}?sessionId=${SESSION_ID}"

# 4. صفحه بعدی
curl -X POST "http://91.99.13.17/api/search/${SEARCH_ID}/continue" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "'$SESSION_ID'",
    "page": 2
  }'

# 5. مشاهده تاریخچه
curl "http://91.99.13.17/api/search/history/${SESSION_ID}"

# 6. حذف Session
curl -X DELETE "http://91.99.13.17/api/session/${SESSION_ID}"
```

---

## استفاده از OpenAPI Spec

### در Insomnia
```bash
1. باز کردن Insomnia
2. Application → Preferences → Data
3. Import Data → From File
4. انتخاب swagger.json
5. نوع "OpenAPI 3.0" را انتخاب کنید
```

### در Swagger Hub
```bash
1. ثبت‌نام در https://app.swaggerhub.com/
2. Create New → Import
3. آپلود swagger.json
4. مستندات آنلاین شما آماده است
```

### در ReDoc
```bash
# نصب redoc-cli
npm install -g redoc-cli

# تولید HTML استاتیک
redoc-cli bundle swagger.json -o docs.html

# مشاهده
# فایل docs.html را در مرورگر باز کنید
```

---

## تولید کد Client

### JavaScript/Node.js Client

```bash
# نصب OpenAPI Generator
npm install @openapitools/openapi-generator-cli -g

# تولید Client
openapi-generator-cli generate \
  -i swagger.json \
  -g javascript \
  -o ./generated-client
```

استفاده از Client تولید شده:

```javascript
const FindAPhDAPI = require('./generated-client');

const api = new FindAPhDAPI.SearchApi();
const sessionApi = new FindAPhDAPI.SessionApi();

// ایجاد session
sessionApi.createSession({ userId: 'user-123' })
  .then(session => {
    console.log('Session:', session.data.sessionId);
    
    // جستجو
    return api.performSearch({
      userId: 'user-123',
      sessionId: session.data.sessionId,
      keywords: 'AI',
      page: 1
    });
  })
  .then(results => {
    console.log('Results:', results.data.results.length);
  });
```

---

### TypeScript Client

```bash
# تولید TypeScript Client
openapi-generator-cli generate \
  -i swagger.json \
  -g typescript-axios \
  -o ./ts-client

# استفاده
cd ts-client
npm install
npm run build
```

```typescript
import { 
  SearchApi, 
  SessionApi, 
  Configuration 
} from './ts-client';

const config = new Configuration({
  basePath: 'http://91.99.13.17/api'
});

const searchApi = new SearchApi(config);
const sessionApi = new SessionApi(config);

async function main() {
  // ایجاد session
  const session = await sessionApi.createSession({
    userId: 'user-ts'
  });
  
  // جستجو
  const results = await searchApi.performSearch({
    userId: 'user-ts',
    sessionId: session.data.data.sessionId,
    keywords: 'quantum computing',
    page: 1
  });
  
  console.log(`Found ${results.data.data.results.length} results`);
}

main();
```

---

## نکات مهم

### 1. Environment Variables
برای استفاده در محیط‌های مختلف:

```javascript
// .env.development
API_BASE_URL=http://91.99.13.17/api

// .env.production
API_BASE_URL=https://api.yourdomain.com/api
```

### 2. Error Handling
```javascript
async function safeApiCall(apiFunction) {
  try {
    const result = await apiFunction();
    return { success: true, data: result };
  } catch (error) {
    if (error.response) {
      // خطای HTTP
      return {
        success: false,
        error: error.response.data.error,
        status: error.response.status
      };
    } else if (error.request) {
      // بدون پاسخ
      return {
        success: false,
        error: 'No response from server'
      };
    } else {
      // خطای دیگر
      return {
        success: false,
        error: error.message
      };
    }
  }
}
```

### 3. Rate Limiting
API محدودیت تعداد تب‌های همزمان دارد (100 تب):

```javascript
// چک کردن وضعیت قبل از جستجو
async function checkAvailability() {
  const health = await fetch('http://91.99.13.17/api/health/ready');
  const data = await health.json();
  
  if (!data.ready) {
    console.log('Service is busy, please wait...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    return checkAvailability();
  }
  
  return true;
}
```

---

## خلاصه دستورات سریع

```bash
# 1. راه‌اندازی سرور
node src/api/server.js

# 2. دسترسی به Swagger UI
# مرورگر: http://91.99.13.17/api-docs

# 3. تست سریع با curl
curl http://91.99.13.17/api/health

# 4. تولید Python Client
openapi-generator-cli generate -i swagger.json -g python -o ./python-client

# 5. ایمپورت در Postman
# Import → Upload Files → swagger.json

# 6. مشاهده در Swagger Editor
# https://editor.swagger.io/ → Import → swagger.json
```

---

## پشتیبانی و منابع

### لینک‌های مفید:
- **OpenAPI Specification**: https://swagger.io/specification/
- **Swagger UI**: https://swagger.io/tools/swagger-ui/
- **OpenAPI Generator**: https://openapi-generator.tech/
- **Swagger Editor**: https://editor.swagger.io/

### راه‌های ارتباطی:
- **Issues**: GitHub Repository Issues
- **Documentation**: `docs/` folder in project
- **Examples**: `tests/` folder for practical examples

---

**🎉 حالا API شما کاملاً مستند شده و آماده استفاده است!**
