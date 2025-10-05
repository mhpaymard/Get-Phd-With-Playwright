# 📱 دستورالعمل کامل تحویلی برای Flutter Developer

## 🎯 خلاصه پروژه

**FindAPhD Search API** - سیستم جستجوی موقعیت‌های دکترا از سایت FindAPhD.com

---

## 🌐 API Base URL

```
Development:  http://localhost:3000/api
Production:   https://api.yourdomain.com/api
```

---

## 📚 Swagger Documentation

**URL:** `http://localhost:3000/api-docs`

در مرورگر باز کنید و تمام Endpoint ها، Request/Response ها و Example ها را مشاهده کنید.

---

## 🔑 Authentication & Session

### ⚠️ نکته مهم: Session Management

**API از Session-based authentication استفاده می‌کند**

#### فلوی کامل:

```
1. کاربر اپ را باز می‌کند
   ↓
2. چک می‌کنید: آیا sessionId ذخیره شده دارید؟
   ↓
3. اگر نه → POST /api/session با userId
   ↓
4. sessionId را در SharedPreferences ذخیره کنید
   ↓
5. برای همه درخواست‌های بعدی از همین sessionId استفاده کنید
   ↓
6. اگر خطای 404 Session not found گرفتید → Session جدید بسازید
```

---

## 🚀 Quick Start Guide

### 1️⃣ ایجاد Session

**اولین کاری که باید انجام دهید**

```http
POST /api/session
Content-Type: application/json

{
  "userId": "user-123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "98b91932-8ab8-4479-a4b9-9e091b0bdb6d",
    "userId": "user-123",
    "createdAt": 1728145123000
  }
}
```

**کد Flutter:**

```dart
Future<Session?> createSession(String userId) async {
  try {
    final response = await dio.post(
      '/session',
      data: {'userId': userId},
    );
    
    final sessionId = response.data['data']['sessionId'];
    
    // ذخیره در SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('session_id', sessionId);
    await prefs.setString('user_id', userId);
    
    return Session.fromJson(response.data['data']);
  } catch (e) {
    print('Error creating session: $e');
    return null;
  }
}
```

---

### 2️⃣ جستجوی ساده

```http
POST /api/search
Content-Type: application/json

{
  "userId": "user-123",
  "sessionId": "98b91932-8ab8-4479-a4b9-9e091b0bdb6d",
  "keywords": "machine learning",
  "page": 1
}
```

**Response:**

```json
{
  "success": true,
  "sessionId": "98b91932-8ab8-4479-a4b9-9e091b0bdb6d",
  "searchId": "16e4fb7a-030a-44b9-8f5b-ab461b72fcdf",
  "status": "completed",
  "data": {
    "id": "16e4fb7a-030a-44b9-8f5b-ab461b72fcdf",
    "query": "machine learning",
    "currentPage": 1,
    "totalPages": 39,
    "results": [
      {
        "title": "PhD in Machine Learning and AI",
        "url": "https://www.findaphd.com/phds/project/...",
        "institution": "University of Oxford - Department of Computer Science",
        "location": "",
        "discipline": "",
        "funding": "Fully Funded",
        "publishedDate": "2025-10-01",
        "description": "This PhD project focuses on...",
        "studyType": "PhD Research Project",
        "deadline": "31 December 2025",
        "supervisor": "Dr John Smith",
        "index": 1
      }
      // ... more results
    ],
    "fromCache": false,
    "createdAt": 1728145200000,
    "updatedAt": 1728145210000
  }
}
```

**کد Flutter:**

```dart
Future<SearchResponse?> search({
  required String keywords,
  int page = 1,
  Map<String, dynamic>? filters,
}) async {
  try {
    final prefs = await SharedPreferences.getInstance();
    final sessionId = prefs.getString('session_id');
    final userId = prefs.getString('user_id');
    
    if (sessionId == null || userId == null) {
      throw Exception('No session found');
    }
    
    final response = await dio.post(
      '/search',
      data: {
        'userId': userId,
        'sessionId': sessionId,
        'keywords': keywords,
        'filters': filters,
        'page': page,
      },
    );
    
    return SearchResponse.fromJson(response.data['data']);
    
  } on DioException catch (e) {
    if (e.response?.statusCode == 404) {
      // Session expired - create new one
      final userId = prefs.getString('user_id');
      await createSession(userId!);
      // Retry
      return search(keywords: keywords, page: page, filters: filters);
    }
    rethrow;
  }
}
```

