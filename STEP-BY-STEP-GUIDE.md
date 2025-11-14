# 📖 راهنمای گام‌به‌گام استفاده از API

> **راهنمای کامل برای انجام جستجو و دریافت اطلاعات PhD به ترتیب**

---

## 🎯 فلوچارت کلی

```
1. بررسی سلامت سرویس (اختیاری)
        ↓
2. ایجاد Session
        ↓
3. انجام جستجو (صفحه اول)
        ↓
4. دریافت نتایج
        ↓
5. ادامه جستجو (صفحات بعدی) - در صورت نیاز
        ↓
6. مشاهده تاریخچه جستجوها (اختیاری)
        ↓
7. حذف Session (اختیاری)
```

---

## 📋 مراحل تفصیلی

### مرحله 0: بررسی سلامت سرویس (اختیاری اما توصیه می‌شود)

**چرا؟** اطمینان حاصل می‌کنیم که سرویس آماده پردازش درخواست است.

#### درخواست:
```http
GET http://91.99.13.17:3001/api/health
```

#### پاسخ موفق:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-05T12:00:00.000Z",
  "uptime": 3600,
  "browser": {
    "maxTabs": 100,
    "activeTabs": 0,
    "availableTabs": 100,
    "queueLength": 0
  },
  "sessions": {
    "totalSessions": 0,
    "totalUsers": 0
  },
  "memory": {
    "used": 256,
    "total": 512
  }
}
```

#### چک کنید:
- ✅ `status: "healthy"`
- ✅ `availableTabs > 0`

#### مثال‌های کد:

**JavaScript:**
```javascript
const response = await fetch('http://91.99.13.17:3001/api/health');
const health = await response.json();

if (health.status !== 'healthy') {
  console.error('Service is not healthy!');
  return;
}

if (health.browser.availableTabs === 0) {
  console.log('No tabs available, please wait...');
  return;
}

console.log('✓ Service is ready!');
```

**Python:**
```python
import requests

response = requests.get('http://91.99.13.17:3001/api/health')
health = response.json()

if health['status'] != 'healthy':
    print('Service is not healthy!')
    exit()

if health['browser']['availableTabs'] == 0:
    print('No tabs available, please wait...')
    exit()

print('✓ Service is ready!')
```

**cURL:**
```bash
curl http://91.99.13.17:3001/api/health
```

---

### مرحله 1: ایجاد Session ⭐ (ضروری)

**چرا؟** Session به شما امکان می‌دهد:
- جستجوهای متعدد را مدیریت کنید
- تاریخچه جستجو داشته باشید
- state جستجوها را نگه دارید

#### درخواست:
```http
POST http://91.99.13.17:3001/api/session
Content-Type: application/json

