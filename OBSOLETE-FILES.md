# فایل‌های قدیمی (v1.0) که می‌توانند حذف شوند

این لیست شامل فایل‌هایی است که مربوط به نسخه 1.0 هستند و در نسخه 2.0 دیگر استفاده نمی‌شوند.
شما می‌توانید این فایل‌ها را حذف کنید یا برای مرجع نگه دارید.

---

## ✅ فایل‌های حذف شده

این فایل‌ها در migration به v2.0 حذف شده‌اند:

- ❌ `test-api-simple.js` - تست API قدیمی
- ❌ `test-crawler-fix.js` - تست crawler قدیمی
- ❌ `test-new-crawler.js` - تست crawler قدیمی
- ❌ `test-real-search.js` - تست جستجوی واقعی قدیمی
- ❌ `test-runner.js` - تست runner قدیمی
- ❌ `test-swagger.js` - تست swagger قدیمی
- ❌ `TEST-REPORT.js` - گزارش تست قدیمی
- ❌ `analyze-findaphd.js` - فایل تحلیل
- ❌ `analyze-html-structure.js` - فایل تحلیل HTML
- ❌ `debug-selectors.js` - فایل debug

---

## 🗂️ فایل‌های مستندات قدیمی (قابل حذف)

این مستندات مربوط به v1.0 هستند. می‌توانید حذف کنید یا برای مرجع نگه دارید:

### راهنماهای v1.0
- `CHANGELOG.md` - تاریخچه تغییرات v1.0
- `CHEATSHEET.md` - خلاصه دستورات v1.0
- `COMMANDS.md` - راهنمای دستورات v1.0
- `DEVELOPMENT-REPORT.md` - گزارش توسعه v1.0
- `FINAL-DELIVERY-REPORT.md` - گزارش تحویل نهایی v1.0
- `FINAL-SUMMARY.md` - خلاصه نهایی v1.0
- `QUICK-REFERENCE.md` - مرجع سریع v1.0
- `QUICK-START.md` - راهنمای شروع سریع v1.0
- `STEP-BY-STEP-GUIDE.md` - راهنمای گام‌به‌گام v1.0
- `DOCUMENTATION-INDEX.md` - فهرست مستندات v1.0

### Session Management (حذف شده در v2.0)
- `SESSION-DIAGRAMS.md` - دیاگرام‌های session
- `SESSION-MANAGEMENT-GUIDE.md` - راهنمای session management

### Crawler (قدیمی)
- `CRAWLER-UPGRADE-REPORT.md` - گزارش ارتقا crawler
- `DEBUG-CRAWLER-GUIDE.md` - راهنمای debug crawler

### Frontend/Flutter (در صورت عدم استفاده)
- `FLUTTER-COMPLETE-GUIDE.md` - راهنمای کامل Flutter
- `FLUTTER-GUIDE-PART1.md` - راهنمای Flutter قسمت 1
- `DELIVERY-GUIDE-FOR-FLUTTER.md` - راهنمای تحویل Flutter
- `FRONTEND-FLOWCHART.md` - فلوچارت frontend
- `FRONTEND-GUIDE.md` - راهنمای frontend
- `FRONTEND-SIMPLE-FLOW.md` - فلوچارت ساده frontend

### Swagger (قدیمی)
- `HOW-TO-DOWNLOAD-SWAGGER.md` - راهنمای دانلود swagger
- `HOW-TO-TEST-API.md` - راهنمای تست API
- `SWAGGER-DOWNLOAD-QUICK-GUIDE.md` - راهنمای سریع دانلود swagger
- `SWAGGER-QUICKSTART.md` - شروع سریع swagger
- `swagger-downloaded.json` - فایل swagger دانلود شده قدیمی
- `downloaded-swagger.json` - فایل swagger دانلود شده قدیمی

### Other
- `README-NEW.md` - README جدید (قبلی)
- `README-V1-BACKUP.md` - Backup از README v1.0
- `download-swagger.sh` - اسکریپت دانلود swagger

### Log Files (قابل حذف)
- `server-final.log`
- `server-new.log`
- `server.log`

### Images
- `findaphd-analysis.png` - تصویر تحلیل (در صورت عدم نیاز)

---

## 📚 مستندات جدید (v2.0)

