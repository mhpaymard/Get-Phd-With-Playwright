# 📱 راهنمای کامل Flutter + فلوچارت‌های دقیق

برای Flutter Developer - تمام آنچه نیاز دارید

---

## ⚠️ مشکل فعلی API

**API در حال حاضر "No title" برمی‌گرداند!**

علت: Selector های web crawler با ساختار جدید سایت FindAPhD مطابقت ندارند.

**راه حل:**
1. Backend developer باید selector های `playwrightCrawler.js` را به‌روز کند
2. یا شما می‌توانید از Mock Data برای توسعه استفاده کنید

---

## 🔧 تا زمان Fix شدن Crawler

### استفاده از Mock Data

```dart
// lib/services/mock_phd_service.dart

class MockPhDService {
  Future<SearchResponse> mockSearch() async {
    // شبیه‌سازی تاخیر شبکه
    await Future.delayed(Duration(seconds: 2));
    
    return SearchResponse(
      searchId: 'mock-search-${DateTime.now().millisecondsSinceEpoch}',
      sessionId: 'mock-session-123',
      query: 'artificial intelligence',
      currentPage: 1,
      totalPages: 10,
      results: [
        PhdResult(
          title: 'PhD in Machine Learning and Deep Neural Networks',
          url: 'https://findaphd.com/phds/project/...',
          institution: 'University of Oxford',
          location: 'Oxford, UK',
          discipline: 'Computer Science',
          funding: 'Fully Funded',
          publishedDate: '2025-10-01',
          description: 'This PhD project focuses on developing novel deep learning algorithms...',
          studyType: 'Full-time',
          index: 1,
        ),
        PhdResult(
          title: 'Artificial Intelligence for Healthcare Applications',
          url: 'https://findaphd.com/phds/project/...',
          institution: 'Imperial College London',
          location: 'London, UK',
          discipline: 'Computer Science & Medicine',
          funding: 'Studentship',
          publishedDate: '2025-09-28',
          description: 'Research into AI applications for medical diagnosis and treatment...',
          studyType: 'Full-time',
          index: 2,
        ),
        PhdResult(
          title: 'Natural Language Processing and Computational Linguistics',
          url: 'https://findaphd.com/phds/project/...',
          institution: 'University of Cambridge',
          location: 'Cambridge, UK',
          discipline: 'Computer Science',
          funding: 'Self-funded',
          publishedDate: '2025-09-25',
          description: 'Advanced NLP research focusing on transformer architectures...',
          studyType: 'Full-time',
          index: 3,
        ),
        // ... 7 مورد دیگر
      ],
    );
  }
}
```

---

## 📊 فلوچارت‌های دقیق

### 1. Lifecycle کامل App

```
App Launch
    ↓
main() اجرا شود
    ↓
runApp(MyApp())
    ↓
MyApp build شود
    ↓
───────────────────────────────────────
Provider/Riverpod Initialization
───────────────────────────────────────
    ↓
PhDSearchProvider ایجاد شود
    ↓
initState() فراخوانی شود
    ↓
┌────────────────────────────────┐
│ STEP 1: Initialize Session     │
└────────────┬───────────────────┘
             │
             ▼
   ┌─────────────────────┐
   │ دریافت userId       │
   │ از Auth یا Storage  │
   └──────────┬──────────┘
              │
              ▼
┌──────────────────────────────┐
│ چک SharedPreferences          │
│ برای Session موجود            │
└──────────┬───────────────────┘
           │
      ┌────┴────┐
      ▼         ▼
   [دارد]   [نداره]
      │         │
      ▼         │
┌─────────────┐ │
│ پارس JSON   │ │
│ چک Expiration│ │
└─────┬───────┘ │
      │         │
  ┌───┴───┐     │
  ▼       ▼     │
[معتبر] [منقضی] │
  │       │     │
  │       └─────┘
  │             │
  │             ▼
  │    ┌────────────────┐
  │    │ POST /api/session
  │    │ با userId       │
  │    └────────┬───────┘
  │             │
  │             ▼
  │    ┌────────────────┐
  │    │ ذخیره Session  │
  │    │ در Storage     │
  │    └────────┬───────┘
  │             │
  └─────────────┘
                │
                ▼
       ┌────────────────┐
       │ notifyListeners()
       │ یا setState()   │
       └────────┬───────┘
                │
                ▼
       ┌────────────────┐
       │ HomePage ساخته  │
       │ می‌شود          │
       └────────┬───────┘
                │
                ▼
       [کاربر UI را می‌بیند]
```

### 2. جستجو (Search Flow)