{
  "userId": "user-123"
}
```

#### پارامترها:
- **userId** (ضروری): شناسه یکتای کاربر شما (string)

#### پاسخ موفق:
```json
{
  "success": true,
  "data": {
    "sessionId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
    "userId": "user-123",
    "createdAt": 1696512000000
  }
}
```

#### ⚠️ مهم:
**`sessionId` را ذخیره کنید!** این را در تمام درخواست‌های بعدی نیاز دارید.

#### مثال‌های کد:

**JavaScript:**
```javascript
async function createSession(userId) {
  const response = await fetch('http://91.99.13.17:3001/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  
  const result = await response.json();
  
  if (result.success) {
    const sessionId = result.data.sessionId;
    console.log('✓ Session created:', sessionId);
    return sessionId;
  } else {
    throw new Error('Failed to create session');
  }
}

// استفاده:
const sessionId = await createSession('user-123');
```

**Python:**
```python
import requests

def create_session(user_id):
    response = requests.post(
        'http://91.99.13.17:3001/api/session',
        json={'userId': user_id}
    )
    
    result = response.json()
    
    if result['success']:
        session_id = result['data']['sessionId']
        print(f'✓ Session created: {session_id}')
        return session_id
    else:
        raise Exception('Failed to create session')

# استفاده:
session_id = create_session('user-123')
```

**cURL:**
```bash
curl -X POST http://91.99.13.17:3001/api/session \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123"}'
```

---

### مرحله 2: انجام جستجو ⭐ (اصلی‌ترین مرحله)

**چرا؟** این مرحله جستجوی واقعی را انجام می‌دهد و نتایج PhD را برمی‌گرداند.

#### درخواست:
```http
POST http://91.99.13.17:3001/api/search
Content-Type: application/json

{
  "userId": "user-123",
  "sessionId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
  "keywords": "artificial intelligence",
  "filters": {
    "discipline": "10M7g0",
    "geography": ["g0w900"],
    "funding": ["01M0"]
  },
  "page": 1
}
```

#### پارامترها:

| پارامتر | ضروری؟ | نوع | توضیح |
|---------|---------|-----|-------|
| `userId` | ✅ بله | string | شناسه کاربر |
| `sessionId` | ⚠️ اختیاری* | string | شناسه session (اگر نباشد، خودکار ساخته می‌شود) |
| `keywords` | ❌ خیر | string | کلیدواژه جستجو |
| `filters` | ❌ خیر | object | فیلترهای جستجو |
| `page` | ❌ خیر | number | شماره صفحه (پیش‌فرض: 1) |

**توجه:** اگر `sessionId` ندهید، API خودکار یک session جدید می‌سازد.

#### فیلترهای موجود:

##### 🎓 Disciplines (رشته‌های تحصیلی):
```javascript
{
  "discipline": "10M7g0"  // Computer Science
}
```

**کدهای رایج:**
- `10M7g0` - Computer Science
- `10M7g1` - Engineering
- `10M7g2` - Medicine & Health Sciences
- `10M7g3` - Business & Management Studies
- `10M7g4` - Psychology

##### 🌍 Geography (مکان):
```javascript
{
  "geography": ["g0w900"]  // UK
}
```

**کدهای رایج:**
- `g0w900` - United Kingdom
- `g0Mw00` - United States
- `g0w800` - Australia
- `g0w700` - Canada
- `g0w600` - Germany

##### 💰 Funding (تامین مالی):
```javascript
{
  "funding": ["01M0"]  // Self-funded
}
```

**کدهای رایج:**
- `01M0` - Self-funded
- `0100` - Funded PhD Project (CASE)
- `0110` - Studentship

##### 📚 Subject (موضوع):
```javascript
{
  "subject": "30M7g2t1"  // AI
}
```

##### 🏢 Institution (موسسه):
```javascript
{
  "institution": "i0M200"  // مثال
}
```

#### پاسخ موفق:
```json
{
  "success": true,
  "sessionId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
  "searchId": "search-xyz-789",
  "status": "completed",
  "data": {
    "id": "search-xyz-789",
    "query": "artificial intelligence",
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
        "url": "https://www.findaphd.com/phds/project/...",
        "institution": "University of Oxford",
        "location": "Oxford, United Kingdom",
        "discipline": "Computer Science",
        "funding": "Fully Funded",
        "publishedDate": "2025-10-01",
        "description": "We are seeking a highly motivated...",
        "studyType": "Full-time",
        "position": 1
      },
      {
        "title": "AI for Climate Change Research",
        "url": "https://www.findaphd.com/phds/project/...",
        "institution": "University of Cambridge",
        "location": "Cambridge, United Kingdom",
        "discipline": "Computer Science",
        "funding": "Competition Funded",
        "publishedDate": "2025-09-28",
        "description": "Join our research team...",
        "studyType": "Full-time",
        "position": 2
      }
      // ... more results (معمولاً 10 تا در هر صفحه)
    ],
    "fromCache": false,
    "createdAt": 1696512100000,
    "updatedAt": 1696512115000
  }
}
```

#### ⚠️ مهم:
**`searchId` را ذخیره کنید!** برای دریافت نتایج یا ادامه جستجو نیاز دارید.

#### مثال‌های کد:

**JavaScript (ساده):**
```javascript
async function performSearch(sessionId, keywords, filters = {}) {
  const response = await fetch('http://91.99.13.17:3001/api/search', {
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
  
  const result = await response.json();
  
  if (result.success) {
    console.log(`✓ Found ${result.data.results.length} results`);
    console.log(`Total pages: ${result.data.totalPages}`);
    return result;
  } else {
    throw new Error('Search failed');
  }
}

// استفاده:
const searchResult = await performSearch(
  sessionId,
  'machine learning',
  {
    discipline: '10M7g0',
    geography: ['g0w900']
  }
);

console.log('Search ID:', searchResult.searchId);
console.log('First result:', searchResult.data.results[0]);
```

**JavaScript (کامل):**
```javascript
async function searchPhD(sessionId, options) {
  const {
    keywords = '',
    discipline = null,
    geography = [],
    funding = [],
    subject = null,
    page = 1
  } = options;

  const filters = {};
  if (discipline) filters.discipline = discipline;
  if (geography.length > 0) filters.geography = geography;
  if (funding.length > 0) filters.funding = funding;
  if (subject) filters.subject = subject;

  const response = await fetch('http://91.99.13.17:3001/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'user-123',
      sessionId,
      keywords,
      filters,
      page
    })
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error('Search failed');
  }

  return {
    searchId: result.searchId,
    totalPages: result.data.totalPages,
    currentPage: result.data.currentPage,
    results: result.data.results.map(phd => ({
      title: phd.title,
      institution: phd.institution,
      location: phd.location,
      url: phd.url,
      funding: phd.funding,
      description: phd.description
    }))
  };
}

