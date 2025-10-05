# 📥 راهنمای دانلود فایل Swagger JSON

این راهنما تمام روش‌های دانلود فایل `swagger.json` را شرح می‌دهد.

---

## 🎯 روش‌های دانلود

### ✅ روش 1: دانلود مستقیم از API (آسان‌ترین)

```bash
# دانلود با curl
curl -o swagger.json http://91.99.13.17:3000/swagger.json
```

یا با مرورگر:
```
http://91.99.13.17:3000/swagger.json
```

**مزایا:**
- ✅ آسان‌ترین روش
- ✅ همیشه آخرین نسخه
- ✅ دانلود اتوماتیک فایل
- ✅ قابل اشتراک‌گذاری با دیگران

---

### ✅ روش 2: کپی مستقیم فایل

فایل `swagger.json` در root پروژه قرار دارد:

```bash
# در Windows
copy "e:\Projects 2\Real-chatplatform-main\get-phd\swagger.json" %USERPROFILE%\Desktop\

# در Linux/Mac
cp swagger.json ~/Desktop/
```

**مزایا:**
- ✅ سریع
- ✅ نیاز به سرور ندارد
- ✅ آفلاین

**معایب:**
- ❌ ممکن است قدیمی باشه

---

### ✅ روش 3: دانلود از Swagger UI

1. باز کنید: http://91.99.13.17:3000/api-docs
2. کلیک کنید روی `/swagger.json` endpoint
3. فایل اتوماتیک دانلود می‌شه

---

### ✅ روش 4: دانلود با wget

```bash
wget http://91.99.13.17:3000/swagger.json -O swagger-api.json
```

---

### ✅ روش 5: دانلود با PowerShell

```powershell
Invoke-WebRequest -Uri http://91.99.13.17:3000/swagger.json -OutFile swagger.json
```

---

### ✅ روش 6: دانلود با Node.js

```javascript
const fs = require('fs');
const https = require('http');

const file = fs.createWriteStream('swagger.json');
https.get('http://91.99.13.17:3000/swagger.json', (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('✅ Downloaded!');
  });
});
```

---

### ✅ روش 7: دانلود با Python

```python
import requests

response = requests.get('http://91.99.13.17:3000/swagger.json')
with open('swagger.json', 'w', encoding='utf-8') as f:
    f.write(response.text)
print('✅ Downloaded!')
```

---

## 🚀 دانلود سریع (یک دستور)

```bash
# شروع سرور + دانلود
npm start &
sleep 3
curl -o swagger.json http://91.99.13.17:3000/swagger.json
echo "✅ Downloaded to: $(pwd)/swagger.json"
```

---

## 📱 برای Flutter Developer

### دانلود و استفاده در Flutter:

```bash
# دانلود
curl -o swagger.json http://91.99.13.17:3000/swagger.json

# استفاده در Flutter (با swagger_dart_code_generator)
flutter pub add swagger_dart_code_generator
flutter pub run build_runner build
```

یا استفاده از URL مستقیم:

```dart
// در Flutter
final swaggerUrl = 'http://91.99.13.17:3000/swagger.json';
```

---

## 🌐 دانلود از Production

اگر API در production هست:

```bash
# دانلود از سرور production
curl -o swagger.json https://api.yourdomain.com/swagger.json
```

---

## 📊 محتویات فایل

فایل شامل:
- ✅ 10 API Endpoints
- ✅ 21 Schema Models
- ✅ مستندات کامل فارسی
- ✅ مثال‌های Request/Response
- ✅ توضیحات Error Codes

---

## 🔍 بررسی فایل دانلود شده

```bash
# بررسی سایز
ls -lh swagger.json

# بررسی محتوا (اولین 30 خط)
head -30 swagger.json

# بررسی با jq (format شده)
cat swagger.json | jq '.'

# بررسی تعداد endpoints
cat swagger.json | jq '.paths | length'

# بررسی تعداد schemas
cat swagger.json | jq '.components.schemas | length'
```

---

## ✅ تست دانلود

```bash
# تست اینکه سرور در حال اجراست
curl http://91.99.13.17:3000/api/health

# دانلود
curl -o test-swagger.json http://91.99.13.17:3000/swagger.json

# چک کردن موفقیت
if [ -f test-swagger.json ]; then
    echo "✅ Downloaded successfully!"
    echo "Size: $(du -h test-swagger.json | cut -f1)"
else
    echo "❌ Download failed!"
fi
```

---

## 🎁 اسکریپت دانلود خودکار

یک فایل `download-swagger.sh` بساز:

```bash
#!/bin/bash

echo "📥 Downloading Swagger JSON..."

# چک کردن سرور
if ! curl -s http://91.99.13.17:3000/api/health > /dev/null; then
    echo "❌ Server is not running!"
    echo "💡 Start server with: npm start"
    exit 1
fi

# دانلود
curl -s -o swagger.json http://91.99.13.17:3000/swagger.json

# تایید
if [ -f swagger.json ]; then
    SIZE=$(du -h swagger.json | cut -f1)
    echo "✅ Downloaded successfully!"
    echo "📄 File: swagger.json"
    echo "📊 Size: $SIZE"
    echo ""
    echo "📋 Contents:"
    echo "   - $(cat swagger.json | jq '.paths | length') endpoints"
    echo "   - $(cat swagger.json | jq '.components.schemas | length') schemas"
else
    echo "❌ Download failed!"
    exit 1
fi
```

اجرا:
```bash
chmod +x download-swagger.sh
./download-swagger.sh
```

---

## 💡 نکات مهم

### ⚠️ قبل از دانلود:
1. مطمئن شوید سرور در حال اجراست:
   ```bash
   npm start
   ```

2. چک کنید سرور روی port 3000 هست:
   ```bash
   curl http://91.99.13.17:3000/api/health
   ```

### ✅ بعد از دانلود:
1. فایل رو validate کنید:
   ```bash
   cat swagger.json | jq '.' > /dev/null && echo "Valid JSON" || echo "Invalid JSON"
   ```

2. سایز رو چک کنید (باید حدود 27KB باشه):
   ```bash
   ls -lh swagger.json
   ```

---

## 🔗 لینک‌های مفید

- **Swagger UI**: http://91.99.13.17:3000/api-docs
- **Download Endpoint**: http://91.99.13.17:3000/swagger.json
- **API Info**: http://91.99.13.17:3000/
- **Health Check**: http://91.99.13.17:3000/api/health

---

## 🆘 مشکلات رایج

### مشکل 1: "Connection refused"

**علت:** سرور در حال اجرا نیست

**راه حل:**
```bash
npm start
```

---

### مشکل 2: "404 Not Found"

**علت:** URL اشتباه است

**راه حل:** از URL صحیح استفاده کنید:
```
http://91.99.13.17:3000/swagger.json
```

نه:
- ❌ http://91.99.13.17:3000/api/swagger.json
- ❌ http://91.99.13.17:3000/api-docs/swagger.json

---

### مشکل 3: فایل خالی یا ناقص

**علت:** دانلود قطع شده

**راه حل:**
```bash
# حذف فایل قبلی
rm swagger.json

# دانلود مجدد
curl -o swagger.json http://91.99.13.17:3000/swagger.json

# چک کردن سایز
ls -lh swagger.json
```

---

## 📞 پشتیبانی

اگر مشکلی پیش اومد:
1. ابتدا سرور رو restart کنید
2. لاگ‌ها رو چک کنید: `tail -f server.log`
3. Health check کنید: `curl http://91.99.13.17:3000/api/health`

---

**تاریخ:** 5 اکتبر 2025
**نسخه API:** 1.0.0
