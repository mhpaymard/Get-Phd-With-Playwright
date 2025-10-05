# 📚 راهنمای مستندات FindAPhD API

> **راهنمای کامل برای پیدا کردن مستندات مورد نیاز**

---

## 🎯 من دنبال چی می‌گردم؟

### ⚡ می‌خوام **سریع** شروع کنم!
👉 **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** - فقط 3 قدم!

### 📖 می‌خوام **گام‌به‌گام** یاد بگیرم
👉 **[STEP-BY-STEP-GUIDE.md](./STEP-BY-STEP-GUIDE.md)** - راهنمای کامل با مثال‌های زیاد

### 💻 می‌خوام **دستورات اجرا** رو ببینم
👉 **[COMMANDS.md](./COMMANDS.md)** - تمام دستورات npm و terminal

### 📋 می‌خوام **خلاصه سریع** دستورات
👉 **[CHEATSHEET.md](./CHEATSHEET.md)** - خلاصه‌ترین راهنما

### 🎨 می‌خوام با **Swagger UI** کار کنم
👉 **[SWAGGER-QUICKSTART.md](./SWAGGER-QUICKSTART.md)** - شروع 30 ثانیه‌ای  
👉 **[docs/SWAGGER-GUIDE.md](./docs/SWAGGER-GUIDE.md)** - راهنمای جامع Swagger

### 🚀 می‌خوام **Deploy** کنم
👉 **[DEPLOYMENT.md](./DEPLOYMENT.md)** - راهنمای Production

### 🏗️ می‌خوام **معماری** پروژه رو بفهمم
👉 **[docs/architecture/overview.md](./docs/architecture/overview.md)** - نمای کلی  
👉 **[docs/architecture/data-model.md](./docs/architecture/data-model.md)** - مدل داده

### 🔍 می‌خوام درباره **فیلترها** بدونم
👉 **[docs/filters-reference.md](./docs/filters-reference.md)** - خلاصه فیلترها  
👉 **[docs/findaphd-search-spec.md](./docs/findaphd-search-spec.md)** - مشخصات کامل

---

## 📂 ساختار مستندات

```
get-phd/
├── README.md                          ← شروع از اینجا
├── QUICK-REFERENCE.md                 ← ⚡ سریع‌ترین راه (3 قدم)
├── STEP-BY-STEP-GUIDE.md              ← 📖 گام‌به‌گام کامل
├── COMMANDS.md                        ← 💻 دستورات اجرا
├── CHEATSHEET.md                      ← 📋 خلاصه دستورات
├── SWAGGER-QUICKSTART.md              ← 🎨 Swagger (30 ثانیه)
├── DEPLOYMENT.md                      ← 🚀 Production
├── swagger.json                       ← 🔧 OpenAPI Spec
│
├── docs/
│   ├── SWAGGER-GUIDE.md               ← 📚 راهنمای جامع Swagger
│   ├── API-DOCUMENTATION.md           ← 📡 مستندات کامل API
│   ├── DEVELOPMENT-REPORT.md          ← 📊 گزارش توسعه
│   ├── filters-reference.md           ← 🔍 فیلترها
│   ├── findaphd-search-spec.md        ← 📋 مشخصات جستجو
│   │
│   └── architecture/
│       ├── overview.md                ← 🏗️ نمای کلی معماری
│       ├── data-model.md              ← 💾 مدل داده
│       ├── operations.md              ← ⚙️ عملیات سیستم
│       └── roadmap.md                 ← 🗺️ نقشه راه
│
└── tests/                             ← 🧪 تست‌ها و مثال‌ها
```

---

## 🎓 مسیرهای یادگیری

