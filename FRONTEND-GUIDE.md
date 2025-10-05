# 🎨 راهنمای کامل Frontend: اتصال به FindAPhD Search API

> **راهنمای قدم‌به‌قدم برای توسعه‌دهندگان Frontend**

---

## 📋 فهرست مطالب

1. [نمای کلی](#نمای-کلی)
2. [معماری و مفاهیم](#معماری-و-مفاهیم)
3. [راه‌اندازی اولیه](#راهاندازی-اولیه)
4. [فلوچارت کامل](#فلوچارت-کامل)
5. [پیاده‌سازی گام‌به‌گام](#پیادهسازی-گامبهگام)
6. [مدیریت State](#مدیریت-state)
7. [مثال‌های کامل](#مثالهای-کامل)
8. [خطاها و مدیریت آن‌ها](#خطاها-و-مدیریت-آنها)
9. [بهترین روش‌ها](#بهترین-روشها)
10. [UI/UX Patterns](#uiux-patterns)

---

## 🎯 نمای کلی

### API چیست؟
FindAPhD Search API یک سرویس RESTful است که به شما اجازه می‌دهد موقعیت‌های دکترا را از FindAPhD.com جستجو کنید.

### Base URL
```
Development: http://91.99.13.17:3000/api
Production: https://your-domain.com/api
```

### مستندات تعاملی
```
Swagger UI: http://91.99.13.17:3000/api-docs
```

---

## 🏗️ معماری و مفاهیم

### مفاهیم کلیدی

#### 1. **User (کاربر)**
```javascript
const user = {
  userId: "user-123",  // شناسه یکتای کاربر در سیستم شما
  email: "user@example.com",
  name: "Ali Ahmadi"
};
```

#### 2. **Session (نشست)**
```javascript
const session = {
  sessionId: "session-abc-123",  // شناسه یکتای session
  userId: "user-123",            // کاربر مالک
  createdAt: 1696512000000,      // زمان ایجاد
  lifetime: "24 hours"           // مدت زمان اعتبار
};
```

**Session چیست؟**
- یک شناسه یکتا برای هر نشست کاربری
- تاریخچه جستجوهای کاربر را نگه می‌دارد
- State (وضعیت) جستجوها را حفظ می‌کند
- تا 24 ساعت معتبر است

**چرا نیاز است؟**
- ✅ تفکیک جستجوهای مختلف یک کاربر
- ✅ امکان ادامه جستجو از صفحه قبل
- ✅ نگهداری تاریخچه
- ✅ مدیریت State

#### 3. **Search (جستجو)**
```javascript
const search = {
  searchId: "search-xyz-789",       // شناسه یکتای جستجو
  sessionId: "session-abc-123",     // متعلق به کدام session
  query: "artificial intelligence", // کلیدواژه
  filters: {                        // فیلترها
    discipline: "10M7g0",
    geography: ["g0w900"]
  },
  currentPage: 1,                   // صفحه فعلی
  totalPages: 15,                   // تعداد کل صفحات
  results: [...]                    // نتایج
};
```

#### 4. **PhD Result (نتیجه)**
```javascript
const phdResult = {
  title: "PhD in Deep Learning",
  institution: "Oxford University",
  location: "Oxford, UK",
  url: "https://findaphd.com/...",
  funding: "Fully Funded",
  discipline: "Computer Science",
  description: "...",
  publishedDate: "2025-10-01"
};
```

---

## 🚀 راه‌اندازی اولیه

### نصب Dependencies

#### React/Next.js:
```bash
npm install axios
# یا
npm install fetch
```

#### Vue.js:
```bash
npm install axios
```

#### Angular:
```bash
# HttpClient در Angular Built-in است
```

---

## 📊 فلوچارت کامل

```
کاربر وارد App می‌شود
         ↓
    [App Mount]
         ↓
    ایجاد Session برای کاربر
    POST /api/session
    { userId: "user-123" }
         ↓
    دریافت sessionId
    (ذخیره در State/Context)
         ↓
    ┌─────────────────────┐
    │  کاربر آماده است    │
    └─────────────────────┘
         ↓
    ┌─────────────────────────────────────┐
    │  Loop: تا زمانی که App باز است      │
    └─────────────────────────────────────┘
         ↓
    کاربر کلیدواژه و فیلتر وارد می‌کند
         ↓
    [دکمه Search کلیک می‌شود]
         ↓
    POST /api/search
    {
      userId: "user-123",
      sessionId: "xxx",
      keywords: "AI",
      filters: {...}
    }
         ↓
    [Loading State]
    نمایش Spinner/Skeleton
         ↓
    دریافت نتایج
         ↓
    نمایش نتایج به کاربر
         ↓
    [کاربر نتایج را مشاهده می‌کند]
         ↓
         │
         ├──► [می‌خواهد صفحه بعدی ببیند؟]
         │         ↓
         │    POST /api/search/:searchId/continue
         │    { sessionId: "xxx", page: 2 }
         │         ↓
         │    نمایش نتایج صفحه 2
         │         ↓
         │    (برگشت به Loop)
         │
         ├──► [می‌خواهد جستجوی جدید کند؟]
         │         ↓
         │    (برگشت به Loop)
         │
         └──► [App را می‌بندد؟]
                   ↓
              [App Unmount]
                   ↓
              DELETE /api/session/:sessionId
              (Cleanup - اختیاری)
                   ↓
              پایان
```

---

## 💻 پیاده‌سازی گام‌به‌گام

### گام 0: تنظیمات API Client

#### React/Next.js - axios:
```javascript
// src/services/api.js

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://91.99.13.17:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Interceptor برای لاگ کردن خطاها
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### React/Next.js - fetch:
```javascript
// src/services/api.js

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://91.99.13.17:3000/api';

class APIClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export default new APIClient();
```

---

### گام 1: ایجاد Service Layer

```javascript
// src/services/phdSearchService.js

import apiClient from './api';

class PhDSearchService {
  // 1. بررسی سلامت API
  async checkHealth() {
    try {
      const response = await apiClient.get('/health');
      return {
        success: true,
        healthy: response.status === 'healthy',
        availableTabs: response.browser?.availableTabs || 0,
      };
    } catch (error) {
      return {
        success: false,
        healthy: false,
        error: error.message,
      };
    }
  }

  // 2. ایجاد Session
  async createSession(userId) {
    try {
      const response = await apiClient.post('/session', { userId });
      
      if (response.success) {
        return {
          success: true,
          sessionId: response.data.sessionId,
          createdAt: response.data.createdAt,
        };
      }
      
      throw new Error('Failed to create session');
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // 3. انجام جستجو
  async search(params) {
    const { userId, sessionId, keywords, filters = {}, page = 1 } = params;
    
    try {
      const response = await apiClient.post('/search', {
        userId,
        sessionId,
        keywords,
        filters,
        page,
      });
      
      if (response.success) {
        return {
          success: true,
          searchId: response.searchId,
          data: response.data,
        };
      }
      
      throw new Error('Search failed');
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // 4. دریافت صفحه بعدی
  async continueSearch(searchId, sessionId, page) {
    try {
      const response = await apiClient.post(`/search/${searchId}/continue`, {
        sessionId,
        page,
      });
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
        };
      }
      
      throw new Error('Failed to continue search');
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // 5. دریافت تاریخچه
  async getHistory(sessionId) {
    try {
      const response = await apiClient.get(`/search/history/${sessionId}`);
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
        };
      }
      
      throw new Error('Failed to get history');
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // 6. دریافت فیلترهای موجود
  async getAvailableFilters() {
    try {
      const response = await apiClient.post('/search/filters/available');
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
        };
      }
      
      throw new Error('Failed to get filters');
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // 7. حذف Session
  async deleteSession(sessionId) {
    try {
      const response = await apiClient.delete(`/session/${sessionId}`);
      
      return {
        success: response.success,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new PhDSearchService();
```

---

### گام 2: مدیریت State با Context (React)

```javascript
// src/context/PhDSearchContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import phdSearchService from '../services/phdSearchService';

const PhDSearchContext = createContext();

export const usePhDSearch = () => {
  const context = useContext(PhDSearchContext);
  if (!context) {
    throw new Error('usePhDSearch must be used within PhDSearchProvider');
  }
  return context;
};

export const PhDSearchProvider = ({ children, userId }) => {
  // State Management
  const [sessionId, setSessionId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSearch, setCurrentSearch] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);

  // گام 1: Initialize Session when component mounts
  useEffect(() => {
    const initSession = async () => {
      console.log('🔄 Initializing session...');
      
      // چک کردن سلامت API
      const health = await phdSearchService.checkHealth();
      if (!health.healthy) {
        setError('API is not available. Please try again later.');
        return;
      }

      // ✅ گام اول: چک کردن localStorage برای Session موجود
      const storedSession = localStorage.getItem('phdSearchSession');
      
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession);
          const { sessionId: existingSessionId, expiresAt } = sessionData;
          
          // چک کردن Expiration (24 ساعت)
          const now = Date.now();
          if (now < expiresAt) {
            // Session هنوز معتبر است
            console.log('✅ Using existing session:', existingSessionId);
            setSessionId(existingSessionId);
            setIsInitialized(true);
            return; // از ایجاد Session جدید جلوگیری می‌کنیم
          } else {
            // Session منقضی شده
            console.log('⚠️ Session expired, creating new one...');
            localStorage.removeItem('phdSearchSession');
          }
        } catch (error) {
          console.error('Error parsing stored session:', error);
          localStorage.removeItem('phdSearchSession');
        }
      }

      // ✅ گام دوم: ایجاد Session جدید (اگر نداشتیم یا منقضی شده بود)
      const result = await phdSearchService.createSession(userId);
      
      if (result.success) {
        const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 ساعت
        
        // ذخیره در localStorage
        localStorage.setItem('phdSearchSession', JSON.stringify({
          sessionId: result.sessionId,
          userId,
          createdAt: result.createdAt,
          expiresAt,
        }));
        
        setSessionId(result.sessionId);
        setIsInitialized(true);
        console.log('✅ Session created:', result.sessionId);
      } else {
        setError(`Failed to create session: ${result.error}`);
      }
    };

    if (userId && !sessionId) {
      initSession();
    }
  }, [userId, sessionId]);

  // گام 2: Cleanup Session when component unmounts
  useEffect(() => {
    return () => {
      if (sessionId) {
        console.log('🧹 Cleaning up session...');
        // حذف از API (اختیاری - Session خودش بعد 24 ساعت منقضی می‌شود)
        phdSearchService.deleteSession(sessionId);
        
        // حذف از localStorage (اختیاری)
        // localStorage.removeItem('phdSearchSession');
        
        // ⚠️ نکته: معمولاً localStorage را حذف نمی‌کنیم
        // تا کاربر بتواند بعداً ادامه دهد
      }
    };
  }, [sessionId]);

  // متد جستجو با مدیریت Session Expiration
  const search = async (keywords, filters = {}) => {
    if (!sessionId) {
      setError('Session not initialized');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Searching:', keywords, filters);
      
      const result = await phdSearchService.search({
        userId,
        sessionId,
        keywords,
        filters,
        page: 1,
      });

      if (result.success) {
        setCurrentSearch({
          searchId: result.searchId,
          keywords,
          filters,
          ...result.data,
        });
        
        console.log(`✅ Found ${result.data.results.length} results`);
        return result;
      } else {
        // ✅ مدیریت Session Expired
        if (result.error.includes('Session not found') || result.error.includes('404')) {
          console.log('⚠️ Session expired, creating new one...');
          
          // حذف Session قدیمی
          localStorage.removeItem('phdSearchSession');
          setSessionId(null);
          setIsInitialized(false);
          
          // ایجاد Session جدید
          const newSession = await phdSearchService.createSession(userId);
          if (newSession.success) {
            const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
            localStorage.setItem('phdSearchSession', JSON.stringify({
              sessionId: newSession.sessionId,
              userId,
              createdAt: newSession.createdAt,
              expiresAt,
            }));
            
            setSessionId(newSession.sessionId);
            setIsInitialized(true);
            
            // ⚠️ نمایش پیام به کاربر
            setError('Session renewed. Please search again.');
            return null;
          }
        }
        
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // متد دریافت صفحه بعدی
  const loadNextPage = async (page) => {
    if (!currentSearch || !currentSearch.searchId) {
      setError('No active search');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`📄 Loading page ${page}...`);
      
      const result = await phdSearchService.continueSearch(
        currentSearch.searchId,
        sessionId,
        page
      );

      if (result.success) {
        setCurrentSearch((prev) => ({
          ...prev,
          currentPage: result.data.currentPage,
          results: [...prev.results, ...result.data.results], // اضافه کردن به نتایج قبلی
        }));
        
        console.log(`✅ Loaded ${result.data.results.length} more results`);
        return result;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // متد دریافت تاریخچه
  const loadHistory = async () => {
    if (!sessionId) return;

    try {
      const result = await phdSearchService.getHistory(sessionId);
      if (result.success) {
        setSearchHistory(result.data);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  // مقادیری که در دسترس تمام Component ها قرار می‌گیرد
  const value = {
    // State
    sessionId,
    isInitialized,
    loading,
    error,
    currentSearch,
    searchHistory,
    
    // Methods
    search,
    loadNextPage,
    loadHistory,
    clearError: () => setError(null),
  };

  return (
    <PhDSearchContext.Provider value={value}>
      {children}
    </PhDSearchContext.Provider>
  );
};
```

---

### گام 3: استفاده در Component ها

#### App Component (Root):

```javascript
// src/App.js

import React from 'react';
import { PhDSearchProvider } from './context/PhDSearchContext';
import SearchPage from './pages/SearchPage';

function App() {
  // شناسه کاربر از Authentication System شما
  const userId = 'user-123'; // یا از useAuth() hook

  return (
    <PhDSearchProvider userId={userId}>
      <div className="App">
        <SearchPage />
      </div>
    </PhDSearchProvider>
  );
}

export default App;
```

#### Search Page:

```javascript
// src/pages/SearchPage.js

import React, { useState } from 'react';
import { usePhDSearch } from '../context/PhDSearchContext';
import SearchForm from '../components/SearchForm';
import ResultsList from '../components/ResultsList';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

function SearchPage() {
  const {
    isInitialized,
    loading,
    error,
    currentSearch,
    search,
    loadNextPage,
    clearError,
  } = usePhDSearch();

  const [searchParams, setSearchParams] = useState({
    keywords: '',
    discipline: '',
    geography: [],
    funding: [],
  });

  // Handler برای Submit کردن فرم
  const handleSearch = async (e) => {
    e.preventDefault();
    
    const filters = {};
    if (searchParams.discipline) filters.discipline = searchParams.discipline;
    if (searchParams.geography.length > 0) filters.geography = searchParams.geography;
    if (searchParams.funding.length > 0) filters.funding = searchParams.funding;

    await search(searchParams.keywords, filters);
  };

  // Handler برای صفحه بعدی
  const handleLoadMore = async () => {
    if (currentSearch && currentSearch.currentPage < currentSearch.totalPages) {
      await loadNextPage(currentSearch.currentPage + 1);
    }
  };

  // نمایش Loading در حین Initialize
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
        <p>Initializing session...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        Find Your PhD Position
      </h1>

      {/* فرم جستجو */}
      <SearchForm
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        onSubmit={handleSearch}
        loading={loading}
      />

      {/* نمایش خطا */}
      {error && (
        <ErrorAlert error={error} onClose={clearError} />
      )}

      {/* نمایش نتایج */}
      {currentSearch && (
        <>
          <div className="mb-4">
            <p className="text-gray-600">
              Found {currentSearch.results.length} results
              {currentSearch.totalPages > 1 && (
                <span> (Page {currentSearch.currentPage} of {currentSearch.totalPages})</span>
              )}
            </p>
          </div>

          <ResultsList results={currentSearch.results} />

          {/* دکمه Load More */}
          {currentSearch.currentPage < currentSearch.totalPages && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Loading Spinner */}
      {loading && !currentSearch && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
}

export default SearchPage;
```

#### Search Form Component:

```javascript
// src/components/SearchForm.js

import React from 'react';

function SearchForm({ searchParams, setSearchParams, onSubmit, loading }) {
  const disciplines = [
    { value: '10M7g0', label: 'Computer Science' },
    { value: '10M7g1', label: 'Engineering' },
    { value: '10M7g2', label: 'Medicine & Health' },
    { value: '10M7g3', label: 'Business & Management' },
    { value: '10M7g4', label: 'Psychology' },
  ];

  const geographies = [
    { value: 'g0w900', label: 'United Kingdom' },
    { value: 'g0Mw00', label: 'United States' },
    { value: 'g0w800', label: 'Australia' },
    { value: 'g0w700', label: 'Canada' },
    { value: 'g0w600', label: 'Germany' },
  ];

  const fundingTypes = [
    { value: '01M0', label: 'Self-funded' },
    { value: '0100', label: 'Funded PhD Project' },
    { value: '0110', label: 'Studentship' },
  ];

  const handleGeographyChange = (value) => {
    const current = searchParams.geography || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setSearchParams({ ...searchParams, geography: updated });
  };

  const handleFundingChange = (value) => {
    const current = searchParams.funding || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setSearchParams({ ...searchParams, funding: updated });
  };

  return (
    <form onSubmit={onSubmit} className="bg-white shadow-md rounded-lg p-6 mb-8">
      {/* Keywords */}
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">
          Keywords
        </label>
        <input
          type="text"
          value={searchParams.keywords}
          onChange={(e) => setSearchParams({ ...searchParams, keywords: e.target.value })}
          placeholder="e.g., artificial intelligence, machine learning"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Discipline */}
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">
          Discipline
        </label>
        <select
          value={searchParams.discipline}
          onChange={(e) => setSearchParams({ ...searchParams, discipline: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Disciplines</option>
          {disciplines.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Geography */}
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">
          Location (Multiple)
        </label>
        <div className="space-y-2">
          {geographies.map((g) => (
            <label key={g.value} className="flex items-center">
              <input
                type="checkbox"
                checked={searchParams.geography.includes(g.value)}
                onChange={() => handleGeographyChange(g.value)}
                className="mr-2"
              />
              {g.label}
            </label>
          ))}
        </div>
      </div>

      {/* Funding */}
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">
          Funding (Multiple)
        </label>
        <div className="space-y-2">
          {fundingTypes.map((f) => (
            <label key={f.value} className="flex items-center">
              <input
                type="checkbox"
                checked={searchParams.funding.includes(f.value)}
                onChange={() => handleFundingChange(f.value)}
                className="mr-2"
              />
              {f.label}
            </label>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
}

export default SearchForm;
```

#### Results List Component:

```javascript
// src/components/ResultsList.js

import React from 'react';

function ResultsList({ results }) {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No results found. Try different search terms.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <div
          key={result.url || index}
          className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          {/* Title */}
          <h3 className="text-xl font-bold text-blue-600 mb-2">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {result.title}
            </a>
          </h3>

          {/* Institution & Location */}
          <div className="text-gray-700 mb-2">
            <span className="font-semibold">{result.institution}</span>
            {result.location && (
              <span className="text-gray-500"> • {result.location}</span>
            )}
          </div>

          {/* Funding & Discipline */}
          <div className="flex gap-2 mb-3">
            {result.funding && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                {result.funding}
              </span>
            )}
            {result.discipline && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {result.discipline}
              </span>
            )}
            {result.studyType && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                {result.studyType}
              </span>
            )}
          </div>

          {/* Description */}
          {result.description && (
            <p className="text-gray-600 text-sm line-clamp-3">
              {result.description}
            </p>
          )}

          {/* Published Date */}
          {result.publishedDate && (
            <div className="mt-3 text-xs text-gray-400">
              Published: {new Date(result.publishedDate).toLocaleDateString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ResultsList;
```

---

## 🎨 UI/UX Patterns

### Pattern 1: Infinite Scroll

```javascript
// src/components/InfiniteScrollResults.js

import React, { useEffect, useRef } from 'react';
import { usePhDSearch } from '../context/PhDSearchContext';
import ResultsList from './ResultsList';

function InfiniteScrollResults() {
  const { currentSearch, loading, loadNextPage } = usePhDSearch();
  const observerRef = useRef();
  const lastElementRef = useRef();

  useEffect(() => {
    // Intersection Observer برای تشخیص رسیدن به انتهای لیست
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          const canLoadMore = 
            currentSearch && 
            currentSearch.currentPage < currentSearch.totalPages;
          
          if (canLoadMore) {
            loadNextPage(currentSearch.currentPage + 1);
          }
        }
      },
      { threshold: 1.0 }
    );

    if (lastElementRef.current) {
      observer.observe(lastElementRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [currentSearch, loading, loadNextPage]);

  if (!currentSearch) return null;

  return (
    <div>
      <ResultsList results={currentSearch.results} />
      
      {/* Sentinel element برای Infinite Scroll */}
      <div ref={lastElementRef} className="h-10" />
      
      {loading && (
        <div className="text-center py-4">
          Loading more results...
        </div>
      )}
      
      {currentSearch.currentPage >= currentSearch.totalPages && (
        <div className="text-center py-4 text-gray-500">
          No more results
        </div>
      )}
    </div>
  );
}

export default InfiniteScrollResults;
```

### Pattern 2: Pagination

```javascript
// src/components/PaginatedResults.js

import React from 'react';
import { usePhDSearch } from '../context/PhDSearchContext';
import ResultsList from './ResultsList';

function PaginatedResults() {
  const { currentSearch, loading, search } = usePhDSearch();

  const handlePageChange = async (page) => {
    // جستجوی مجدد با همان پارامترها اما صفحه متفاوت
    await search(currentSearch.keywords, currentSearch.filters, page);
    
    // Scroll به بالا
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!currentSearch) return null;

  const { currentPage, totalPages } = currentSearch;

  // محاسبه صفحات قابل نمایش
  const getPageNumbers = () => {
    const pages = [];
    const maxPages = 7; // حداکثر تعداد صفحات نمایشی
    
    let start = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let end = Math.min(totalPages, start + maxPages - 1);
    
    if (end - start < maxPages - 1) {
      start = Math.max(1, end - maxPages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div>
      <ResultsList results={currentSearch.results} />
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          {/* Previous */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>

          {/* First Page */}
          {pages[0] > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="px-4 py-2 border rounded"
              >
                1
              </button>
              {pages[0] > 2 && <span>...</span>}
            </>
          )}

          {/* Page Numbers */}
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              disabled={page === currentPage || loading}
              className={`px-4 py-2 border rounded ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}

          {/* Last Page */}
          {pages[pages.length - 1] < totalPages && (
            <>
              {pages[pages.length - 1] < totalPages - 1 && <span>...</span>}
              <button
                onClick={() => handlePageChange(totalPages)}
                className="px-4 py-2 border rounded"
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Next */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default PaginatedResults;
```

### Pattern 3: Search History

```javascript
// src/components/SearchHistory.js

import React, { useEffect } from 'react';
import { usePhDSearch } from '../context/PhDSearchContext';

function SearchHistory() {
  const { searchHistory, loadHistory, search } = usePhDSearch();

  useEffect(() => {
    loadHistory();
  }, []);

  const handleRerun = (historyItem) => {
    search(historyItem.query, historyItem.filters);
  };

  if (!searchHistory || searchHistory.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4">
        No search history yet
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Search History</h2>
      
      <div className="space-y-3">
        {searchHistory.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center p-3 border rounded hover:bg-gray-50"
          >
            <div>
              <div className="font-semibold">{item.query || 'No keywords'}</div>
              <div className="text-sm text-gray-500">
                {new Date(item.createdAt).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">
                Page {item.currentPage} of {item.totalPages}
              </div>
            </div>
            
            <button
              onClick={() => handleRerun(item)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Rerun
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchHistory;
```

---

## ⚠️ خطاها و مدیریت آن‌ها

### انواع خطاها:

#### 1. Session Not Found (404)
```javascript
// کاربر Session منقضی شده دارد
{
  "error": "Session not found"
}
```

**راه حل:**
```javascript
async function handleSessionError(error, userId) {
  if (error.includes('Session not found')) {
    // ایجاد Session جدید
    const newSession = await phdSearchService.createSession(userId);
    return newSession.sessionId;
  }
  throw error;
}
```

#### 2. Service Unavailable (503)
```javascript
// تمام Tab ها پر هستند
{
  "ready": false,
  "availableTabs": 0,
  "queueLength": 10
}
```

**راه حل:**
```javascript
async function searchWithRetry(params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await phdSearchService.search(params);
      return result;
    } catch (error) {
      if (error.includes('503') && i < maxRetries - 1) {
        // صبر 5 ثانیه و دوباره تلاش
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      throw error;
    }
  }
}
```

#### 3. Network Error
```javascript
// عدم اتصال به سرور
```

**راه حل:**
```javascript
function ErrorBoundary({ error, retry }) {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <strong>Error:</strong> {error}
      <button
        onClick={retry}
        className="ml-4 px-4 py-2 bg-red-600 text-white rounded"
      >
        Retry
      </button>
    </div>
  );
}
```

---

## ✅ بهترین روش‌ها

### 1. Session Management
```javascript
// ✅ درست: یک Session برای کل نشست
useEffect(() => {
  const initSession = async () => {
    const session = await createSession(userId);
    setSessionId(session.sessionId);
  };
  initSession();
  
  return () => {
    // Cleanup
    if (sessionId) {
      deleteSession(sessionId);
    }
  };
}, [userId]);

// ❌ اشتباه: هر بار Session جدید
const handleSearch = async () => {
  const session = await createSession(userId); // اشتباه!
  await search(session.sessionId, keywords);
};
```

### 2. Error Handling
```javascript
// ✅ درست: با try-catch
try {
  const result = await search(keywords);
  setResults(result.data);
} catch (error) {
  setError(error.message);
  // نمایش notification به کاربر
}

// ❌ اشتباه: بدون مدیریت خطا
const result = await search(keywords);
setResults(result.data); // اگر خطا بده، کل app crash می‌کنه
```

### 3. Loading States
```javascript
// ✅ درست: Loading برای هر عملیات
const [loading, setLoading] = useState(false);

const handleSearch = async () => {
  setLoading(true);
  try {
    await search(keywords);
  } finally {
    setLoading(false); // حتماً در finally
  }
};

// ❌ اشتباه: فراموش کردن Loading
const handleSearch = async () => {
  setLoading(true);
  await search(keywords);
  // اگر خطا بده، loading همیشه true می‌مونه!
};
```

### 4. Debouncing برای Search
```javascript
// ✅ درست: با debounce
import { debounce } from 'lodash';

const debouncedSearch = debounce(async (keywords) => {
  await search(keywords);
}, 500);

// کاربر تایپ می‌کنه، فقط یک بار API call می‌شود
onChange={(e) => debouncedSearch(e.target.value)}
```

---

## 📦 خلاصه Checklist

### برای هر کاربر جدید:
- [ ] ایجاد Session هنگام ورود به App
- [ ] ذخیره sessionId در State/Context
- [ ] Setup Cleanup برای حذف Session

### برای هر جستجو:
- [ ] دریافت ورودی کاربر (keywords + filters)
- [ ] فراخوانی API با sessionId
- [ ] نمایش Loading State
- [ ] مدیریت خطاها
- [ ] نمایش نتایج

### برای صفحه‌بندی:
- [ ] نمایش تعداد صفحات
- [ ] دکمه/Infinite Scroll برای صفحه بعدی
- [ ] نمایش Loading برای صفحات جدید

### Cleanup:
- [ ] حذف Session هنگام خروج از App
- [ ] Clear Error States
- [ ] Cancel pending requests

---

## 🎉 خلاصه نهایی

### فرایند کلی برای هر کاربر:

```
1. کاربر وارد App می‌شود
   → ایجاد Session
   
2. کاربر جستجو می‌کند
   → POST /api/search با sessionId
   → نمایش نتایج
   
3. کاربر صفحه بعدی می‌خواهد
   → POST /api/search/:id/continue
   → نمایش نتایج بیشتر
   
4. کاربر جستجوی جدید می‌کند
   → POST /api/search با sessionId (همان Session)
   
5. کاربر از App خارج می‌شود
   → DELETE /api/session/:id (Cleanup)
```

---

**فایل‌های مهم برای مطالعه بیشتر:**
- [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - مثال‌های سریع
- [STEP-BY-STEP-GUIDE.md](./STEP-BY-STEP-GUIDE.md) - راهنمای کامل API
- [SESSION-MANAGEMENT-GUIDE.md](./SESSION-MANAGEMENT-GUIDE.md) - جزئیات Session
- Swagger UI: http://91.99.13.17:3000/api-docs

**🎉 حالا آماده‌ای برای پیاده‌سازی Frontend!**