// استفاده:
const results = await searchPhD(sessionId, {
  keywords: 'quantum computing',
  discipline: '10M7g0', // Computer Science
  geography: ['g0w900', 'g0Mw00'], // UK & USA
  funding: ['0100', '0110'] // Funded projects only
});

console.log(`Found ${results.results.length} PhDs`);
results.results.forEach((phd, index) => {
  console.log(`${index + 1}. ${phd.title}`);
  console.log(`   ${phd.institution}, ${phd.location}`);
  console.log(`   Funding: ${phd.funding}`);
  console.log(`   URL: ${phd.url}`);
  console.log('');
});
```

**Python:**
```python
import requests

def perform_search(session_id, keywords, filters=None, page=1):
    payload = {
        'userId': 'user-123',
        'sessionId': session_id,
        'keywords': keywords,
        'page': page
    }
    
    if filters:
        payload['filters'] = filters
    
    response = requests.post(
        'http://91.99.13.17:3001/api/search',
        json=payload
    )
    
    result = response.json()
    
    if result['success']:
        print(f"✓ Found {len(result['data']['results'])} results")
        print(f"Total pages: {result['data']['totalPages']}")
        return result
    else:
        raise Exception('Search failed')

# استفاده:
search_result = perform_search(
    session_id,
    'machine learning',
    filters={
        'discipline': '10M7g0',
        'geography': ['g0w900']
    }
)

print('Search ID:', search_result['searchId'])
print('First result:', search_result['data']['results'][0]['title'])
```

**cURL:**
```bash
curl -X POST http://91.99.13.17:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "sessionId": "YOUR_SESSION_ID",
    "keywords": "artificial intelligence",
    "filters": {
      "discipline": "10M7g0",
      "geography": ["g0w900"]
    },
    "page": 1
  }'
```

---

### مرحله 3: دریافت نتایج جستجو (اختیاری)

**چرا؟** اگر می‌خواهید بعداً نتایج یک جستجوی قبلی را مشاهده کنید.

**توجه:** معمولاً نیازی به این مرحله نیست چون `POST /search` خودش نتایج را برمی‌گرداند.

#### درخواست:
```http
GET http://91.99.13.17:3001/api/search/{searchId}?sessionId={sessionId}
```

#### مثال:
```http
GET http://91.99.13.17:3001/api/search/search-xyz-789?sessionId=a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6
```

#### پاسخ:
مشابه پاسخ `POST /search`

#### مثال کد:

**JavaScript:**
```javascript
async function getSearchResults(searchId, sessionId) {
  const response = await fetch(
    `http://91.99.13.17:3001/api/search/${searchId}?sessionId=${sessionId}`
  );
  
  const result = await response.json();
  
  if (result.success) {
    return result.data;
  } else {
    throw new Error('Failed to get results');
  }
}