---

### 3️⃣ Pagination (صفحه بعدی)

```http
POST /api/search/{searchId}/continue
Content-Type: application/json

{
  "sessionId": "98b91932-8ab8-4479-a4b9-9e091b0bdb6d",
  "page": 2
}
```

**کد Flutter:**

```dart
Future<SearchResponse?> loadMore({
  required String searchId,
  required int nextPage,
}) async {
  try {
    final prefs = await SharedPreferences.getInstance();
    final sessionId = prefs.getString('session_id');
    
    final response = await dio.post(
      '/search/$searchId/continue',
      data: {
        'sessionId': sessionId,
        'page': nextPage,
      },
    );
    
    return SearchResponse.fromJson(response.data['data']);
  } catch (e) {
    print('Error loading more: $e');
    return null;
  }
}
```

---

### 4️⃣ Health Check

```http
GET /api/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-10-05T12:00:00.000Z",
  "uptime": 3600,
  "browser": {
    "maxTabs": 100,
    "activeTabs": 5,
    "availableTabs": 95
  }
}
```

---

## 🎨 Models (Dart)

### Session Model

```dart
class Session {
  final String sessionId;
  final String userId;
  final int createdAt;
  
  Session({
    required this.sessionId,
    required this.userId,
    required this.createdAt,
  });
  
  factory Session.fromJson(Map<String, dynamic> json) {
    return Session(
      sessionId: json['sessionId'],
      userId: json['userId'],
      createdAt: json['createdAt'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'sessionId': sessionId,
      'userId': userId,
      'createdAt': createdAt,
    };
  }
}
```

### PhD Result Model

```dart
class PhdResult {
  final String title;
  final String url;
  final String? institution;
  final String? location;
  final String? discipline;
  final String? funding;
  final String? publishedDate;
  final String? description;
  final String? studyType;
  final String? deadline;
  final String? supervisor;
  final int index;
  
  PhdResult({
    required this.title,
    required this.url,
    this.institution,
    this.location,
    this.discipline,
    this.funding,
    this.publishedDate,
    this.description,
    this.studyType,
    this.deadline,
    this.supervisor,
    required this.index,
  });
  
  factory PhdResult.fromJson(Map<String, dynamic> json) {
    return PhdResult(
      title: json['title'] ?? 'No title',
      url: json['url'] ?? '',
      institution: json['institution'],
      location: json['location'],
      discipline: json['discipline'],
      funding: json['funding'],
      publishedDate: json['publishedDate'],
      description: json['description'],
      studyType: json['studyType'],
      deadline: json['deadline'],
      supervisor: json['supervisor'],
      index: json['index'] ?? 0,
    );
  }
}
```

### Search Response Model

```dart
class SearchResponse {
  final String id;
  final String query;
  final int currentPage;
  final int totalPages;
  final List<PhdResult> results;
  final bool fromCache;
  final int createdAt;
  final int updatedAt;
  
  SearchResponse({
    required this.id,
    required this.query,
    required this.currentPage,
    required this.totalPages,
    required this.results,
    required this.fromCache,
    required this.createdAt,
    required this.updatedAt,
  });
  
  factory SearchResponse.fromJson(Map<String, dynamic> json) {
    return SearchResponse(
      id: json['id'],
      query: json['query'],
      currentPage: json['currentPage'],
      totalPages: json['totalPages'] ?? 1,
      results: (json['results'] as List)
          .map((r) => PhdResult.fromJson(r))
          .toList(),
      fromCache: json['fromCache'] ?? false,
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
    );
  }
  
  bool get hasNextPage => currentPage < totalPages;
}
```

---

## 🔧 Dio Configuration

