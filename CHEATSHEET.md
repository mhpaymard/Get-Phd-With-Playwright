# 📋 خلاصه دستورات - FindAPhD API

## 🚀 دستورات سریع (کپی و اجرا)

### اجرای اولیه
```bash
# نصب dependencies
npm install

# اجرای سرور
npm start

# باز کردن Swagger UI در مرورگر
# http://localhost:3000/api-docs
```

---

## ⚡ دستورات اصلی

### 1. اجرای سرور
```bash
npm start              # روش پیشنهادی
npm run api            # مشابه start
node src/api/server.js # روش مستقیم
```

### 2. Development Mode
```bash
npm run dev            # با auto-restart (نیاز به nodemon)
```

### 3. تست کامل
```bash
npm run test:full      # تست 11 endpoint
npm run test:real      # تست جستجوی واقعی
npm test               # تست‌های unit
```

### 4. مستندات
```bash
npm run docs           # باز کردن Swagger UI
```

---

## 🧪 تست‌ها

| دستور | توضیح | زمان |
|-------|-------|------|
| `npm run test:full` | تست 11 endpoint API | ~3s |
| `npm run test:real` | تست جستجوی واقعی | ~15s |
| `npm test` | تست‌های unit | ~1s |
| `npm run test:api` | تست API قدیمی | ~2s |

---

## 🌐 آدرس‌های مهم (بعد از اجرا)

```
✓ Swagger UI:      http://localhost:3000/api-docs
✓ API Root:        http://localhost:3000/
✓ Health Check:    http://localhost:3000/api/health
✓ Ready Check:     http://localhost:3000/api/health/ready
```

---

## 🔥 مثال‌های عملی

### 1. اجرا و تست
```bash
# Terminal 1: اجرای سرور
npm start

# Terminal 2: (پنجره جدید) تست
npm run test:full
```

### 2. توسعه
```bash
# با auto-restart
npm run dev

# تغییرات کد...

# تست
npm run test:full
```

### 3. چک سریع
```bash
# اجرا
npm start

# باز کردن مرورگر
# http://localhost:3000/api-docs

# تست در Swagger UI
```

---

## 📦 دستورات npm کامل

```json
{
  "test": "تست‌های unit",
  "spec": "تست URL",
  "demo:crawl": "دمو crawl",
  "api": "اجرای سرور",
  "start": "اجرای سرور",
  "dev": "development mode",
  "test:api": "تست API",
  "test:full": "تست کامل 11 endpoint",
  "test:real": "تست جستجوی واقعی",
  "docs": "باز کردن Swagger UI"
}
```

---

## 🛠️ دستورات cURL (تست سریع)

### Health Check
```bash
curl http://localhost:3000/api/health
```

### ایجاد Session
```bash
curl -X POST http://localhost:3000/api/session \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user"}'
```

### جستجو
```bash
SESSION_ID="your-session-id"

curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "sessionId": "'$SESSION_ID'",
    "keywords": "machine learning",
    "filters": {"discipline": "10M7g0"}
  }'
```

---

## 🎯 Workflow پیشنهادی

### برای اولین بار:
```bash
1. npm install              # نصب
2. npm start                # اجرا
3. # باز کردن: http://localhost:3000/api-docs
4. # تست در Swagger UI
```

### برای توسعه:
```bash
1. npm run dev              # development mode
2. # تغییرات کد
3. # سرور خودکار restart می‌شه
4. npm run test:full        # تست
```

### برای تست:
```bash
# Terminal 1
npm start

# Terminal 2
npm run test:full           # تست خودکار
npm run test:real           # تست واقعی
```

---

## 🔍 دستورات دیباگ

### چک وضعیت
```bash
# سرور در حال اجرا؟
curl http://localhost:3000/api/health

# آماده دریافت درخواست؟
curl http://localhost:3000/api/health/ready
```

### مشاهده لاگ‌ها
```bash
# در Terminal که سرور اجرا شده
# لاگ‌ها خودکار نمایش داده می‌شوند
```

### خاموش کردن
```bash
# در Terminal سرور
Ctrl + C
```

---

## 🐛 رفع مشکلات رایج

### Port در حال استفاده
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# تغییر پورت
PORT=8080 npm start
```

### خطای Module
```bash
npm install
```

### خطای Playwright
```bash
npx playwright install
```

### پاک کردن و نصب مجدد
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 خروجی مورد انتظار

### npm start
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

### npm run test:full
```
Running comprehensive API tests...

✓ Test 1/11: Root endpoint
✓ Test 2/11: Health check
✓ Test 3/11: Ready check
✓ Test 4/11: Create session
✓ Test 5/11: Get session
✓ Test 6/11: Get user sessions
✓ Test 7/11: Delete session
✓ Test 8/11: Perform search
✓ Test 9/11: Get search results
✓ Test 10/11: Get available filters
✓ Test 11/11: Get search history

========================================
✓ All 11 tests passed (100% success rate)
========================================
```

### npm run test:real
```
Starting real search test with Playwright...

✓ Search completed successfully
✓ Found 170 PhD positions
✓ Crawled 17 pages
✓ Duration: 13.6s
```

---

## 💡 نکات مهم

1. **همیشه `npm start` رو اول اجرا کن**
2. **Swagger UI بهترین راه برای تست است**
3. **Session ها رو reuse کن برای چند جستجو**
4. **Health check رو قبل از جستجو چک کن**
5. **برای توسعه از `npm run dev` استفاده کن**

---

## 🎓 مثال کامل استفاده

```bash
# مرحله 1: نصب و اجرا
npm install
npm start

# مرحله 2: باز کردن Swagger UI
# مرورگر: http://localhost:3000/api-docs

# مرحله 3: تست در Swagger
# 1. POST /session → ایجاد session
# 2. POST /search → جستجو با sessionId
# 3. مشاهده نتایج

# مرحله 4: تست خودکار (Terminal جدید)
npm run test:full

# مرحله 5: تست واقعی
npm run test:real

# مرحله 6: خاموش کردن (در Terminal سرور)
Ctrl + C
```

---

## 📱 دستورات موبایل/آسان

```bash
# همه چیز در یک دستور
npm install && npm start

# تست همه چیز
npm run test:full && npm run test:real

# اجرا و باز کردن مستندات
npm start & sleep 3 && npm run docs
```

---

## ⚙️ Environment Variables

```bash
# پورت سرور (پیش‌فرض: 3000)
PORT=8080 npm start

# محیط اجرا
NODE_ENV=production npm start

# حداکثر تب‌ها
MAX_BROWSER_TABS=50 npm start
```

---

## 🎉 خلاصه سریع

| نیاز | دستور |
|------|-------|
| اجرا | `npm start` |
| توسعه | `npm run dev` |
| تست | `npm run test:full` |
| مستندات | http://localhost:3000/api-docs |
| خاموش | `Ctrl + C` |

---

**✨ برای شروع فقط: `npm start`**