این فایل‌ها مربوط به v2.0 هستند و باید نگه داشته شوند:

### اصلی
- ✅ `README.md` - راهنمای اصلی v2.0
- ✅ `README-V2.md` - نسخه کامل README v2.0
- ✅ `package.json` - Dependencies و scripts
- ✅ `swagger-v2.json` - OpenAPI specification v2.0

### مستندات
- ✅ `docs/MIGRATION-GUIDE-V2.md` - راهنمای migration از v1 به v2
- ✅ `docs/architecture/NEW-ARCHITECTURE.md` - معماری v2.0
- ✅ `docs/API-DOCUMENTATION.md` - مستندات API (ممکنه نیاز به آپدیت داشته باشه)
- ✅ `docs/SWAGGER-GUIDE.md` - راهنمای Swagger

### کد اصلی
- ✅ `src/database/` - Database layer جدید
- ✅ `src/crawler/` - Background crawler جدید
- ✅ `src/api/server-new.js` - سرور جدید
- ✅ `src/api/routes/phd.js` - Routes جدید
- ✅ `src/api/routes/crawler.js` - Routes crawler
- ✅ `tests/database.test.js` - تست database
- ✅ `tests/crawler.test.js` - تست crawler

---

## 🔄 فایل‌های قدیمی که هنوز استفاده می‌شوند

این فایل‌ها مربوط به v1.0 هستند اما در v2.0 هنوز استفاده می‌شوند:

- ✅ `src/workers/playwrightCrawler.js` - Crawler اصلی (reused در v2.0)
- ✅ `src/findaphd/url.js` - URL builder (reused)
- ✅ `src/services/filterMapper.js` - Filter mapping (reused)
- ✅ `src/services/searchOrchestrator.js` - Search orchestrator (reused)
- ✅ `src/core/` - Core modules (reused)
- ✅ `tests/findaphd-url.test.js` - تست URL (هنوز معتبر)
- ✅ `tests/orchestrator.test.js` - تست orchestrator (هنوز معتبر)
- ✅ `tests/filter-mapper.test.js` - تست filter mapper (هنوز معتبر)

### فایل‌های قدیمی که backup هستند
- `src/api/server.js` - سرور v1.0 (backup)
- `src/api/browserPool.js` - Browser pool v1.0 (backup)
- `src/api/sessionManager.js` - Session manager v1.0 (backup)
- `src/api/routes/search.js` - Routes قدیمی (backup)
- `src/api/routes/session.js` - Routes قدیمی (backup)
- `src/workers/playwrightCrawler.BACKUP.js` - Backup
- `src/workers/playwrightCrawler.OLD.js` - نسخه قدیمی

**توصیه:** می‌توانید backup ها را بعد از اطمینان از عملکرد v2.0 حذف کنید.

---

## 🗑️ دستور حذف دسته‌جمعی

اگر می‌خواهید تمام فایل‌های غیرضروری را حذف کنید:

### Windows (PowerShell)
```powershell
# حذف مستندات قدیمی
Remove-Item -Path CHANGELOG.md, CHEATSHEET.md, COMMANDS.md -ErrorAction SilentlyContinue

# حذف log files
Remove-Item -Path *.log -ErrorAction SilentlyContinue

# حذف swagger های قدیمی
Remove-Item -Path swagger-downloaded.json, downloaded-swagger.json -ErrorAction SilentlyContinue
```

### Linux/Mac
```bash
# حذف مستندات قدیمی
rm -f CHANGELOG.md CHEATSHEET.md COMMANDS.md

# حذف log files
rm -f *.log

# حذف swagger های قدیمی
rm -f swagger-downloaded.json downloaded-swagger.json
```

⚠️ **توجه**: قبل از حذف، backup تهیه کنید!

---

## 📊 خلاصه

| دسته | تعداد فایل | وضعیت |
|------|-----------|--------|
| فایل‌های حذف شده | 10 | ✅ Deleted |
| مستندات قدیمی | 25+ | ⚠️ قابل حذف |
| کد قدیمی (backup) | 8 | ⚠️ قابل حذف بعد از تست |
| فایل‌های جدید v2.0 | 15+ | ✅ نگه دارید |
| فایل‌های reused | 10+ | ✅ نگه دارید |

---

**تاریخ:** 2025-11-11  
**نسخه:** 2.0.0