### مسیر 1: مبتدی (30 دقیقه)
1. [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - 5 دقیقه
2. [SWAGGER-QUICKSTART.md](./SWAGGER-QUICKSTART.md) - 5 دقیقه
3. تست در Swagger UI - 20 دقیقه

### مسیر 2: متوسط (2 ساعت)
1. [STEP-BY-STEP-GUIDE.md](./STEP-BY-STEP-GUIDE.md) - 30 دقیقه
2. [COMMANDS.md](./COMMANDS.md) - 15 دقیقه
3. [docs/API-DOCUMENTATION.md](./docs/API-DOCUMENTATION.md) - 45 دقیقه
4. تست و کد نویسی - 30 دقیقه

### مسیر 3: پیشرفته (1 روز)
1. مسیر متوسط - 2 ساعت
2. [docs/SWAGGER-GUIDE.md](./docs/SWAGGER-GUIDE.md) - 1 ساعت
3. [docs/architecture/](./docs/architecture/) - 2 ساعت
4. [DEPLOYMENT.md](./DEPLOYMENT.md) - 1 ساعت
5. تست کامل و توسعه - 2 ساعت

---

## 🔥 سناریوهای رایج

### سناریو 1: می‌خوام اولین جستجومو انجام بدم
```
1. QUICK-REFERENCE.md → بخش "3 قدم"
2. Swagger UI → http://91.99.13.17:3000/api-docs
3. تست کن!
```

### سناریو 2: می‌خوام با JavaScript کد بنویسم
```
1. STEP-BY-STEP-GUIDE.md → بخش "مثال کامل JavaScript"
2. کپی کن و اجرا کن
3. تغییرات بده
```

### سناریو 3: می‌خوام با Python کار کنم
```
1. STEP-BY-STEP-GUIDE.md → بخش "مثال کامل Python"
2. نصب: pip install requests
3. کپی و اجرا
```

### سناریو 4: می‌خوام فیلترها رو بفهمم
```
1. docs/filters-reference.md → خلاصه
2. STEP-BY-STEP-GUIDE.md → بخش "فیلترهای موجود"
3. تست در Swagger
```

### سناریو 5: می‌خوام Client Code تولید کنم
```
1. docs/SWAGGER-GUIDE.md → بخش "تولید کد Client"
2. نصب OpenAPI Generator
3. تولید کد
```

### سناریو 6: می‌خوام در Production استقرار بدم
```
1. DEPLOYMENT.md → بخش "Production Setup"
2. انتخاب روش (VPS/Docker/PM2)
3. دنبال کردن مراحل
```

---

## 📖 راهنمای خواندن اسناد

### نمادها و علائم:
- ⚡ = سریع و کوتاه
- 📖 = مفصل و کامل
- 💻 = کد و دستورات
- 🎨 = UI و تعاملی
- 🏗️ = معماری و طراحی
- 🚀 = Production و Deploy
- 🔍 = جزئیات فنی

### سطح مهارت:
- 🟢 مبتدی: QUICK-REFERENCE, SWAGGER-QUICKSTART
- 🟡 متوسط: STEP-BY-STEP-GUIDE, COMMANDS, API-DOCUMENTATION
- 🔴 پیشرفته: SWAGGER-GUIDE, Architecture docs, DEPLOYMENT

---

## 🎯 نقشه راه یادگیری

```
شروع
  ↓
[اجرای سرور] → COMMANDS.md
  ↓
[تست سریع] → QUICK-REFERENCE.md (5 دقیقه)
  ↓
[یادگیری Swagger] → SWAGGER-QUICKSTART.md (10 دقیقه)
  ↓
[یادگیری عمیق] → STEP-BY-STEP-GUIDE.md (30 دقیقه)
  ↓
[کد نویسی] → مثال‌های JavaScript/Python
  ↓
[فیلترها] → docs/filters-reference.md
  ↓
[API کامل] → docs/API-DOCUMENTATION.md
  ↓
[Client Code] → docs/SWAGGER-GUIDE.md
  ↓
[Production] → DEPLOYMENT.md
  ↓
تسلط کامل! 🎉
```

---

## 💡 نکات مهم

### برای خواندن سریع:
1. **QUICK-REFERENCE.md** - فقط کدها
2. **CHEATSHEET.md** - فقط دستورات
3. **Swagger UI** - تست تعاملی

### برای یادگیری عمیق:
1. **STEP-BY-STEP-GUIDE.md** - مثال‌های کامل
2. **docs/API-DOCUMENTATION.md** - جزئیات کامل
3. **docs/SWAGGER-GUIDE.md** - تولید Client

### برای مرجع:
1. **swagger.json** - OpenAPI Spec
2. **docs/filters-reference.md** - کدهای فیلتر
3. **COMMANDS.md** - تمام دستورات

---

## 🔗 لینک‌های سریع

### مستندات آنلاین (بعد از اجرا):
- **Swagger UI**: http://91.99.13.17:3000/api-docs
- **API Info**: http://91.99.13.17:3000/
- **Health Check**: http://91.99.13.17:3000/api/health

### فایل‌های کلیدی:
- [README.md](./README.md) - نقطه شروع
- [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - سریع‌ترین
- [STEP-BY-STEP-GUIDE.md](./STEP-BY-STEP-GUIDE.md) - کامل‌ترین
- [swagger.json](./swagger.json) - OpenAPI Spec

---

## 🎉 خلاصه: کدوم رو بخونم؟

| نیاز من | فایل مناسب | زمان |
|---------|-----------|------|
| جستجوی سریع | [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) | 5 دقیقه |
| یادگیری کامل | [STEP-BY-STEP-GUIDE.md](./STEP-BY-STEP-GUIDE.md) | 30 دقیقه |
| دستورات | [COMMANDS.md](./COMMANDS.md) | 10 دقیقه |
| Swagger | [SWAGGER-QUICKSTART.md](./SWAGGER-QUICKSTART.md) | 5 دقیقه |
| فیلترها | [docs/filters-reference.md](./docs/filters-reference.md) | 15 دقیقه |
| Production | [DEPLOYMENT.md](./DEPLOYMENT.md) | 30 دقیقه |
| معماری | [docs/architecture/overview.md](./docs/architecture/overview.md) | 45 دقیقه |

---

## 🆘 کمک بیشتر

اگر چیزی پیدا نکردی:
1. **Swagger UI** رو باز کن → همه endpoint ها رو ببین
2. **STEP-BY-STEP-GUIDE.md** رو بخون → مثال‌های زیاد داره
3. **tests/** رو ببین → کدهای نمونه واقعی

---

**شروع کن از [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)! 🚀**