// استفاده:
const results = await getSearchResults('search-xyz-789', sessionId);
console.log(`Page ${results.currentPage} of ${results.totalPages}`);
```

**Python:**
```python
def get_search_results(search_id, session_id):
    response = requests.get(
        f'http://91.99.13.17:3001/api/search/{search_id}',
        params={'sessionId': session_id}
    )
    
    result = response.json()
    
    if result['success']:
        return result['data']
    else:
        raise Exception('Failed to get results')

# استفاده:
results = get_search_results('search-xyz-789', session_id)
print(f"Page {results['currentPage']} of {results['totalPages']}")
```

---

### مرحله 4: ادامه جستجو (صفحات بعدی) ⭐

**چرا؟** برای دریافت صفحه 2، 3، ... از نتایج جستجو.

#### درخواست:
```http
POST http://91.99.13.17:3001/api/search/{searchId}/continue
Content-Type: application/json

{
  "sessionId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
  "page": 2
}
```

#### پارامترها:
- **sessionId** (ضروری): شناسه session
- **page** (ضروری): شماره صفحه (2، 3، 4، ...)

#### پاسخ:
مشابه `POST /search` اما با نتایج صفحه جدید

#### مثال‌های کد:

**JavaScript:**
```javascript
async function getNextPage(searchId, sessionId, page) {
  const response = await fetch(
    `http://91.99.13.17:3001/api/search/${searchId}/continue`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, page })
    }
  );
  
  const result = await response.json();
  
  if (result.success) {
    console.log(`✓ Page ${page}: ${result.data.results.length} results`);
    return result.data;
  } else {
    throw new Error('Failed to get next page');
  }
}

// استفاده:
const page2 = await getNextPage(searchId, sessionId, 2);
const page3 = await getNextPage(searchId, sessionId, 3);
```

**JavaScript (دریافت تمام صفحات):**
```javascript
async function getAllPages(searchId, sessionId, startPage = 1) {
  const allResults = [];
  let currentPage = startPage;
  let totalPages = null;

  while (totalPages === null || currentPage <= totalPages) {
    console.log(`Fetching page ${currentPage}...`);
    
    const pageData = await getNextPage(searchId, sessionId, currentPage);
    
    if (totalPages === null) {
      totalPages = pageData.totalPages;
      console.log(`Total pages: ${totalPages}`);
    }
    
    allResults.push(...pageData.results);
    
    if (currentPage >= totalPages) {
      break;
    }
    
    currentPage++;
    
    // توقف کوتاه بین درخواست‌ها
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`✓ Total results collected: ${allResults.length}`);
  return allResults;
}

// استفاده:
const allPhDs = await getAllPages(searchId, sessionId);
console.log(`Found ${allPhDs.length} PhD positions in total`);
```

**Python:**
```python
def get_next_page(search_id, session_id, page):
    response = requests.post(
        f'http://91.99.13.17:3001/api/search/{search_id}/continue',
        json={'sessionId': session_id, 'page': page}
    )
    
    result = response.json()
    
    if result['success']:
        print(f"✓ Page {page}: {len(result['data']['results'])} results")
        return result['data']
    else:
        raise Exception('Failed to get next page')

# استفاده:
page_2 = get_next_page(search_id, session_id, 2)
page_3 = get_next_page(search_id, session_id, 3)
```

**Python (تمام صفحات):**
```python
import time