```
کاربر TextField پر می‌کند
        ↓
دکمه Search زده می‌شود
        ↓
onPressed() → _handleSearch()
        ↓
Validation
  - keywords.isNotEmpty?
  - _session != null?
        ↓
     [valid]
        ↓
setState(() => _isLoading = true)
        ↓
POST /api/search {
  userId: currentUser.id,
  sessionId: _session.sessionId,
  keywords: _searchController.text,
  filters: {...},
  page: 1
}
        ↓
    [Response]
        │
    ┌───┴───┐
    ▼       ▼
[Success] [Error]
    │       │
    │       ├─ 404 Session? → renewSession() → retry
    │       ├─ 503 Busy? → showBusyDialog() → retry
    │       └─ Other? → showError()
    │
    ▼
Parse SearchResponse
    ↓
setState(() {
  _searchResponse = response,
  _results = response.results,
  _isLoading = false
})
    ↓
ListView ساخته می‌شود
    ↓
[نمایش نتایج]
```

### 3. Pagination (Load More)

```
کاربر scroll می‌کند
        ↓
به انتهای لیست می‌رسد
        ↓
ScrollController.position.pixels >=
  maxScrollExtent - threshold
        ↓
_loadMoreResults() فراخوانی شود
        ↓
چک شرایط:
  - hasNextPage?
  - !_isLoadingMore?
  - _searchResponse != null?
        ↓
     [valid]
        ↓
setState(() => _isLoadingMore = true)
        ↓
POST /api/search/:id/continue {
  sessionId: _session.sessionId,
  page: _currentPage + 1
}
        ↓
    [Response]
        ↓
Parse newResults
        ↓
setState(() {
  _results.addAll(newResults),
  _currentPage++,
  _isLoadingMore = false
})
        ↓
ListView به‌روز می‌شود
        ↓
[نمایش نتایج بیشتر]
```

---

## 💻 کد کامل Flutter

### State Management با Provider

```dart
// lib/providers/phd_search_provider.dart

import 'package:flutter/foundation.dart';
import '../services/phd_search_service.dart';
import '../models/session.dart';
import '../models/search_response.dart';
import '../models/phd_result.dart';

class PhDSearchProvider with ChangeNotifier {
  final PhDSearchService _service = PhDSearchService();
  final String userId;
  
  Session? _session;
  SearchResponse? _currentSearch;
  List<PhdResult> _results = [];
  bool _isLoading = false;
  bool _isLoadingMore = false;
  String? _error;
  
  // Getters
  Session? get session => _session;
  SearchResponse? get currentSearch => _currentSearch;
  List<PhdResult> get results => _results;
  bool get isLoading => _isLoading;
  bool get isLoadingMore => _isLoadingMore;
  String? get error => _error;
  bool get hasNextPage => _currentSearch?.hasNextPage ?? false;
  bool get isInitialized => _session != null;
  
  PhDSearchProvider({required this.userId}) {
    _initialize();
  }
  
  // Initialize Session
  Future<void> _initialize() async {
    try {
      debugPrint('🔄 Initializing session...');
      
      // چک سلامت API
      final isHealthy = await _service.checkHealth();
      if (!isHealthy) {
        _error = 'API is not available';
        notifyListeners();
        return;
      }
      
      // دریافت یا ایجاد Session
      _session = await _service.ensureValidSession(userId);
      
      if (_session == null) {
        _error = 'Failed to create session';
      } else {
        debugPrint('✅ Session initialized: ${_session!.sessionId}');
      }
      
      notifyListeners();
      
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      debugPrint('❌ Initialize error: $e');
    }
  }
  
  // جستجو
  Future<void> search({
    required String keywords,
    Map<String, dynamic>? filters,
  }) async {
    if (_session == null) {
      await _initialize();
      if (_session == null) return;
    }
    
    _isLoading = true;
    _error = null;
    _results = [];
    notifyListeners();
    
    try {
      debugPrint('🔍 Searching: $keywords');
      
      final response = await _service.search(
        userId: userId,
        sessionId: _session!.sessionId,
        keywords: keywords,
        filters: filters,
      );
      
      if (response != null) {
        _currentSearch = response;
        _results = response.results;
        debugPrint('✅ Found ${_results.length} results');
      } else {
        _error = 'Search failed';
      }
      
    } on SessionExpiredException {
      // Session منقضی شده - تلاش برای renewal
      debugPrint('⚠️  Session expired, renewing...');
      await _initialize();
      
      // Retry search
      if (_session != null) {
        return search(keywords: keywords, filters: filters);
      }
      
    } catch (e) {
      _error = e.toString();
      debugPrint('❌ Search error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // صفحه بعدی
  Future<void> loadMore() async {
    if (_isLoadingMore || !hasNextPage || _currentSearch == null) {
      return;
    }
    
    _isLoadingMore = true;
    notifyListeners();
    
    try {
      final nextPage = _currentSearch!.currentPage + 1;
      debugPrint('📄 Loading page $nextPage...');
      
      final response = await _service.continueSearch(
        searchId: _currentSearch!.searchId,
        sessionId: _session!.sessionId,
        page: nextPage,
      );
      
      if (response != null) {
        _results.addAll(response.results);
        _currentSearch = SearchResponse(
          searchId: _currentSearch!.searchId,
          sessionId: _currentSearch!.sessionId,
          query: _currentSearch!.query,
          currentPage: nextPage,
          totalPages: _currentSearch!.totalPages,
          results: _results,
        );
        debugPrint('✅ Loaded ${response.results.length} more results');
      }
      
    } catch (e) {
      _error = e.toString();
      debugPrint('❌ Load more error: $e');
    } finally {
      _isLoadingMore = false;
      notifyListeners();
    }
  }
  
  // پاک کردن نتایج
  void clearResults() {
    _results = [];
    _currentSearch = null;
    _error = null;
    notifyListeners();
  }
  
  // Cleanup
  @override
  void dispose() {
    // اختیاری: حذف session
    // if (_session != null) {
    //   _service.deleteSession(_session!.sessionId);
    // }
    super.dispose();
  }
}
```

