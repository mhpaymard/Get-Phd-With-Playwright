// Search Service - سرویس اصلی جستجو با Playwright
const browserPool = require('../browserPool');
const sessionManager = require('../sessionManager');
const { prepare } = require('../../services/searchOrchestrator');
const { load: loadDictionary, getState } = require('../../core/dictionary');
const FindAPhDCrawler = require('../../workers/playwrightCrawler');

class SearchService {
  constructor() {
    this.cache = new Map(); // کش ساده برای نتایج
    this.cacheTimeout = 15 * 60 * 1000; // 15 دقیقه
    this.crawler = new FindAPhDCrawler(browserPool); // استفاده از crawler جدید
    loadDictionary(); // بارگذاری dictionary
  }

  /**
   * انجام جستجو
   */
  async performSearch({ sessionId, userId, keywords, filters, page = 1 }) {
    // ساخت URL با استفاده از orchestrator
    const preparedSearch = prepare({
      keywords,
      filters: this._normalizeFilters(filters),
      page
    });

    // ذخیره state جستجو
    const searchState = sessionManager.saveSearchState(sessionId, {
      query: keywords,
      filters,
      page,
      url: preparedSearch.url,
      status: 'pending'
    });

    // بررسی کش
    const cacheKey = preparedSearch.key;
    const cached = this._getFromCache(cacheKey);
    if (cached) {
      console.log(`[SearchService] Cache hit for key: ${cacheKey}`);
      
      // به‌روزرسانی state با نتایج از کش
      sessionManager.updateSearchState(sessionId, searchState.id, {
        status: 'completed',
        results: cached.results,
        totalPages: cached.totalPages,
        fromCache: true
      });

      return sessionManager.getSession(sessionId).searches.find(s => s.id === searchState.id);
    }

    // انجام جستجو با Crawler جدید
    try {
      // به‌روزرسانی status به in-progress
      sessionManager.updateSearchState(sessionId, searchState.id, {
        status: 'in-progress'
      });

      console.log(`[SearchService] Starting search for session ${sessionId}`);

      // استفاده از crawler جدید
      const crawlResult = await this.crawler.crawlSearchPage(
        keywords,
        this._normalizeFiltersForCrawler(filters),
        page
      );

      // ذخیره در کش
      this._saveToCache(cacheKey, { 
        results: crawlResult.results, 
        totalPages: crawlResult.totalPages 
      });

      // به‌روزرسانی state
      sessionManager.updateSearchState(sessionId, searchState.id, {
        status: 'completed',
        results: crawlResult.results,
        totalPages: crawlResult.totalPages,
        currentPage: crawlResult.currentPage,
        totalResults: crawlResult.totalResults,
        fromCache: false
      });

      return sessionManager.getSession(sessionId).searches.find(s => s.id === searchState.id);

    } catch (error) {
      console.error(`[SearchService] Error during search:`, error);

      // به‌روزرسانی state با خطا
      sessionManager.updateSearchState(sessionId, searchState.id, {
        status: 'error',
        error: error.message
      });

      throw error;
    }
  }

  /**
   * ادامه جستجو (صفحه بعدی)
   */
  async continueSearch({ sessionId, searchId, page }) {
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const originalSearch = session.searches.find(s => s.id === searchId);
    if (!originalSearch) {
      throw new Error('Search not found');
    }

    // انجام جستجوی جدید با همان فیلترها ولی صفحه متفاوت
    return this.performSearch({
      sessionId,
      userId: session.userId,
      keywords: originalSearch.query,
      filters: originalSearch.filters,
      page
    });
  }

  // ✅ Crawler جدید خودش extraction رو انجام میده
  // متدهای _extractResults و _extractTotalPages دیگه لازم نیستن

  /**
   * نرمال‌سازی فیلترها برای orchestrator
   */
  _normalizeFilters(filters) {
    if (!filters) return {};

    return {
      disciplineToken: filters.discipline || filters.disciplineToken,
      subjectToken: filters.subject || filters.subjectToken,
      geoTokens: Array.isArray(filters.geography) ? filters.geography :
                 Array.isArray(filters.geoTokens) ? filters.geoTokens :
                 filters.geography ? [filters.geography] :
                 filters.geoTokens ? [filters.geoTokens] : [],
      fundingTokens: Array.isArray(filters.funding) ? filters.funding :
                     Array.isArray(filters.fundingTokens) ? filters.fundingTokens :
                     filters.funding ? [filters.funding] :
                     filters.fundingTokens ? [filters.fundingTokens] : [],
      institutionToken: filters.institution || filters.institutionToken,
      phdTypeToken: filters.phdType || filters.phdTypeToken,
      studyModeToken: filters.studyMode || filters.studyModeToken
    };
  }

  /**
   * نرمال‌سازی فیلترها برای crawler جدید
   */
  _normalizeFiltersForCrawler(filters) {
    if (!filters) return {};

    return {
      discipline: filters.discipline,
      country: filters.country || filters.geography,
      location: filters.location,
      institution: filters.institution,
      fundingType: filters.fundingType || filters.funding,
      studyType: filters.studyType || filters.studyMode
    };
  }

  /**
   * دریافت فیلترهای موجود
   */
  async getAvailableFilters() {
    const state = getState();
    
    return {
      disciplines: Object.values(state.disciplines || {}),
      subjects: Object.values(state.subjects || {}),
      geographies: Object.values(state.geos || {}),
      funding: Object.values(state.funding || {}),
      institutions: Object.values(state.institutions || {}),
      phdTypes: Object.values(state.phdTypes || {}),
      studyModes: Object.values(state.studyModes || {})
    };
  }

  /**
   * مدیریت کش
   */
  _getFromCache(key) {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // بررسی انقضا
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  _saveToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // پاکسازی کش قدیمی
    if (this.cache.size > 1000) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // حذف 20% قدیمی‌ترین‌ها
      const toDelete = Math.floor(this.cache.size * 0.2);
      for (let i = 0; i < toDelete; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  /**
   * پاکسازی کش
   */
  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
const searchService = new SearchService();

module.exports = searchService;
