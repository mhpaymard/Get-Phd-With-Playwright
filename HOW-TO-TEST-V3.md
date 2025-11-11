# 🧪 راهنمای تست Crawler v3.0

## دستورات تست

### ✅ تست 1: تک Keyword (سریع - 30 ثانیه)

```bash
node test-crawler-v3.js
```

**نتیجه:**
- Crawl می‌کنه keyword "a", صفحه 1
- 7 PhD extract می‌کنه
- نتایج در `crawler-v3-results.json` ذخیره میشه

**چک کن:**
```bash
# نمایش تعداد PhDs
node -e "const d=require('./crawler-v3-results.json'); console.log('Total PhDs:', d.results.length);"

# نمایش Coverage
node -e "const d=require('./crawler-v3-results.json'); console.log('Statistics:', d.statistics);"

# نمایش Climate impacts
node -e "const d=require('./crawler-v3-results.json'); const c=d.results.find(r=>r.title.includes('Climate')); console.log(JSON.stringify(c, null, 2));"
```

---

### ✅ تست 2: چند Keyword (2-3 دقیقه)

```bash
node test-multiple-keywords.js
```

**نتیجه:**
- تست 3 keywords: "a", "e", "i"
- هر keyword صفحه 1
- نتایج در `multi-keyword-test.json`

**چک کن:**
```bash
# خلاصه نتایج
node -e "const d=require('./multi-keyword-test.json'); console.log('Total:', d.metadata.totalPhds); console.log('Unique:', d.metadata.uniquePhds); d.results.forEach(r => console.log('  ' + r.keyword + ':', r.count));"
```

---

### ✅ تست 3: بررسی دستی نتایج

#### فایل‌های ایجاد شده:

1. **`crawler-v3-results.json`** - نتایج keyword "a"
   ```bash
   code crawler-v3-results.json
   ```

2. **`multi-keyword-test.json`** - نتایج چند keyword
   ```bash
   code multi-keyword-test.json
   ```

#### چیزایی که باید چک کنی:

✅ **همه PhDs دارای deadline هستند؟**
```javascript
{
  "deadlineText": "7 January 2026",
  "deadlineDate": "2026-01-07"  // ISO format
}
```

✅ **Disciplines و Subjects موجودند؟**
```javascript
{
  "disciplines": ["Chemistry", "Environmental Sciences", ...],
  "subjects": ["Climate Science", "Environmental Geography", ...]
}
```

✅ **Department و Country موجودند؟**
```javascript
{
  "department": "School of Earth & Environment",
  "country": "United Kingdom"
}
```

---

## 📊 Coverage مورد انتظار

| فیلد | Coverage | منبع |
|------|----------|------|
| Title | 100% | HTML + JSON-LD |
| URL | 100% | HTML |
| University | 100% | HTML + DataLayer |
| Department | 100% | HTML + DataLayer |
| Country | 100% | DataLayer |
| Disciplines | 100% | DataLayer ⭐ |
| Subjects | 100% | DataLayer ⭐ |
| Supervisor | 100% | HTML |
| Deadline (Text) | 100% | HTML |
| Deadline (ISO) | 100% | Converted |
| Program Type | 100% | HTML |
| Funding | 100% | HTML |
| Description (Short) | 100% | HTML |
| Description (Full) | 100% | JSON-LD |

**Average: 100%!** 🎉

---

## 🎯 مثال نتیجه کامل:

```json
{
  "index": 8,
  "title": "Climate impacts from water-rich large-magnitude volcanic eruptions",
  "url": "https://www.findaphd.com/phds/project/...",
  "university": "University of Leeds",
  "department": "School of Earth & Environment",
  "location": null,
  "country": "United Kingdom",
  "disciplines": [
    "Chemistry",
    "Environmental Sciences",
    "Geography",
    "Mathematics",
    "Physics"
  ],
  "subjects": [
    "Environmental Chemistry",
    "Climate Science",
    "Environmental Geography",
    "Remote Sensing",
    "Applied Mathematics",
    "Mathematical Modelling",
    "Chemical Physics",
    "Environmental Physics"
  ],
  "supervisor": "Dr G.W. Mann, Dr A Maycock, Dr A Rap, Dr B Johnson",
  "deadlineText": "7 January 2026",
  "deadlineDate": "2026-01-07",
  "programType": "PhD Research Project",
  "funding": "Competition Funded PhD Project (Students Worldwide)",
  "description": "Climate impacts from... (short)",
  "descriptionFull": "Climate impacts from... (6000 chars full)"
}
```

---

## ✅ Checklist تست:

- [ ] اجرا `node test-crawler-v3.js`
- [ ] چک کردن فایل `crawler-v3-results.json`
- [ ] تایید coverage 100% همه فیلدها
- [ ] چک کردن "Climate impacts" دارای deadline است
- [ ] (اختیاری) اجرا `node test-multiple-keywords.js`

---

## 🚀 بعد از تست:

اگر همه چیز OK بود:
1. ✅ `playwrightCrawler.js` رو با v3 جایگزین می‌کنم
2. ✅ Database schema رو آپدیت می‌کنم
3. ✅ Background crawler رو آپدیت می‌کنم
4. ✅ API endpoints رو تست می‌کنیم
5. ✅ پروژه آماده Production! 🎊

---

**الان اجرا کن و نتیجه رو بهم بگو!** 😊

```bash
node test-crawler-v3.js
```

یا اگه میخوای چند keyword رو تست کنی:

```bash
node test-multiple-keywords.js
```