def get_all_pages(search_id, session_id, start_page=1):
    all_results = []
    current_page = start_page
    total_pages = None
    
    while total_pages is None or current_page <= total_pages:
        print(f'Fetching page {current_page}...')
        
        page_data = get_next_page(search_id, session_id, current_page)
        
        if total_pages is None:
            total_pages = page_data['totalPages']
            print(f'Total pages: {total_pages}')
        
        all_results.extend(page_data['results'])
        
        if current_page >= total_pages:
            break
        
        current_page += 1
        time.sleep(1)  # توقف کوتاه
    
    print(f'✓ Total results collected: {len(all_results)}')
    return all_results

# استفاده:
all_phds = get_all_pages(search_id, session_id)
print(f'Found {len(all_phds)} PhD positions in total')
```

---

### مرحله 5: مشاهده تاریخچه جستجوها (اختیاری)

**چرا؟** برای دیدن لیست تمام جستجوهای انجام شده در یک session.

#### درخواست:
```http
GET http://91.99.13.17:3001/api/search/history/{sessionId}
```

#### پاسخ:
```json
{
  "success": true,
  "data": [
    {
      "id": "search-xyz-789",
      "query": "artificial intelligence",
      "filters": { "discipline": "10M7g0" },
      "currentPage": 3,
      "totalPages": 15,
      "createdAt": 1696512100000
    },
    {
      "id": "search-abc-456",
      "query": "machine learning",
      "filters": { "geography": ["g0w900"] },
      "currentPage": 1,
      "totalPages": 8,
      "createdAt": 1696512500000
    }
  ]
}
```

#### مثال کد:

**JavaScript:**
```javascript
async function getSearchHistory(sessionId) {
  const response = await fetch(
    `http://91.99.13.17:3001/api/search/history/${sessionId}`
  );
  
  const result = await response.json();
  
  if (result.success) {
    console.log(`Found ${result.data.length} searches in history`);
    return result.data;
  } else {
    throw new Error('Failed to get history');
  }
}

// استفاده:
const history = await getSearchHistory(sessionId);
history.forEach(search => {
  console.log(`- "${search.query}" (${search.currentPage}/${search.totalPages} pages)`);
});
```

**Python:**
```python
def get_search_history(session_id):
    response = requests.get(
        f'http://91.99.13.17:3001/api/search/history/{session_id}'
    )
    
    result = response.json()
    
    if result['success']:
        print(f"Found {len(result['data'])} searches in history")
        return result['data']
    else:
        raise Exception('Failed to get history')

# استفاده:
history = get_search_history(session_id)
for search in history:
    print(f"- \"{search['query']}\" ({search['currentPage']}/{search['totalPages']} pages)")
```

---

### مرحله 6: دریافت فیلترهای موجود (اختیاری)

**چرا؟** برای دیدن لیست کامل تمام فیلترهای قابل استفاده.

#### درخواست:
```http
POST http://91.99.13.17:3001/api/search/filters/available
```

#### پاسخ:
```json
{
  "success": true,
  "data": {
    "disciplines": [
      {
        "token": "10M7g0",
        "name": "Computer Science",
        "slug": "computer-science"
      },
      {
        "token": "10M7g1",
        "name": "Engineering",
        "slug": "engineering"
      }
      // ... more
    ],
    "subjects": [
      {
        "token": "30M7g2t1",
        "name": "Artificial Intelligence",
        "slug": "artificial-intelligence"
      }
      // ... more
    ],
    "geographies": [
      {
        "token": "g0w900",
        "name": "United Kingdom",
        "slug": "united-kingdom"
      }
      // ... more
    ],
    "funding": [
      {
        "token": "01M0",
        "name": "Self-funded",
        "slug": "self-funded"
      }
      // ... more
    ]
  }
}
```

#### مثال کد:

**JavaScript:**
```javascript
async function getAvailableFilters() {
  const response = await fetch(
    'http://91.99.13.17:3001/api/search/filters/available',
    { method: 'POST' }
  );
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Available filters:');
    console.log(`- ${result.data.disciplines.length} disciplines`);
    console.log(`- ${result.data.subjects.length} subjects`);
    console.log(`- ${result.data.geographies.length} geographies`);
    console.log(`- ${result.data.funding.length} funding types`);
    return result.data;
  }
}