### UI Components

```dart
// lib/screens/home_screen.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/phd_search_provider.dart';
import '../widgets/search_bar_widget.dart';
import '../widgets/results_list_widget.dart';

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Find Your PhD'),
        elevation: 0,
      ),
      body: Consumer<PhDSearchProvider>(
        builder: (context, provider, child) {
          // چک initialization
          if (!provider.isInitialized && provider.error == null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Initializing...'),
                ],
              ),
            );
          }
          
          // نمایش خطای initialization
          if (!provider.isInitialized && provider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red),
                  SizedBox(height: 16),
                  Text(
                    'Failed to connect',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 8),
                  Text(provider.error!),
                  SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      // Retry
                      final newProvider = PhDSearchProvider(userId: 'user-123');
                      context.read<PhDSearchProvider>();
                    },
                    child: Text('Retry'),
                  ),
                ],
              ),
            );
          }
          
          // UI اصلی
          return Column(
            children: [
              SearchBarWidget(),
              Expanded(child: ResultsListWidget()),
            ],
          );
        },
      ),
    );
  }
}
```

```dart
// lib/widgets/search_bar_widget.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/phd_search_provider.dart';

class SearchBarWidget extends StatefulWidget {
  @override
  _SearchBarWidgetState createState() => _SearchBarWidgetState();
}

class _SearchBarWidgetState extends State<SearchBarWidget> {
  final _searchController = TextEditingController();
  
  void _handleSearch() {
    final keywords = _searchController.text.trim();
    
    if (keywords.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please enter search keywords')),
      );
      return;
    }
    
    context.read<PhDSearchProvider>().search(keywords: keywords);
  }
  
  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search PhD positions...',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.search),
              ),
              onSubmitted: (_) => _handleSearch(),
            ),
          ),
          SizedBox(width: 8),
          ElevatedButton(
            onPressed: _handleSearch,
            child: Text('Search'),
            style: ElevatedButton.styleFrom(
              padding: EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            ),
          ),
        ],
      ),
    );
  }
}
```

```dart
// lib/widgets/results_list_widget.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/phd_search_provider.dart';
import 'phd_result_card.dart';

class ResultsListWidget extends StatefulWidget {
  @override
  _ResultsListWidgetState createState() => _ResultsListWidgetState();
}

class _ResultsListWidgetState extends State<ResultsListWidget> {
  final _scrollController = ScrollController();
  
  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }
  
  void _onScroll() {
    if (_isBottom) {
      context.read<PhDSearchProvider>().loadMore();
    }
  }
  
  bool get _isBottom {
    if (!_scrollController.hasClients) return false;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.offset;
    return currentScroll >= (maxScroll * 0.9); // 90% threshold
  }
  
  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Consumer<PhDSearchProvider>(
      builder: (context, provider, child) {
        // Loading state
        if (provider.isLoading) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text('Searching...'),
              ],
            ),
          );
        }
        
        // Error state
        if (provider.error != null && provider.results.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline, size: 64, color: Colors.red),
                SizedBox(height: 16),
                Text(
                  'Error',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 8),
                Text(provider.error!),
              ],
            ),
          );
        }
        
        // Empty state
        if (provider.results.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.search, size: 64, color: Colors.grey),
                SizedBox(height: 16),
                Text(
                  'No results yet',
                  style: TextStyle(fontSize: 18, color: Colors.grey),
                ),
                Text('Try searching for something'),
              ],
            ),
          );
        }
        
        // Results list
        return ListView.builder(
          controller: _scrollController,
          itemCount: provider.results.length + 1, // +1 for loading indicator
          itemBuilder: (context, index) {
            // نمایش loading در انتها
            if (index == provider.results.length) {
              if (provider.isLoadingMore) {
                return Padding(
                  padding: EdgeInsets.all(16),
                  child: Center(child: CircularProgressIndicator()),
                );
              } else if (provider.hasNextPage) {
                return SizedBox.shrink();
              } else {
                return Padding(
                  padding: EdgeInsets.all(16),
                  child: Center(
                    child: Text(
                      'No more results',
                      style: TextStyle(color: Colors.grey),
                    ),
                  ),
                );
              }
            }
            
            final result = provider.results[index];
            return PhDResultCard(result: result);
          },
        );
      },
    );
  }
}
```

