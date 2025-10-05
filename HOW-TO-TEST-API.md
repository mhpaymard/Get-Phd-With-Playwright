# 🎉 راهنمای تست API

## ✅ وضعیت فعلی

**Crawler جدید نصب شد و کار می‌کند!**

### نحوه تست:

## 1️⃣ تست ساده (توصیه می‌شود)

```bash
cd "e:/Projects 2/Real-chatplatform-main/get-phd"
node test-api-simple.js
```

## 2️⃣ تست با curl

```bash
curl -X POST http://91.99.13.17:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "keywords": "machine learning", "page": 1}'
```

## 3️⃣ چک کردن سرور

```bash
# چک لاگ
tail -f server-final.log

# چک وضعیت سرور
curl http://91.99.13.17:3000/api/health

# دیدن swagger
# باز کن: http://91.99.13.17:3000/api-docs
```

## 4️⃣ Restart کردن سرور

```bash
# کشتن تمام process ها
taskkill //F //IM node.exe

# شروع مجدد
cd "e:/Projects 2/Real-chatplatform-main/get-phd"
nohup npm start > server.log 2>&1 &

# چک لاگ بعد از 5 ثانیه
sleep 5 && tail -20 server.log
```

---

## 📊 نتایج تست اخیر

```
✅ Status: SUCCESS
📊 Total Results: 15 PhDs
📄 Current Page: 1
📚 Total Pages: 39

📋 Sample Result:

Title: "Simulation-based Quantum Machine Learning for Advancing AI"
Funding: Self-Funded
Deadline: Year round applications
Description: "We are seeking a highly motivated candidate..."
URL: https://www.findaphd.com/phds/project/...

Quality Analysis:
- With "No title": 0 (0.0%) ✅
- With URL: 15 (100.0%) ✅
- With Description: 15 (100.0%) ✅
- With Funding: 15 (100.0%) ✅
```

---

## 🎯 دستورات مفید

### مشاهده Process های Node

```bash
# Windows
tasklist | grep node

# لینوکس/Mac
ps aux | grep node
```

### Kill کردن سرور

```bash
# Windows
taskkill //F //IM node.exe

# لینوکس/Mac
pkill -f "node.*server.js"
```

### تست سریع

```bash
# یک خط - تست کامل
cd "e:/Projects 2/Real-chatplatform-main/get-phd" && node test-api-simple.js
```

---

## 📝 فایل‌های مهم

- `test-api-simple.js` - تست ساده و خوانا
- `server-final.log` - لاگ سرور
- `CRAWLER-UPGRADE-REPORT.md` - گزارش ارتقا
- `FLUTTER-COMPLETE-GUIDE.md` - راهنمای Flutter

---

## ⚠️ نکات مهم

1. **سرور باید در Background اجرا شود**:
   ```bash
   nohup npm start > server.log 2>&1 &
   ```

2. **قبل از هر restart، process های قبلی رو kill کنید**:
   ```bash
   taskkill //F //IM node.exe
   ```

3. **لاگ‌ها رو چک کنید**:
   ```bash
   tail -f server-final.log
   ```

4. **Port 3000 آزاد باشد**:
   ```bash
   # چک کردن اگر پورت اشغاله
   netstat -ano | grep 3000
   ```

---

## 🚀 مثال API Request

### JavaScript (Node.js)

```javascript
const http = require('http');

const data = JSON.stringify({
  userId: 'user-123',
  keywords: 'artificial intelligence',
  filters: {
    fundingType: '0100', // UK students
    country: 'uk'
  },
  page: 1
});

const options = {
  hostname: '91.99.13.17',
  port: 3000,
  path: '/api/search',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let response = '';
  res.on('data', (chunk) => response += chunk);
  res.on('end', () => console.log(JSON.parse(response)));
});

req.write(data);
req.end();
```

### Python

```python
import requests

response = requests.post(
    'http://91.99.13.17:3000/api/search',
    json={
        'userId': 'user-123',
        'keywords': 'machine learning',
        'page': 1
    }
)

print(response.json())
```

### Flutter (Dart)

```dart
import 'package:dio/dio.dart';

final dio = Dio();

Future<void> search() async {
  final response = await dio.post(
    'http://91.99.13.17:3000/api/search',
    data: {
      'userId': 'user-123',
      'keywords': 'machine learning',
      'page': 1,
    },
  );
  
  print(response.data);
}
```

---

## ✅ همه چیز آماده است!

**مشکل "No title" حل شد!** 🎉

Crawler جدید:
- ✅ Title های واقعی
- ✅ URL های صحیح
- ✅ Description کامل
- ✅ Funding type
- ✅ Deadline
- ✅ Pagination

**API آماده استفاده است!** 🚀