// استفاده:
const filters = await getAvailableFilters();
console.log('First discipline:', filters.disciplines[0]);
```

---

### مرحله 7: حذف Session (اختیاری)

**چرا؟** برای آزاد کردن منابع وقتی کار تمام شد.

#### درخواست:
```http
DELETE http://91.99.13.17:3001/api/session/{sessionId}
```

#### پاسخ:
```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

#### مثال کد:

**JavaScript:**
```javascript
async function deleteSession(sessionId) {
  const response = await fetch(
    `http://91.99.13.17:3001/api/session/${sessionId}`,
    { method: 'DELETE' }
  );
  
  const result = await response.json();
  
  if (result.success) {
    console.log('✓ Session deleted');
  }
}

// استفاده:
await deleteSession(sessionId);
```

**Python:**
```python
def delete_session(session_id):
    response = requests.delete(
        f'http://91.99.13.17:3001/api/session/{session_id}'
    )
    
    result = response.json()
    
    if result['success']:
        print('✓ Session deleted')

# استفاده:
delete_session(session_id)
```

---

## 🎯 مثال کامل: از ابتدا تا انتها

### JavaScript (Complete Flow):

```javascript
const fetch = require('node-fetch');

class PhDSearchClient {
  constructor(baseUrl = 'http://91.99.13.17:3001/api') {
    this.baseUrl = baseUrl;
    this.userId = `user-${Date.now()}`;
    this.sessionId = null;
  }

  // 0. چک سلامت
  async checkHealth() {
    const response = await fetch(`${this.baseUrl.replace('/api', '')}/api/health`);
    const health = await response.json();
    
    if (health.status !== 'healthy') {
      throw new Error('Service is not healthy');
    }
    
    if (health.browser.availableTabs === 0) {
      throw new Error('No browser tabs available');
    }
    
    console.log('✓ Service is healthy');
    return health;
  }

