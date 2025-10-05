# 🎯 راهنمای دستورات اجرا

## دستورات اصلی

### ⚡ اجرای سرور API
```bash
npm start
# یا
npm run api
# یا
node src/api/server.js
```

**خروجی:**
```
============================================================
✓ FindAPhD API Server running on port 3000
✓ Browser pool initialized with max 100 tabs

📚 Documentation URLs:
   • Swagger UI:    http://localhost:3000/api-docs
   • API Info:      http://localhost:3000/
   • Health Check:  http://localhost:3000/api/health
============================================================
```

**بعد از اجرا:**
- برو به `http://localhost:3000/api-docs` برای Swagger UI
- API آماده دریافت درخواست است

---

### 🔥 Development Mode (با Auto-Restart)
```bash
npm run dev
```

**نیاز به نصب:**
```bash
npm install -g nodemon
```

در این حالت، هر تغییری که در کد ایجاد کنی، سرور خودکار restart می‌شه.

---

## تست‌ها

### ✅ تست کامل API (11 تست)
```bash
npm run test:full
# یا
node test-runner.js
```

**چی تست می‌شه:**
1. Root endpoint (GET /)
2. Health check (GET /api/health)
3. Ready check (GET /api/health/ready)
4. Create session (POST /api/session)
5. Get session (GET /api/session/:id)
6. Get user sessions (GET /api/session/user/:id)
7. Delete session (DELETE /api/session/:id)
8. Perform search (POST /api/search)
9. Get search results (GET /api/search/:id)
10. Get available filters (POST /api/search/filters/available)
11. Get search history (GET /api/search/history/:id)

**نتیجه مورد انتظار:**
```
✓ All 11 tests passed (100% success rate)
```

---

### 🔍 تست جستجوی واقعی
```bash
npm run test:real
# یا
node test-real-search.js
```

**این تست چیکار می‌کنه:**
- یک جستجوی واقعی با Playwright انجام می‌ده
- کلیدواژه: "artificial intelligence"
- فیلتر: Computer Science در UK
- تمام صفحات رو Crawl می‌کنه
- نتایج رو نمایش می‌ده

**نتیجه مورد انتظار:**
```
Found 170 PhD positions in 17 pages
Duration: 13.6s
```

---

### 🧪 تست‌های قدیمی
```bash
npm test
# یا
npm run test:api
```

---

## دموها

### 📋 دمو Crawl اولیه
```bash
npm run demo:crawl
# یا
node src/demo/crawl.js
```

این نسخه اولیه پروژه است که فقط یک crawl ساده انجام می‌ده.

---

### 📖 باز کردن مستندات
```bash
npm run docs
```

این دستور مرورگر رو باز می‌کنه و Swagger UI رو نمایش می‌ده.  
**نکته:** اول باید سرور رو با `npm start` اجرا کرده باشی.

---

## دستورات ترکیبی

### روش کامل: اجرا + تست
```bash
# Terminal 1: اجرای سرور
npm start

# Terminal 2: (در پنجره دیگر) اجرای تست‌ها
npm run test:full
```

---

### توسعه با تست مداوم
```bash
# Terminal 1: Dev mode
npm run dev

# Terminal 2: تست بعد از هر تغییر
npm run test:full
```

---

## دستورات مستقیم Node.js

اگر ترجیح می‌دی بدون npm اجرا کنی:

```bash
# سرور API
node src/api/server.js

# تست کامل
node test-runner.js

# تست واقعی
node test-real-search.js

# دمو crawl
node src/demo/crawl.js
```

---

## چک کردن وضعیت سرویس

### از Terminal:
```bash
# Health check
curl http://localhost:3000/api/health

# Ready check
curl http://localhost:3000/api/health/ready

# API info
curl http://localhost:3000/
```

### از مرورگر:
- `http://localhost:3000/` - اطلاعات API
- `http://localhost:3000/api/health` - وضعیت سلامت
- `http://localhost:3000/api-docs` - مستندات Swagger

---

## نصب Dependencies

### اولین بار:
```bash
npm install
```

### اضافه کردن Package جدید:
```bash
npm install package-name
```

### حذف node_modules و نصب مجدد:
```bash
rm -rf node_modules
npm install
```

---

## خاموش کردن سرور

در Terminal که سرور در حال اجرا است:

```bash
Ctrl + C
```

سرور به صورت Graceful shutdown می‌شه:
```
Shutting down gracefully...
✓ Browser pool closed
✓ Sessions cleaned up
```

---

## مشکلات رایج و راه‌حل

### Port 3000 قبلاً استفاده شده
```bash
# پیدا کردن Process
netstat -ano | findstr :3000

# Kill کردن Process (Windows)
taskkill /PID <PID_NUMBER> /F

# یا تغییر Port
PORT=8080 npm start
```

### خطای Module Not Found
```bash
npm install
```

### خطای Playwright
```bash
npx playwright install
```

### پاک کردن Cache
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## Workflow پیشنهادی

### برای توسعه:
```bash
1. npm install              # نصب dependencies
2. npm run dev              # اجرا در حالت development
3. # تغییرات کد
4. npm run test:full        # تست تغییرات
5. # تکرار مراحل 3-4
```

### برای تست:
```bash
1. npm start                # اجرای سرور
2. # باز کردن Terminal جدید
3. npm run test:full        # تست خودکار
4. npm run test:real        # تست واقعی
5. # مرورگر: http://localhost:3000/api-docs
```

### برای Production:
```bash
1. npm install --production    # بدون dev dependencies
2. NODE_ENV=production npm start
```

---

## خلاصه دستورات مفید

| دستور | توضیح |
|-------|-------|
| `npm start` | اجرای سرور API |
| `npm run dev` | اجرا با auto-restart |
| `npm run test:full` | تست کامل (11 تست) |
| `npm run test:real` | تست جستجوی واقعی |
| `npm run docs` | باز کردن Swagger UI |
| `npm test` | تست‌های قدیمی |
| `npm run demo:crawl` | دمو crawl |
| `Ctrl+C` | خاموش کردن سرور |

---

## لینک‌های مفید بعد از اجرا

- **API Root**: http://localhost:3000/
- **Swagger UI**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/api/health
- **Ready Check**: http://localhost:3000/api/health/ready

---

**🎉 حالا آماده‌ای! با `npm start` شروع کن.**