```dart
import 'package:dio/dio.dart';

class ApiClient {
  static const String baseUrl = 'http://localhost:3000/api';
  
  late final Dio dio;
  
  ApiClient() {
    dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
      },
    ));
    
    // Logging interceptor
    dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
    ));
    
    // Error handling interceptor
    dio.interceptors.add(InterceptorsWrapper(
      onError: (error, handler) {
        print('API Error: ${error.message}');
        print('Status Code: ${error.response?.statusCode}');
        print('Response: ${error.response?.data}');
        handler.next(error);
      },
    ));
  }
}
```

---

## ⚠️ Error Handling

### خطاهای احتمالی:

| Status Code | معنی | راه حل |
|-------------|------|--------|
| 400 | Bad Request | پارامترهای درخواست را چک کنید |
| 404 | Session/Search Not Found | Session جدید بسازید |
| 500 | Server Error | بعداً دوباره تلاش کنید |
| 503 | Service Unavailable | سرور شلوغ است - retry |

### مثال Error Handling:

```dart
try {
  final response = await search(keywords: 'AI');
  // Success
} on DioException catch (e) {
  if (e.response?.statusCode == 404) {
    // Session expired
    await createSession(userId);
    // Retry
  } else if (e.response?.statusCode == 503) {
    // Server busy
    showSnackBar('سرور شلوغ است. لطفاً چند لحظه دیگر تلاش کنید');
  } else {
    showSnackBar('خطا در ارتباط با سرور');
  }
} catch (e) {
  showSnackBar('خطای غیرمنتظره: $e');
}
```

---

## 📊 Data Flow

```
App Start
    ↓
Check SharedPreferences for sessionId
    ↓
├─ If exists → Use it
└─ If not → POST /api/session → Save sessionId
    ↓
User enters search query
    ↓
POST /api/search with sessionId
    ↓
Display results
    ↓
User scrolls to bottom
    ↓
POST /api/search/{searchId}/continue
    ↓
Append new results to list
```

---

## 🧪 تست API

### با curl:

```bash
# 1. Create session
curl -X POST http://localhost:3000/api/session \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user"}'

# 2. Search
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "sessionId": "YOUR_SESSION_ID",
    "keywords": "machine learning",
    "page": 1
  }'
```

### با اسکریپت Node.js:

```bash
cd /path/to/project
node test-api-simple.js
```

---

## 📝 نکات مهم

### ✅ باید انجام دهید:

1. **Session را ذخیره کنید** در SharedPreferences
2. **Error Handling** برای 404 (Session expired)
3. **Retry Logic** برای 503 (Server busy)
4. **Loading States** نمایش دهید
5. **Pagination** پیاده‌سازی کنید

### ❌ نباید انجام دهید:

1. Session ID را hard-code نکنید
2. بدون Error Handling درخواست نزنید
3. همه نتایج را یکجا Load نکنید (از Pagination استفاده کنید)
4. userId را خالی نفرستید

---

## 🎯 Checklist پیاده‌سازی

- [ ] نصب `dio` و `shared_preferences`
- [ ] ایجاد ApiClient
- [ ] پیاده‌سازی Session Management
- [ ] پیاده‌سازی Search
- [ ] پیاده‌سازی Pagination
- [ ] Error Handling
- [ ] Loading States
- [ ] UI Components (SearchBar, ResultCard, ListView)
- [ ] Test با داده‌های واقعی

---

## 📚 فایل‌های مرتبط

1. **FLUTTER-COMPLETE-GUIDE.md** - راهنمای جامع Flutter با کد کامل
2. **swagger.json** - مستندات کامل API
3. **HOW-TO-TEST-API.md** - راهنمای تست API
4. **CRAWLER-UPGRADE-REPORT.md** - گزارش تغییرات Crawler

---

## 🆘 پشتیبانی

**اگر مشکلی پیش آمد:**

1. Swagger را چک کنید: `http://localhost:3000/api-docs`
2. Health Check بزنید: `http://localhost:3000/api/health`
3. لاگ‌های سرور را ببینید
4. با تیم Backend تماس بگیرید

---

## ✅ API آماده استفاده است!

**Base URL:** `http://localhost:3000/api`
**Swagger:** `http://localhost:3000/api-docs`
**Status:** ✅ Working (Crawler جدید نصب شده)

**موفق باشید!** 🚀