  // 1. ایجاد session
  async createSession() {
    const response = await fetch(`${this.baseUrl}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: this.userId })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to create session');
    }
    
    this.sessionId = result.data.sessionId;
    console.log('✓ Session created:', this.sessionId);
    return this.sessionId;
  }

  // 2. جستجو
  async search(keywords, filters = {}, page = 1) {
    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: this.userId,
        sessionId: this.sessionId,
        keywords,
        filters,
        page
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Search failed');
    }
    
    console.log(`✓ Search completed: ${result.data.results.length} results`);
    console.log(`  Total pages: ${result.data.totalPages}`);
    
    return {
      searchId: result.searchId,
      data: result.data
    };
  }

  // 3. صفحه بعدی
  async continueSearch(searchId, page) {
    const response = await fetch(
      `${this.baseUrl}/search/${searchId}/continue`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          page
        })
      }
    );
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to continue search');
    }
    
    console.log(`✓ Page ${page}: ${result.data.results.length} results`);
    return result.data;
  }

  // 4. تمام صفحات
  async getAllResults(searchId, maxPages = null) {
    const firstPage = await this.continueSearch(searchId, 1);
    const allResults = [...firstPage.results];
    const totalPages = maxPages || firstPage.totalPages;
    
    for (let page = 2; page <= totalPages; page++) {
      const pageData = await this.continueSearch(searchId, page);
      allResults.push(...pageData.results);
      
      // توقف کوتاه
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`✓ Collected ${allResults.length} total results`);
    return allResults;
  }

  // 5. تاریخچه
  async getHistory() {
    const response = await fetch(
      `${this.baseUrl}/search/history/${this.sessionId}`
    );
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to get history');
    }
    
    console.log(`✓ History: ${result.data.length} searches`);
    return result.data;
  }

  // 6. حذف session
  async cleanup() {
    if (!this.sessionId) return;
    
    const response = await fetch(
      `${this.baseUrl}/session/${this.sessionId}`,
      { method: 'DELETE' }
    );
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✓ Session deleted');
    }
  }
}

// استفاده کامل:
async function main() {
  const client = new PhDSearchClient();
  
  try {
    // 0. چک سلامت
    await client.checkHealth();
    
    // 1. ایجاد session
    await client.createSession();
    
    // 2. جستجوی اول
    const search1 = await client.search(
      'artificial intelligence',
      {
        discipline: '10M7g0', // Computer Science
        geography: ['g0w900'] // UK
      }
    );
    
    console.log('\nFirst 3 results:');
    search1.data.results.slice(0, 3).forEach((phd, i) => {
      console.log(`${i + 1}. ${phd.title}`);
      console.log(`   ${phd.institution}`);
      console.log(`   ${phd.url}\n`);
    });
    
    // 3. صفحه دوم
    if (search1.data.totalPages > 1) {
      const page2 = await client.continueSearch(search1.searchId, 2);
      console.log(`\nPage 2 first result: ${page2.results[0].title}`);
    }
    
    // 4. جستجوی دوم
    const search2 = await client.search(
      'machine learning',
      {
        discipline: '10M7g0',
        funding: ['0100', '0110'] // Funded only
      }
    );
    
    console.log(`\n✓ Second search: ${search2.data.results.length} funded positions`);
    
    // 5. مشاهده تاریخچه
    const history = await client.getHistory();
    console.log('\nSearch history:');
    history.forEach(search => {
      console.log(`- "${search.query}": ${search.currentPage}/${search.totalPages} pages`);
    });
    
    // 6. cleanup
    await client.cleanup();
    
  } catch (error) {
    console.error('Error:', error.message);
    await client.cleanup();
  }
}

// اجرا
main();
```

### Python (Complete Flow):

```python
import requests
import time

class PhDSearchClient:
    def __init__(self, base_url='http://91.99.13.17:3001/api'):
        self.base_url = base_url
        self.user_id = f'user-{int(time.time())}'
        self.session_id = None
    
    # 0. چک سلامت
    def check_health(self):
        response = requests.get(f'{self.base_url.replace("/api", "")}/api/health')
        health = response.json()
        
        if health['status'] != 'healthy':
            raise Exception('Service is not healthy')
        
        if health['browser']['availableTabs'] == 0:
            raise Exception('No browser tabs available')
        
        print('✓ Service is healthy')
        return health
    
    # 1. ایجاد session
    def create_session(self):
        response = requests.post(
            f'{self.base_url}/session',
            json={'userId': self.user_id}
        )
        
        result = response.json()
        
        if not result['success']:
            raise Exception('Failed to create session')
        
        self.session_id = result['data']['sessionId']
        print(f'✓ Session created: {self.session_id}')
        return self.session_id
    
    # 2. جستجو
    def search(self, keywords, filters=None, page=1):
        response = requests.post(
            f'{self.base_url}/search',
            json={
                'userId': self.user_id,
                'sessionId': self.session_id,
                'keywords': keywords,
                'filters': filters or {},
                'page': page
            }
        )
        
        result = response.json()
        
        if not result['success']:
            raise Exception('Search failed')
        
        print(f"✓ Search completed: {len(result['data']['results'])} results")
        print(f"  Total pages: {result['data']['totalPages']}")
        
        return {
            'searchId': result['searchId'],
            'data': result['data']
        }
    
    # 3. صفحه بعدی
    def continue_search(self, search_id, page):
        response = requests.post(
            f'{self.base_url}/search/{search_id}/continue',
            json={
                'sessionId': self.session_id,
                'page': page
            }
        )
        
        result = response.json()
        
        if not result['success']:
            raise Exception('Failed to continue search')
        
        print(f"✓ Page {page}: {len(result['data']['results'])} results")
        return result['data']
    
    # 4. تمام صفحات
    def get_all_results(self, search_id, max_pages=None):
        first_page = self.continue_search(search_id, 1)
        all_results = first_page['results'][:]
        total_pages = max_pages or first_page['totalPages']
        
        for page in range(2, total_pages + 1):
            page_data = self.continue_search(search_id, page)
            all_results.extend(page_data['results'])
            time.sleep(1)  # توقف کوتاه
        
        print(f'✓ Collected {len(all_results)} total results')
        return all_results
    
    # 5. تاریخچه
    def get_history(self):
        response = requests.get(
            f'{self.base_url}/search/history/{self.session_id}'
        )
        
        result = response.json()
        
        if not result['success']:
            raise Exception('Failed to get history')
        
        print(f"✓ History: {len(result['data'])} searches")
        return result['data']
    
    # 6. حذف session
    def cleanup(self):
        if not self.session_id:
            return
        
        response = requests.delete(
            f'{self.base_url}/session/{self.session_id}'
        )
        
        result = response.json()
        
        if result['success']:
            print('✓ Session deleted')

# استفاده کامل:
def main():
    client = PhDSearchClient()
    
    try:
        # 0. چک سلامت
        client.check_health()
        
        # 1. ایجاد session
        client.create_session()
        
        # 2. جستجوی اول
        search1 = client.search(
            'artificial intelligence',
            filters={
                'discipline': '10M7g0',  # Computer Science
                'geography': ['g0w900']  # UK
            }
        )
        
        print('\nFirst 3 results:')
        for i, phd in enumerate(search1['data']['results'][:3]):
            print(f"{i + 1}. {phd['title']}")
            print(f"   {phd['institution']}")
            print(f"   {phd['url']}\n")
        
        # 3. صفحه دوم
        if search1['data']['totalPages'] > 1:
            page2 = client.continue_search(search1['searchId'], 2)
            print(f"\nPage 2 first result: {page2['results'][0]['title']}")
        
        # 4. جستجوی دوم
        search2 = client.search(
            'machine learning',
            filters={
                'discipline': '10M7g0',
                'funding': ['0100', '0110']  # Funded only
            }
        )
        
        print(f"\n✓ Second search: {len(search2['data']['results'])} funded positions")
        
        # 5. مشاهده تاریخچه
        history = client.get_history()
        print('\nSearch history:')
        for search in history:
            print(f"- \"{search['query']}\": {search['currentPage']}/{search['totalPages']} pages")
        
        # 6. cleanup
        client.cleanup()
        
    except Exception as e:
        print(f'Error: {e}')
        client.cleanup()

# اجرا
if __name__ == '__main__':
    main()
```

---

## 📊 خلاصه ترتیب استفاده:

```
1. [اختیاری] GET /api/health
        ↓
2. [ضروری] POST /api/session
        ↓ (ذخیره sessionId)
3. [ضروری] POST /api/search
        ↓ (ذخیره searchId)
4. [اختیاری] GET /api/search/{searchId}
        ↓
5. [اختیاری] POST /api/search/{searchId}/continue
        ↓
6. [اختیاری] GET /api/search/history/{sessionId}
        ↓
7. [اختیاری] DELETE /api/session/{sessionId}
```

---

## ⚡ Quick Start (کوتاه‌ترین راه):

```javascript
// 1. Session بساز
const session = await fetch('http://91.99.13.17:3001/api/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'my-user' })
}).then(r => r.json());

const sessionId = session.data.sessionId;

// 2. جستجو کن
const search = await fetch('http://91.99.13.17:3001/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'my-user',
    sessionId: sessionId,
    keywords: 'AI',
    filters: { discipline: '10M7g0' }
  })
}).then(r => r.json());

// 3. نتایج رو ببین
console.log(search.data.results);
```

---

## 🎉 تمام!

حالا می‌دونی چطور:
- ✅ Session بسازی
- ✅ جستجو کنی
- ✅ نتایج بگیری
- ✅ صفحات بعدی رو بخونی
- ✅ تاریخچه رو ببینی

**برای مثال‌های بیشتر:** Swagger UI رو باز کن → http://91.99.13.17:3001/api-docs