```dart
// lib/widgets/phd_result_card.dart

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/phd_result.dart';

class PhDResultCard extends StatelessWidget {
  final PhdResult result;
  
  const PhDResultCard({required this.result});
  
  Future<void> _launchUrl() async {
    final uri = Uri.parse(result.url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      child: InkWell(
        onTap: _launchUrl,
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title
              Text(
                result.title,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue[700],
                ),
              ),
              SizedBox(height: 8),
              
              // Institution & Location
              Row(
                children: [
                  Icon(Icons.school, size: 16, color: Colors.grey[600]),
                  SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      '${result.institution}${result.location.isNotEmpty ? " • ${result.location}" : ""}',
                      style: TextStyle(color: Colors.grey[700]),
                    ),
                  ),
                ],
              ),
              
              // Tags
              if (result.funding != null ||
                  result.discipline != null ||
                  result.studyType != null)
                Padding(
                  padding: EdgeInsets.only(top: 12),
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      if (result.funding != null)
                        _buildChip(result.funding!, Colors.green),
                      if (result.discipline != null)
                        _buildChip(result.discipline!, Colors.blue),
                      if (result.studyType != null)
                        _buildChip(result.studyType!, Colors.purple),
                    ],
                  ),
                ),
              
              // Description
              if (result.description != null && result.description!.isNotEmpty)
                Padding(
                  padding: EdgeInsets.only(top: 12),
                  child: Text(
                    result.description!,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: Colors.grey[600], fontSize: 14),
                  ),
                ),
              
              // Published Date
              if (result.publishedDate != null)
                Padding(
                  padding: EdgeInsets.only(top: 8),
                  child: Text(
                    'Published: ${result.publishedDate}',
                    style: TextStyle(color: Colors.grey[500], fontSize: 12),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildChip(String label, Color color) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color[700],
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
```

### Main App

```dart
// lib/main.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/phd_search_provider.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => PhDSearchProvider(
        userId: 'user-123', // از Authentication system دریافت کنید
      ),
      child: MaterialApp(
        title: 'FindAPhD',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          scaffoldBackgroundColor: Colors.grey[100],
        ),
        home: HomeScreen(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
```

---

## ✅ خلاصه چک‌لیست

### برای Flutter Developer:

- [ ] نصب dependencies (dio, provider, shared_preferences)
- [ ] ایجاد Model Classes (Session, PhdResult, SearchResponse)
- [ ] ایجاد ApiClient
- [ ] ایجاد PhDSearchService
- [ ] ایجاد PhDSearchProvider با State Management
- [ ] ایجاد UI Widgets (SearchBar, ResultsList, ResultCard)
- [ ] تست با Mock Data (تا crawler fix شود)
- [ ] تست با API واقعی (بعد از fix)
- [ ] Handle کردن خطاها
- [ ] پیاده‌سازی Pagination
- [ ] بهینه‌سازی Performance

---

## 🐛 مشکل Crawler و راه حل

**مشکل فعلی:** تمام نتایج "No title" هستند

**علت:** Selector های `playwrightCrawler.js` با ساختار HTML جدید سایت مطابقت ندارند

**راه حل Backend:**
1. باز کردن `src/workers/playwrightCrawler.js`
2. به‌روز کردن selector ها در method `_extractDetailedResults`
3. تست مجدد

**راه حل شما (موقت):**
استفاده از Mock Data تا backend fix شود

---

**📚 فایل‌های مرتبط:**
- [DEBUG-CRAWLER-GUIDE.md](./DEBUG-CRAWLER-GUIDE.md) - راهنمای رفع مشکل crawler
- [FLUTTER-GUIDE-PART1.md](./FLUTTER-GUIDE-PART1.md) - جزئیات بیشتر

**🎉 همه چیز آماده است برای شروع توسعه Flutter!**
