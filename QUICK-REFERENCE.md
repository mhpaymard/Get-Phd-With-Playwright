# 🚀 راهنمای سریع: 3 قدم تا جستجو

## گام 1: ایجاد Session

```bash
curl -X POST http://localhost:3000/api/session \
  -H "Content-Type: application/json" \
  -d '{"userId":"my-user"}'
```

**خروجی:**
```json
{
  "success": true,
  "data": {
    "sessionId": "abc-123-xyz",  ⬅️ این رو کپی کن!
    "userId": "my-user"
  }
}
```

---

## گام 2: جستجو

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "my-user",
    "sessionId": "abc-123-xyz",     ⬅️ sessionId از گام 1
    "keywords": "artificial intelligence",
    "filters": {
      "discipline": "10M7g0",       ⬅️ Computer Science
      "geography": ["g0w900"]        ⬅️ UK
    }
  }'
```

**خروجی:**
```json
{
  "success": true,
  "searchId": "search-456",         ⬅️ ذخیره کن
  "data": {
    "totalPages": 15,
    "currentPage": 1,
    "results": [
      {
        "title": "PhD in Deep Learning",
        "institution": "Oxford University",
        "url": "https://findaphd.com/...",
        "funding": "Fully Funded",
        ...
      }
    ]
  }
}
```

---

## گام 3: صفحه بعدی (اختیاری)

```bash
curl -X POST http://localhost:3000/api/search/search-456/continue \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "abc-123-xyz",
    "page": 2
  }'
```

---

## 🔥 کد JavaScript

```javascript
// گام 1: Session
const session = await fetch('http://localhost:3000/api/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'my-user' })
}).then(r => r.json());

const sessionId = session.data.sessionId;

// گام 2: جستجو
const search = await fetch('http://localhost:3000/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'my-user',
    sessionId: sessionId,
    keywords: 'AI',
    filters: { discipline: '10M7g0', geography: ['g0w900'] }
  })
}).then(r => r.json());

console.log(`Found ${search.data.results.length} PhDs`);
search.data.results.forEach(phd => {
  console.log(`- ${phd.title} at ${phd.institution}`);
});

// گام 3: صفحه 2
if (search.data.totalPages > 1) {
  const page2 = await fetch(
    `http://localhost:3000/api/search/${search.searchId}/continue`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, page: 2 })
    }
  ).then(r => r.json());
  
  console.log(`Page 2: ${page2.data.results.length} more PhDs`);
}
```

---

## 🐍 کد Python

```python
import requests

# گام 1: Session
session = requests.post(
    'http://localhost:3000/api/session',
    json={'userId': 'my-user'}
).json()

session_id = session['data']['sessionId']

# گام 2: جستجو
search = requests.post(
    'http://localhost:3000/api/search',
    json={
        'userId': 'my-user',
        'sessionId': session_id,
        'keywords': 'AI',
        'filters': {
            'discipline': '10M7g0',
            'geography': ['g0w900']
        }
    }
).json()

print(f"Found {len(search['data']['results'])} PhDs")
for phd in search['data']['results']:
    print(f"- {phd['title']} at {phd['institution']}")

# گام 3: صفحه 2
if search['data']['totalPages'] > 1:
    page2 = requests.post(
        f"http://localhost:3000/api/search/{search['searchId']}/continue",
        json={'sessionId': session_id, 'page': 2}
    ).json()
    
    print(f"Page 2: {len(page2['data']['results'])} more PhDs")
```

---

## 🎓 فیلترهای رایج

### رشته‌های تحصیلی (Discipline):
```json
{
  "discipline": "10M7g0"  // Computer Science
}
```
- `10M7g0` → Computer Science
- `10M7g1` → Engineering
- `10M7g2` → Medicine & Health
- `10M7g3` → Business & Management
- `10M7g4` → Psychology

### مکان (Geography):
```json
{
  "geography": ["g0w900"]  // UK
}
```
- `g0w900` → United Kingdom
- `g0Mw00` → United States
- `g0w800` → Australia
- `g0w700` → Canada

### تامین مالی (Funding):
```json
{
  "funding": ["0100"]  // Funded
}
```
- `01M0` → Self-funded
- `0100` → Funded PhD Project
- `0110` → Studentship

---

## 💡 نکات مهم

1. **همیشه sessionId رو ذخیره کن** - برای تمام جستجوها لازمه
2. **searchId رو نگه دار** - برای صفحات بعدی نیاز داری
3. **یک session برای چند جستجو** - می‌تونی از یک session چندین بار جستجو کنی
4. **Cache** - جستجوهای مشابه تا 15 دقیقه از cache برمی‌گردن (سریع‌تر!)

---

## 🔍 Endpoints اصلی

| Endpoint | Method | کاربرد |
|----------|--------|--------|
| `/api/session` | POST | ایجاد session |
| `/api/search` | POST | جستجو |
| `/api/search/:id/continue` | POST | صفحه بعدی |
| `/api/search/history/:sessionId` | GET | تاریخچه |
| `/api/health` | GET | وضعیت سرویس |

---

## 📚 مستندات بیشتر

- **راهنمای کامل**: [STEP-BY-STEP-GUIDE.md](./STEP-BY-STEP-GUIDE.md)
- **Swagger UI**: http://localhost:3000/api-docs
- **تمام دستورات**: [COMMANDS.md](./COMMANDS.md)

---

**تمام! فقط 3 قدم تا جستجوی PhD! 🎉**
