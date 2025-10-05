# راهنمای سریع استفاده از FindAPhD Search API
## Quick Start Guide

---

## 🚀 شروع سریع

### گام 1: نصب و اجرا

```bash
npm install
npx playwright install chromium
npm run api
```

سرور روی `http://91.99.13.17:3000` اجرا می‌شود.

---

## 📱 استفاده از API

### الگوی کلی استفاده

```
1. ایجاد Session برای کاربر
2. انجام جستجو با کلیدواژه و فیلترها
3. دریافت نتایج
4. در صورت نیاز: ادامه جستجو (صفحات بعدی)
5. حذف Session (اختیاری)
```

---

## 💻 مثال کامل (JavaScript)

```javascript
const BASE_URL = 'http://91.99.13.17:3000/api';

async function searchPhD() {
  // 1. ایجاد session
  const sessionRes = await fetch(`${BASE_URL}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'user-1' })
  });
  const { data: { sessionId } } = await sessionRes.json();
  console.log('Session ID:', sessionId);

  // 2. انجام جستجو
  const searchRes = await fetch(`${BASE_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'user-1',
      sessionId,
      keywords: 'artificial intelligence',
      filters: {
        geography: ['g0w900']  // UK
      },
      page: 1
    })
  });
  
  const searchData = await searchRes.json();
  
  // 3. نمایش نتایج
  console.log('Status:', searchData.data.status);
  console.log('Total Pages:', searchData.data.totalPages);
  console.log('Results Count:', searchData.data.results.length);
  
  searchData.data.results.forEach(phd => {
    console.log(`\n${phd.title}`);
    console.log(`Institution: ${phd.institution}`);
    console.log(`Location: ${phd.location}`);
    console.log(`URL: ${phd.url}`);
  });

  // 4. صفحه بعدی (اختیاری)
  if (searchData.data.totalPages > 1) {
    const page2Res = await fetch(
      `${BASE_URL}/search/${searchData.searchId}/continue`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, page: 2 })
      }
    );
    const page2Data = await page2Res.json();
    console.log('\nPage 2 results:', page2Data.data.results.length);
  }
}

searchPhD();
```

---

## 🐍 مثال Python

```python
import requests

BASE_URL = 'http://91.99.13.17:3000/api'

# 1. ایجاد session
session_response = requests.post(
    f'{BASE_URL}/session',
    json={'userId': 'python-user'}
)
session_id = session_response.json()['data']['sessionId']
print(f'Session ID: {session_id}')

# 2. جستجو
search_response = requests.post(
    f'{BASE_URL}/search',
    json={
        'userId': 'python-user',
        'sessionId': session_id,
        'keywords': 'machine learning',
        'page': 1
    }
)

search_data = search_response.json()['data']

# 3. نمایش نتایج
print(f"Status: {search_data['status']}")
print(f"Total Pages: {search_data['totalPages']}")
print(f"Results: {len(search_data['results'])}")

for phd in search_data['results']:
    print(f"\n{phd['title']}")
    print(f"  {phd['institution']} - {phd['location']}")
    print(f"  {phd['url']}")
```

---

## 🔍 فیلترهای موجود

### کدهای فیلترهای رایج

#### رشته‌های تحصیلی (Disciplines)
```json
{
  "discipline": "10M7g0"  // Computer Science
}
```

#### مکان (Geography)
```json
{
  "geography": ["g0w900"]  // United Kingdom
}
// یا چندین مکان:
{
  "geography": ["g0w900", "g0Mw00"]  // UK + Germany
}
```

#### نوع تامین مالی (Funding)
```json
{
  "funding": ["01M0"]  // Self-funded
}
// کدهای رایج:
// "0100" - UK students
// "01M0" - Self-funded
// "01w0" - Non-EU students
// "01g0" - EU students (excluding UK)
```

---

## 📊 دریافت لیست فیلترهای موجود

```javascript
const filtersRes = await fetch(`${BASE_URL}/search/filters/available`, {
  method: 'POST'
});
const filters = await filtersRes.json();

console.log('Disciplines:', filters.data.disciplines);
console.log('Geographies:', filters.data.geographies);
console.log('Funding Options:', filters.data.funding);
```

---

## ⚡ نکات مهم

### 1. مدیریت Session
- هر کاربر یک `userId` یکتا دارد
- می‌توانید چندین session برای یک کاربر داشته باشید
- Session ها بعد از 24 ساعت عدم استفاده خودکار حذف می‌شوند

### 2. کش
- نتایج مشابه از کش برگردانده می‌شوند (سریع‌تر)
- کش برای 15 دقیقه معتبر است
- فیلد `fromCache: true` نشان‌دهنده نتیجه از کش است

### 3. محدودیت‌ها
- حداکثر 100 جستجوی همزمان
- درخواست‌های اضافی در صف قرار می‌گیرند
- هر جستجو 5-30 ثانیه زمان می‌برد

### 4. خطاها
```javascript
{
  "success": false,
  "error": "Error message here",
  "requestId": "uuid"
}
```

---

## 🔄 الگوهای استفاده رایج

### الگو 1: جستجوی ساده بدون فیلتر
```javascript
{
  "userId": "user-1",
  "keywords": "biology",
  "page": 1
}
```

### الگو 2: جستجو با فیلتر کامل
```javascript
{
  "userId": "user-1",
  "keywords": "robotics",
  "filters": {
    "discipline": "10M7g0",      // Computer Science
    "geography": ["g0w900"],      // UK
    "funding": ["01M0"]           // Self-funded
  },
  "page": 1
}
```

### الگو 3: بدون کلیدواژه (فقط فیلتر)
```javascript
{
  "userId": "user-1",
  "filters": {
    "geography": ["g0w900"]  // همه PhD های UK
  },
  "page": 1
}
```

---

## 🛠️ تست سریع با cURL

```bash
# Health check
curl http://91.99.13.17:3000/api/health

# ایجاد session
curl -X POST http://91.99.13.17:3000/api/session \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-1"}'

# جستجو (جایگزین SESSION_ID_HERE با session id دریافتی)
curl -X POST http://91.99.13.17:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-1",
    "sessionId": "SESSION_ID_HERE",
    "keywords": "data science",
    "page": 1
  }'
```

---

## 📖 مستندات کامل

برای جزئیات بیشتر به `docs/API-DOCUMENTATION.md` مراجعه کنید.

---

## ⚠️ عیب‌یابی

### مشکل: "Browser not initialized"
```bash
npx playwright install chromium
```

### مشکل: درخواست طولانی می‌شود
- سرور در حال پردازش است
- صبر کنید تا 30 ثانیه
- در صورت نیاز timeout را افزایش دهید

### مشکل: نتایج خالی
- سایت FindAPhD ممکن است تغییر کرده باشد
- console logs را بررسی کنید
- با فیلترهای مختلف تست کنید

---

## 📞 پشتیبانی

- مستندات کامل: `docs/API-DOCUMENTATION.md`
- GitHub Issues
- Email: support@example.com

---

**نسخه:** 1.0.0  
**تاریخ:** 2025-10-05
