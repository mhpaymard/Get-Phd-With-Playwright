# 📱 راهنمای کامل Flutter: اتصال به FindAPhD Search API

> **راهنمای جامع برای توسعه‌دهندگان Flutter با فلوچارت‌های دقیق**

---

## 📋 فهرست مطالب

1. [نمای کلی](#نمای-کلی)
2. [معماری و مفاهیم](#معماری-و-مفاهیم)
3. [نصب Dependencies](#نصب-dependencies)
4. [فلوچارت کامل](#فلوچارت-کامل)
5. [پیاده‌سازی گام‌به‌گام](#پیادهسازی-گامبهگام)
6. [State Management](#state-management)
7. [UI Components](#ui-components)
8. [مدیریت خطاها](#مدیریت-خطاها)
9. [بهترین روش‌ها](#بهترین-روشها)
10. [تست و دیباگ](#تست-و-دیباگ)

---

## 🎯 نمای کلی

### API چیست؟
FindAPhD Search API یک سرویس RESTful است که موقعیت‌های دکترا را جستجو می‌کند.

###Base URL
```dart
const String baseUrl = 'http://localhost:3000/api';  // Development
const String baseUrl = 'https://your-domain.com/api'; // Production
```

### Swagger Documentation
```
http://localhost:3000/api-docs
```

---

## 🏗️ معماری و مفاهیم

### مفاهیم کلیدی

#### 1. **User (کاربر)**
```dart
class User {
  final String userId;
  final String? email;
  final String? name;
  
  User({
    required this.userId,
    this.email,
    this.name,
  });
}
```

#### 2. **Session (نشست)**
```dart
class Session {
  final String sessionId;
  final String userId;
  final DateTime createdAt;
  final DateTime expiresAt;  // 24 ساعت بعد از createdAt
  
  Session({
    required this.sessionId,
    required this.userId,
    required this.createdAt,
    required this.expiresAt,
  });
  
  bool get isExpired => DateTime.now().isAfter(expiresAt);
  bool get isValid => !isExpired;
}
```

**Session چیست؟**
- شناسه یکتای نشست کاربری
- تاریخچه جستجوها را نگه می‌دارد
- تا 24 ساعت معتبر است
- در `SharedPreferences` یا `Hive` ذخیره می‌شود

#### 3. **Search Result**
```dart
class PhdResult {
  final String title;
  final String url;
  final String institution;
  final String location;
  final String? discipline;
  final String? funding;
  final String? publishedDate;
  final String? description;
  final String? studyType;
  final int index;
  
  PhdResult({
    required this.title,
    required this.url,
    required this.institution,
    required this.location,
    this.discipline,
    this.funding,
    this.publishedDate,
    this.description,
    this.studyType,
    required this.index,
  });
  
  factory PhdResult.fromJson(Map<String, dynamic> json) {
    return PhdResult(
      title: json['title'] ?? 'No title',
      url: json['url'] ?? '',
      institution: json['institution'] ?? '',
      location: json['location'] ?? '',
      discipline: json['discipline'],
      funding: json['funding'],
      publishedDate: json['publishedDate'],
      description: json['description'],
      studyType: json['studyType'],
      index: json['index'] ?? 0,
    );
  }
}
```

#### 4. **Search Response**
```dart
class SearchResponse {
  final String searchId;
  final String sessionId;
  final List<PhdResult> results;
  final int currentPage;
  final int totalPages;
  final String query;
  
  SearchResponse({
    required this.searchId,
    required this.sessionId,
    required this.results,
    required this.currentPage,
    required this.totalPages,
    required this.query,
  });
  
  bool get hasNextPage => currentPage < totalPages;
  bool get hasPreviousPage => currentPage > 1;
}
```

---

## 📦 نصب Dependencies

```yaml
# pubspec.yaml

dependencies:
  flutter:
    sdk: flutter
  
  # HTTP Client
  dio: ^5.4.0              # پیشنهادی برای HTTP requests
  # یا
  http: ^1.1.0             # کتابخانه استاندارد
  
  # State Management
  provider: ^6.1.1         # ساده و قدرتمند
  # یا
  riverpod: ^2.4.9         # پیشرفته‌تر
  # یا
  bloc: ^8.1.3             # برای پروژه‌های بزرگ
  
  # Storage
  shared_preferences: ^2.2.2  # ذخیره Session
  
  # JSON Serialization
  json_annotation: ^4.8.1
  
  # UI
  infinite_scroll_pagination: ^4.0.0  # Pagination
  cached_network_image: ^3.3.1        # Cache images
  shimmer: ^3.0.0                     # Loading skeleton

dev_dependencies:
  build_runner: ^2.4.7
  json_serializable: ^6.7.1
```

نصب:
```bash
flutter pub get
```

---

## 📊 فلوچارت کامل

### فلوچارت اصلی (Main Flow)

```
┌──────────────────────────────────────────────────────────────┐
│                  START: App Launch                            │
│              کاربر اپلیکیشن را باز می‌کند                    │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   initState() یا     │
                  │   main() اجرا می‌شود │
                  └──────────┬───────────┘
                             │
                             ▼
              ┌─────────────────────────────┐
              │  دریافت userId از Auth      │
              │  (از Firebase, Supabase,    │
              │   یا Local Storage)          │
              └──────────┬──────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  چک کردن Session در                │
         │  SharedPreferences/Hive            │
         │                                    │
         │  final prefs = await               │
         │    SharedPreferences.getInstance();│
         │  String? sessionData =             │
         │    prefs.getString('phdSession');  │
         └──────────┬────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
  [Session دارد؟]        [Session نداره؟]
        │                       │
        ▼                       │
┌───────────────────┐          │
│  Decode Session   │          │
│  از JSON          │          │
└────────┬──────────┘          │
         │                      │
         ▼                      │
┌────────────────────┐         │
│  چک Expiration     │         │
│  DateTime.now() <  │         │
│  expiresAt?        │         │
└────────┬───────────┘         │
         │                      │
    ┌────┴────┐                │
    │         │                │
    ▼         ▼                │
 [معتبر]  [منقضی]             │
    │         │                │
    │         └────────┐       │
    │                  │       │
    │                  ▼       │
    │      ┌────────────────────────┐
    │      │ حذف Session منقضی شده │
    │      │ prefs.remove()         │
    │      └──────────┬─────────────┘
    │                 │               │
    │                 └───────────────┘
    │                                 │
    │    ┌────────────────────────────┘
    │    │
    │    ▼
    │  ┌─────────────────────────────────┐
    │  │  ایجاد Session جدید             │
    │  │  POST /api/session              │
    │  │  body: { userId: "xxx" }        │
    │  └──────────────┬──────────────────┘
    │                 │
    │                 ▼
    │       ┌──────────────────────┐
    │       │  دریافت sessionId    │
    │       │  از Response          │
    │       └─────────┬────────────┘
    │                 │
    │                 ▼
    │    ┌──────────────────────────────┐
    │    │  ذخیره Session جدید          │
    │    │  در SharedPreferences        │
    │    │  به صورت JSON                │
    │    │  با expiresAt = now + 24h    │
    │    └──────────┬───────────────────┘
    │               │
    └───────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Session آماده است!  │
         │  setState() یا        │
         │  notifyListeners()    │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────────┐
         │  نمایش HomePage          │
         │  کاربر می‌تواند جستجو کند│
         └──────────┬───────────────┘
                    │
                    ▼
         ╔═══════════════════════════════╗
         ║  MAIN LOOP: User Actions      ║
         ║  تا زمان بستن اپلیکیشن       ║
         ╚═══════════╤═══════════════════╝
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   [جستجو]    [صفحه بعدی]  [تاریخچه]
        │            │            │
        │            │            │
        └────────────┴────────────┘
                     │
                     ▼
              [ادامه فرایند]


┌──────────────────────────────────────────────────────────────┐
│                  END: App Close                               │
│              کاربر اپلیکیشن را می‌بندد                       │
│                                                                │
│                  ▼                                             │
│         ┌────────────────────┐                                │
│         │  dispose() اجرا شود │                                │
│         └────────┬───────────┘                                │
│                  │                                             │
│                  ▼                                             │
│         ┌────────────────────────────┐                        │
│         │  Cleanup (اختیاری)         │                        │
│         │  DELETE /api/session/:id   │                        │
│         │  (معمولاً نیازی نیست)      │                        │
│         └────────────────────────────┘                        │
│                  │                                             │
│                  ▼                                             │
│         ┌────────────────────────────┐                        │
│         │  Session در Storage         │                        │
│         │  باقی می‌ماند برای بعد      │                        │
│         └────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────┘
```

---

### فلوچارت دقیق: جستجو (Search Flow)

```
کاربر TextField را پر می‌کند و دکمه Search می‌زند
                    ↓
           ┌────────────────┐
           │  onPressed()   │
           │  _handleSearch()│
           └────────┬───────┘
                    │
                    ▼
           ┌────────────────────┐
           │  Validation        │
           │  - keywords.isEmpty?│
           │  - sessionId != null?│
           └────────┬───────────┘
                    │
                    ▼
           ┌─────────────────────┐
           │  setState(() {      │
           │    _isLoading = true│
           │    _error = null    │
           │  })                 │
           └────────┬────────────┘
                    │
                    ▼
      ┌──────────────────────────────┐
      │  API Call                    │
      │  POST /api/search            │
      │  {                           │
      │    userId: currentUser.id,   │
      │    sessionId: _sessionId,    │
      │    keywords: _keywords,      │
      │    filters: _selectedFilters,│
      │    page: 1                   │
      │  }                           │
      └──────────┬───────────────────┘
                 │
                 ▼
         [API Response]
                 │
      ┌──────────┴──────────┐
      │                     │
      ▼                     ▼
  [Success 200]        [Error]
      │                     │
      │                     ▼
      │          ┌──────────────────────┐
      │          │  مدیریت خطا           │
      │          │                       │
      │          │  404 Session expired? │
      │          │    → ایجاد Session جدید│
      │          │    → Retry search     │
      │          │                       │
      │          │  503 No tabs?        │
      │          │    → نمایش "Busy"    │
      │          │    → Retry بعد 5s    │
      │          │                       │
      │          │  Network error?      │
      │          │    → نمایش خطا        │
      │          │    → دکمه Retry       │
      │          └──────────────────────┘
      │
      ▼
┌───────────────────────┐
│  Parse Response       │
│  final response =     │
│    SearchResponse     │
│      .fromJson(data); │
└───────┬───────────────┘
        │
        ▼
┌────────────────────────┐
│  Update State          │
│  setState(() {         │
│    _searchId = ...     │
│    _results = ...      │
│    _currentPage = 1    │
│    _totalPages = ...   │
│    _isLoading = false  │
│  })                    │
└────────┬───────────────┘
         │
         ▼
┌─────────────────────────┐
│  Render Results         │
│  ListView.builder(      │
│    itemCount: results,  │
│    itemBuilder: ...     │
│  )                      │
└─────────────────────────┘
         │
         ▼
  [کاربر نتایج را می‌بیند]
```

---

### فلوچارت دقیق: صفحه بعدی (Load More)

```
کاربر به انتهای لیست می‌رسد یا دکمه "Load More" می‌زند
                    ↓
           ┌────────────────┐
           │  onReachEnd()  │
           │  _loadMore()   │
           └────────┬───────┘
                    │
                    ▼
          ┌──────────────────┐
          │  چک کردن:        │
          │  - hasNextPage?  │
          │  - !_isLoading?  │
          │  - searchId?     │
          └────────┬─────────┘
                   │
                   ▼
          ┌───────────────────┐
          │  setState(() {    │
          │    _isLoadingMore =│
          │      true         │
          │  })               │
          └────────┬──────────┘
                   │
                   ▼
      ┌─────────────────────────────┐
      │  API Call                   │
      │  POST /api/search/:id/continue
      │  {                          │
      │    sessionId: _sessionId,   │
      │    page: _currentPage + 1   │
      │  }                          │
      └──────────┬──────────────────┘
                 │
                 ▼
         [API Response]
                 │
      ┌──────────┴──────────┐
      │                     │
      ▼                     ▼
  [Success]            [Error]
      │                     │
      │                     ▼
      │              [مدیریت خطا]
      │
      ▼
┌──────────────────────────┐
│  Parse New Results       │
│  final newResults =      │
│    response.data.results;│
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────────┐
│  Update State                │
│  setState(() {               │
│    _results.addAll(newResults);│
│    _currentPage++;           │
│    _isLoadingMore = false;   │
│  })                          │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  Scroll to New Items         │
│  (اختیاری)                   │
│  _scrollController.animateTo()│
└──────────────────────────────┘
           │
           ▼
    [نمایش نتایج بیشتر]
```

---

## 💻 پیاده‌سازی گام‌به‌گام

### گام 0: تنظیمات API Client

```dart
// lib/services/api_client.dart

import 'package:dio/dio.dart';

class ApiClient {
  static const String baseUrl = 'http://localhost:3000/api';
  
  late final Dio _dio;
  
  ApiClient() {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
        },
      ),
    );
    
    // Interceptor برای logging
    _dio.interceptors.add(
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        error: true,
      ),
    );
  }
  
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) {
    return _dio.get(path, queryParameters: queryParameters);
  }
  
  Future<Response> post(String path, {dynamic data}) {
    return _dio.post(path, data: data);
  }
  
  Future<Response> delete(String path) {
    return _dio.delete(path);
  }
}
```

---

### گام 1: ایجاد Service Layer

```dart
// lib/services/phd_search_service.dart

import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';
import '../models/session.dart';
import '../models/search_response.dart';

class PhDSearchService {
  final ApiClient _apiClient = ApiClient();
  
  // 1. چک کردن سلامت API
  Future<bool> checkHealth() async {
    try {
      final response = await _apiClient.get('/health');
      return response.statusCode == 200 && 
             response.data['status'] == 'healthy';
    } catch (e) {
      print('Health check failed: $e');
      return false;
    }
  }
  
  // 2. مدیریت Session
  
  /// دریافت Session از Storage
  Future<Session?> getStoredSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final sessionJson = prefs.getString('phdSession');
      
      if (sessionJson == null) return null;
      
      final sessionData = jsonDecode(sessionJson);
      final session = Session.fromJson(sessionData);
      
      // چک expiration
      if (session.isExpired) {
        await prefs.remove('phdSession');
        return null;
      }
      
      return session;
    } catch (e) {
      print('Error getting stored session: $e');
      return null;
    }
  }
  
  /// ذخیره Session در Storage
  Future<void> saveSession(Session session) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final sessionJson = jsonEncode(session.toJson());
      await prefs.setString('phdSession', sessionJson);
    } catch (e) {
      print('Error saving session: $e');
    }
  }
  
  /// ایجاد Session جدید
  Future<Session?> createSession(String userId) async {
    try {
      final response = await _apiClient.post('/session', data: {
        'userId': userId,
      });
      
      if (response.statusCode == 200 && response.data['success'] == true) {
        final sessionId = response.data['data']['sessionId'];
        final createdAt = DateTime.fromMillisecondsSinceEpoch(
          response.data['data']['createdAt']
        );
        
        final session = Session(
          sessionId: sessionId,
          userId: userId,
          createdAt: createdAt,
          expiresAt: createdAt.add(const Duration(hours: 24)),
        );
        
        await saveSession(session);
        return session;
      }
      
      return null;
    } catch (e) {
      print('Error creating session: $e');
      return null;
    }
  }
  
  /// مدیریت Session با Auto-renewal
  Future<Session?> ensureValidSession(String userId) async {
    // چک Session موجود
    Session? session = await getStoredSession();
    
    if (session != null && session.isValid) {
      return session;
    }
    
    // ایجاد Session جدید
    return await createSession(userId);
  }
  
  // 3. جستجو
  
  Future<SearchResponse?> search({
    required String userId,
    required String sessionId,
    required String keywords,
    Map<String, dynamic>? filters,
    int page = 1,
  }) async {
    try {
      final response = await _apiClient.post('/search', data: {
        'userId': userId,
        'sessionId': sessionId,
        'keywords': keywords,
        if (filters != null) 'filters': filters,
        'page': page,
      });
      
      if (response.statusCode == 200 && response.data['success'] == true) {
        return SearchResponse.fromJson(response.data);
      }
      
      // مدیریت Session expired
      if (response.statusCode == 404 || 
          response.data['error']?.contains('Session not found') == true) {
        // Session منقضی شده - خطا را throw کن برای handling در UI
        throw SessionExpiredException();
      }
      
      return null;
    } catch (e) {
      print('Error searching: $e');
      rethrow;
    }
  }
  
  // 4. ادامه جستجو (صفحه بعدی)
  
  Future<SearchResponse?> continueSearch({
    required String searchId,
    required String sessionId,
    required int page,
  }) async {
    try {
      final response = await _apiClient.post(
        '/search/$searchId/continue',
        data: {
          'sessionId': sessionId,
          'page': page,
        },
      );
      
      if (response.statusCode == 200 && response.data['success'] == true) {
        return SearchResponse.fromJson(response.data);
      }
      
      return null;
    } catch (e) {
      print('Error continuing search: $e');
      rethrow;
    }
  }
  
  // 5. تاریخچه
  
  Future<List<SearchResponse>> getHistory(String sessionId) async {
    try {
      final response = await _apiClient.get('/search/history/$sessionId');
      
      if (response.statusCode == 200 && response.data['success'] == true) {
        final List<dynamic> historyData = response.data['data'];
        return historyData
            .map((item) => SearchResponse.fromJson({'data': item}))
            .toList();
      }
      
      return [];
    } catch (e) {
      print('Error getting history: $e');
      return [];
    }
  }
  
  // 6. حذف Session
  
  Future<bool> deleteSession(String sessionId) async {
    try {
      final response = await _apiClient.delete('/session/$sessionId');
      
      if (response.statusCode == 200) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('phdSession');
        return true;
      }
      
      return false;
    } catch (e) {
      print('Error deleting session: $e');
      return false;
    }
  }
}

// Custom Exception برای Session Expired
class SessionExpiredException implements Exception {
  final String message;
  SessionExpiredException([this.message = 'Session expired']);
  
  @override
  String toString() => message;
}
```

---

### گام 2: Model Classes

```dart
// lib/models/session.dart

class Session {
  final String sessionId;
  final String userId;
  final DateTime createdAt;
  final DateTime expiresAt;
  
  Session({
    required this.sessionId,
    required this.userId,
    required this.createdAt,
    required this.expiresAt,
  });
  
  bool get isExpired => DateTime.now().isAfter(expiresAt);
  bool get isValid => !isExpired;
  
  // Convert to JSON
  Map<String, dynamic> toJson() => {
    'sessionId': sessionId,
    'userId': userId,
    'createdAt': createdAt.millisecondsSinceEpoch,
    'expiresAt': expiresAt.millisecondsSinceEpoch,
  };
  
  // Create from JSON
  factory Session.fromJson(Map<String, dynamic> json) => Session(
    sessionId: json['sessionId'],
    userId: json['userId'],
    createdAt: DateTime.fromMillisecondsSinceEpoch(json['createdAt']),
    expiresAt: DateTime.fromMillisecondsSinceEpoch(json['expiresAt']),
  );
}
```

```dart
// lib/models/phd_result.dart

class PhdResult {
  final String title;
  final String url;
  final String institution;
  final String location;
  final String? discipline;
  final String? funding;
  final String? publishedDate;
  final String? description;
  final String? studyType;
  final int index;
  
  PhdResult({
    required this.title,
    required this.url,
    required this.institution,
    required this.location,
    this.discipline,
    this.funding,
    this.publishedDate,
    this.description,
    this.studyType,
    required this.index,
  });
  
  factory PhdResult.fromJson(Map<String, dynamic> json) => PhdResult(
    title: json['title'] ?? 'No title',
    url: json['url'] ?? '',
    institution: json['institution'] ?? '',
    location: json['location'] ?? '',
    discipline: json['discipline'],
    funding: json['funding'],
    publishedDate: json['publishedDate'],
    description: json['description'],
    studyType: json['studyType'],
    index: json['index'] ?? 0,
  );
  
  Map<String, dynamic> toJson() => {
    'title': title,
    'url': url,
    'institution': institution,
    'location': location,
    'discipline': discipline,
    'funding': funding,
    'publishedDate': publishedDate,
    'description': description,
    'studyType': studyType,
    'index': index,
  };
}
```

```dart
// lib/models/search_response.dart

import 'phd_result.dart';

class SearchResponse {
  final String searchId;
  final String sessionId;
  final List<PhdResult> results;
  final int currentPage;
  final int totalPages;
  final String query;
  
  SearchResponse({
    required this.searchId,
    required this.sessionId,
    required this.results,
    required this.currentPage,
    required this.totalPages,
    required this.query,
  });
  
  bool get hasNextPage => currentPage < totalPages;
  bool get hasPreviousPage => currentPage > 1;
  
  factory SearchResponse.fromJson(Map<String, dynamic> json) {
    final data = json['data'];
    final List<dynamic> resultsJson = data['results'] ?? [];
    
    return SearchResponse(
      searchId: json['searchId'] ?? data['id'],
      sessionId: json['sessionId'] ?? data['sessionId'],
      query: data['query'] ?? '',
      currentPage: data['currentPage'] ?? 1,
      totalPages: data['totalPages'] ?? 1,
      results: resultsJson
          .map((item) => PhdResult.fromJson(item))
          .toList(),
    );
  }
}
```

---

بذار ادامه راهنمای Flutter رو در فایل بعدی بنویسم چون خیلی طولانی شد:

**⏭️ ادامه در فایل بعدی...**
